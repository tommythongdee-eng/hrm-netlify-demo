import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { MembershipRole } from "@hrm/shared";
import type { AuthResponse, AuthenticatedUser, SuperAdminAuthResponse } from "@hrm/shared";
import { PrismaService } from "../prisma/prisma.service";
import { seedOrganizationDefaults } from "../organizations/seed-defaults";
import { LoginDto } from "./dto/login.dto";
import { RegisterOrganizationDto } from "./dto/register-organization.dto";
import { parseDurationToMs } from "./duration.util";
import type { RequestUser } from "./request-context";
import type { SuperAdminUser } from "./superadmin-request-context";

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async registerOrganization(dto: RegisterOrganizationDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new ConflictException("An account with this email already exists");
    }

    const slug = await this.generateUniqueSlug(dto.organizationName);
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    // No signup flow chooses a plan yet (no payment gateway) — everyone starts
    // on FREE; a superadmin can move an org to a higher tier from the console.
    const freePlan = await this.prisma.plan.findUnique({ where: { code: "FREE" } });

    const { user, organization, role } = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: dto.organizationName, slug, planId: freePlan?.id },
      });

      const user = await tx.user.create({
        data: { email: dto.email, passwordHash, name: dto.ownerName },
      });

      await tx.membership.create({
        data: { userId: user.id, organizationId: organization.id, role: MembershipRole.OWNER },
      });

      await seedOrganizationDefaults(tx, organization.id);

      return { user, organization, role: MembershipRole.OWNER };
    });

    return this.issueSession(user.id, user.email, user.name, organization.id, organization.name, role);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { memberships: { include: { organization: true } } },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid email or password");
    }

    // Phase 0 assumes a single membership per user (one org owns the account).
    // Multi-org membership + an org switcher is a Phase 1+ concern.
    const membership = user.memberships[0];
    if (!membership) {
      throw new ForbiddenException("This account is not a member of any organization");
    }
    if (membership.organization.status === "SUSPENDED") {
      throw new ForbiddenException("This organization's account has been suspended");
    }

    return this.issueSession(
      user.id,
      user.email,
      user.name,
      membership.organizationId,
      membership.organization.name,
      membership.role as MembershipRole,
    );
  }

  // Deliberately no refresh token here — an internal ops console, not a
  // customer-facing session; re-login when the short-lived token expires.
  async superadminLogin(dto: LoginDto): Promise<SuperAdminAuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.isSuperAdmin) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const payload: SuperAdminUser = { sub: user.id, isSuperAdmin: true };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>("JWT_ACCESS_SECRET"),
      expiresIn: this.configService.get<string>("JWT_ACCESS_EXPIRES_IN", "15m"),
    });

    return { accessToken, name: user.name };
  }

  async refresh(rawToken: string): Promise<AuthResponse> {
    const tokenHash = this.hashToken(rawToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { memberships: { include: { organization: true } } } } },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const membership = stored.user.memberships[0];
    if (!membership) {
      throw new ForbiddenException("This account is not a member of any organization");
    }
    if (membership.organization.status === "SUSPENDED") {
      throw new ForbiddenException("This organization's account has been suspended");
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueSession(
      stored.user.id,
      stored.user.email,
      stored.user.name,
      membership.organizationId,
      membership.organization.name,
      membership.role as MembershipRole,
    );
  }

  async getCurrentUser(requestUser: RequestUser): Promise<AuthenticatedUser> {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: requestUser.sub,
          organizationId: requestUser.organizationId,
        },
      },
      include: { user: true, organization: true },
    });

    if (!membership) {
      throw new UnauthorizedException("Membership no longer exists");
    }

    return {
      id: membership.user.id,
      email: membership.user.email,
      name: membership.user.name,
      organizationId: membership.organizationId,
      organizationName: membership.organization.name,
      role: membership.role as MembershipRole,
    };
  }

  private async issueSession(
    userId: string,
    email: string,
    name: string,
    organizationId: string,
    organizationName: string,
    role: MembershipRole,
  ): Promise<AuthResponse> {
    const payload: RequestUser = { sub: userId, email, organizationId, role };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>("JWT_ACCESS_SECRET"),
      expiresIn: this.configService.get<string>("JWT_ACCESS_EXPIRES_IN", "15m"),
    });

    const refreshToken = crypto.randomBytes(48).toString("hex");
    const refreshExpiresIn = this.configService.get<string>("JWT_REFRESH_EXPIRES_IN", "7d");

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + parseDurationToMs(refreshExpiresIn)),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email,
        name,
        organizationId,
        organizationName,
        role,
      },
    };
  }

  private hashToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  }

  private async generateUniqueSlug(organizationName: string): Promise<string> {
    const base = organizationName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "org";

    let candidate = base;
    let attempt = 0;

    while (await this.prisma.organization.findUnique({ where: { slug: candidate } })) {
      attempt += 1;
      candidate = `${base}-${crypto.randomBytes(3).toString("hex")}`;
      if (attempt > 5) break;
    }

    return candidate;
  }
}
