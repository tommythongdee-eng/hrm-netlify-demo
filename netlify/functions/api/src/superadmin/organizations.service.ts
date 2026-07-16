import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { OrganizationDetailDto, OrganizationSummaryDto } from "@hrm/shared";
import { PrismaService } from "../prisma/prisma.service";
import { AssignPlanDto } from "./dto/assign-plan.dto";

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<OrganizationSummaryDto[]> {
    const organizations = await this.prisma.organization.findMany({
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    return Promise.all(organizations.map((org) => this.toSummary(org)));
  }

  async findOne(id: string): Promise<OrganizationDetailDto> {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        plan: true,
        memberships: { include: { user: true } },
      },
    });
    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    const summary = await this.toSummary(organization);
    return {
      ...summary,
      memberships: organization.memberships.map((m) => ({
        userId: m.userId,
        userName: m.user.name,
        userEmail: m.user.email,
        role: m.role,
      })),
    };
  }

  async suspend(id: string): Promise<OrganizationSummaryDto> {
    await this.findOrgOrThrow(id);
    const organization = await this.prisma.organization.update({
      where: { id },
      data: { status: "SUSPENDED" },
      include: { plan: true },
    });
    return this.toSummary(organization);
  }

  async reactivate(id: string): Promise<OrganizationSummaryDto> {
    await this.findOrgOrThrow(id);
    const organization = await this.prisma.organization.update({
      where: { id },
      data: { status: "ACTIVE" },
      include: { plan: true },
    });
    return this.toSummary(organization);
  }

  async assignPlan(id: string, dto: AssignPlanDto): Promise<OrganizationSummaryDto> {
    await this.findOrgOrThrow(id);
    const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
    if (!plan) {
      throw new BadRequestException("Plan not found");
    }
    const organization = await this.prisma.organization.update({
      where: { id },
      data: { planId: dto.planId },
      include: { plan: true },
    });
    return this.toSummary(organization);
  }

  private async findOrgOrThrow(id: string) {
    const organization = await this.prisma.organization.findUnique({ where: { id } });
    if (!organization) {
      throw new NotFoundException("Organization not found");
    }
    return organization;
  }

  private async toSummary(org: {
    id: string;
    name: string;
    slug: string;
    status: string;
    subscriptionStatus: string;
    createdAt: Date;
    plan: { name: string } | null;
  }): Promise<OrganizationSummaryDto> {
    const employeeCount = await this.prisma.employee.count({
      where: { organizationId: org.id, status: "ACTIVE" },
    });
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      status: org.status as OrganizationSummaryDto["status"],
      subscriptionStatus: org.subscriptionStatus as OrganizationSummaryDto["subscriptionStatus"],
      planName: org.plan?.name ?? null,
      employeeCount,
      createdAt: org.createdAt.toISOString(),
    };
  }
}
