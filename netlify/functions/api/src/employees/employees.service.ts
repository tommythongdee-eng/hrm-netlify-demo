import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MembershipRole } from "@hrm/shared";
import type { EmployeeDetail, EmployeeSummary, SeveranceRecordDto } from "@hrm/shared";
import type { Employee, Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { EmailService } from "../email/email.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { InviteEmployeeDto } from "./dto/invite-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { calculateSeverance } from "./severance.util";

const BCRYPT_ROUNDS = 10;

type EmployeeWithDepartment = Employee & { department: { id: string; name: string } | null };

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async findAll(organizationId: string): Promise<EmployeeSummary[]> {
    const employees = await this.prisma.employee.findMany({
      where: { organizationId },
      include: { department: true },
      orderBy: [{ status: "asc" }, { firstName: "asc" }],
    });
    return employees.map((e) => this.toSummary(e));
  }

  async findOne(organizationId: string, id: string): Promise<EmployeeDetail> {
    const employee = await this.findEmployeeOrThrow(organizationId, id);
    return this.toDetail(employee);
  }

  // Used by other Phase 1 modules (attendance, leave, payroll) to resolve the
  // Employee record behind a logged-in self-service user.
  async findByUserId(organizationId: string, userId: string): Promise<Employee | null> {
    return this.prisma.employee.findFirst({ where: { organizationId, userId } });
  }

  async create(organizationId: string, dto: CreateEmployeeDto): Promise<EmployeeDetail> {
    await this.assertUnderEmployeeLimit(organizationId);
    await this.assertDepartmentBelongsToOrg(organizationId, dto.departmentId);
    await this.assertManagerBelongsToOrg(organizationId, dto.managerId);
    await this.assertProvidentFundOptInAllowed(organizationId, dto.providentFundOptIn);

    const employeeCode = await this.generateEmployeeCode(organizationId);

    const employee = await this.prisma.employee.create({
      data: {
        organizationId,
        employeeCode,
        firstName: dto.firstName,
        lastName: dto.lastName,
        firstNameTh: dto.firstNameTh,
        lastNameTh: dto.lastNameTh,
        nationalId: dto.nationalId,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        departmentId: dto.departmentId,
        position: dto.position,
        employmentType: dto.employmentType,
        managerId: dto.managerId,
        baseSalary: dto.baseSalary,
        bankName: dto.bankName,
        bankAccountNumber: dto.bankAccountNumber,
        startDate: new Date(dto.startDate),
        status: "ACTIVE",
        providentFundOptIn: dto.providentFundOptIn ?? false,
        providentFundEmployeeRate: dto.providentFundEmployeeRate,
      },
      include: { department: true },
    });

    return this.toDetail(employee);
  }

  async update(organizationId: string, id: string, dto: UpdateEmployeeDto): Promise<EmployeeDetail> {
    const existing = await this.findEmployeeOrThrow(organizationId, id);
    await this.assertDepartmentBelongsToOrg(organizationId, dto.departmentId);
    await this.assertManagerBelongsToOrg(organizationId, dto.managerId, id);
    await this.assertProvidentFundOptInAllowed(organizationId, dto.providentFundOptIn);

    // Unchecked update input accepts plain scalar FK fields (departmentId,
    // managerId) directly instead of nested relation connect/disconnect syntax.
    const data: Prisma.EmployeeUncheckedUpdateInput = { ...dto };
    if (dto.dateOfBirth !== undefined) data.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);

    const employee = await this.prisma.employee.update({
      where: { id },
      data,
      include: { department: true },
    });

    // Severance is calculated only on the transition INTO TERMINATED (not for
    // RESIGNED, and not re-triggered on every subsequent edit) — needs an
    // endDate to compute tenure against.
    if (dto.status === "TERMINATED" && existing.status !== "TERMINATED" && employee.endDate) {
      const { yearsOfService, daysOfPay, dailyRate, amount } = calculateSeverance(
        employee.startDate,
        employee.endDate,
        employee.baseSalary,
      );
      await this.prisma.severanceRecord.upsert({
        where: { employeeId: id },
        create: { organizationId, employeeId: id, yearsOfService, daysOfPay, dailyRate, amount },
        update: { yearsOfService, daysOfPay, dailyRate, amount, calculatedAt: new Date() },
      });
    }

    return this.toDetail(employee);
  }

  async getSeverance(organizationId: string, id: string): Promise<SeveranceRecordDto | null> {
    await this.findEmployeeOrThrow(organizationId, id);
    const record = await this.prisma.severanceRecord.findUnique({ where: { employeeId: id } });
    if (!record) return null;
    return {
      employeeId: record.employeeId,
      yearsOfService: record.yearsOfService,
      daysOfPay: record.daysOfPay,
      dailyRate: record.dailyRate,
      amount: record.amount,
      calculatedAt: record.calculatedAt.toISOString(),
    };
  }

  async invite(organizationId: string, id: string, dto: InviteEmployeeDto): Promise<EmployeeDetail> {
    const employee = await this.findEmployeeOrThrow(organizationId, id);
    if (employee.userId) {
      throw new ConflictException("This employee already has portal access");
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new ConflictException("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const organization = await this.prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });

    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: dto.email, passwordHash, name: `${employee.firstName} ${employee.lastName}` },
      });

      await tx.membership.create({
        data: { userId: user.id, organizationId, role: MembershipRole.EMPLOYEE },
      });

      return tx.employee.update({
        where: { id },
        data: { userId: user.id },
        include: { department: true },
      });
    });

    // Best-effort — a delivery failure (or no SMTP configured) doesn't undo
    // the account that was just created; see EmailService for the dev-mode
    // fallback when there's no real SMTP to send through.
    const webOrigin = this.configService.get<string>("WEB_ORIGIN", "http://localhost:3000").split(",")[0];
    await this.emailService.sendMail({
      to: dto.email,
      subject: `You've been invited to ${organization.name}'s HR portal`,
      html: `
        <p>Hi ${employee.firstName},</p>
        <p>HR has set up self-service portal access for you at <strong>${organization.name}</strong>.</p>
        <p>Log in at <a href="${webOrigin}/login">${webOrigin}/login</a> with:</p>
        <ul>
          <li>Email: ${dto.email}</li>
          <li>Password: ${dto.password}</li>
        </ul>
        <p>We'd recommend changing your password once a self-service password change is available.</p>
      `,
    });

    return this.toDetail(updated);
  }

  private async generateEmployeeCode(organizationId: string): Promise<string> {
    const count = await this.prisma.employee.count({ where: { organizationId } });
    let candidate = `EMP-${String(count + 1).padStart(4, "0")}`;
    let attempt = 0;
    while (await this.prisma.employee.findUnique({ where: { organizationId_employeeCode: { organizationId, employeeCode: candidate } } })) {
      attempt += 1;
      candidate = `EMP-${String(count + 1 + attempt).padStart(4, "0")}`;
    }
    return candidate;
  }

  private async assertProvidentFundOptInAllowed(organizationId: string, optIn: boolean | undefined): Promise<void> {
    if (!optIn) return;
    const settings = await this.prisma.payrollSettings.findUnique({ where: { organizationId } });
    if (!settings?.providentFundEnabled) {
      throw new BadRequestException("Provident fund is not enabled for this organization");
    }
  }

  private async findEmployeeOrThrow(organizationId: string, id: string): Promise<EmployeeWithDepartment> {
    const employee = await this.prisma.employee.findFirst({
      where: { id, organizationId },
      include: { department: true },
    });
    if (!employee) {
      throw new NotFoundException("Employee not found");
    }
    return employee;
  }

  // The one piece of real billing enforcement in this phase — no payment
  // gateway exists yet, but plan tiers still cap how many active employees
  // an organization can have. Orgs with no plan assigned (shouldn't happen
  // post-seed, but defensively) are left unrestricted rather than locked out.
  private async assertUnderEmployeeLimit(organizationId: string): Promise<void> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { plan: true },
    });
    if (!organization?.plan) return;

    const activeCount = await this.prisma.employee.count({
      where: { organizationId, status: "ACTIVE" },
    });
    if (activeCount >= organization.plan.maxEmployees) {
      throw new ForbiddenException(
        `Your ${organization.plan.name} plan allows up to ${organization.plan.maxEmployees} employees. Upgrade your plan to add more.`,
      );
    }
  }

  private async assertDepartmentBelongsToOrg(organizationId: string, departmentId?: string): Promise<void> {
    if (!departmentId) return;
    const department = await this.prisma.department.findFirst({ where: { id: departmentId, organizationId } });
    if (!department) {
      throw new BadRequestException("Department not found in this organization");
    }
  }

  private async assertManagerBelongsToOrg(
    organizationId: string,
    managerId?: string,
    selfId?: string,
  ): Promise<void> {
    if (!managerId) return;
    if (managerId === selfId) {
      throw new BadRequestException("An employee cannot be their own manager");
    }
    const manager = await this.prisma.employee.findFirst({ where: { id: managerId, organizationId } });
    if (!manager) {
      throw new BadRequestException("Manager not found in this organization");
    }
  }

  private toSummary(employee: EmployeeWithDepartment): EmployeeSummary {
    return {
      id: employee.id,
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      position: employee.position,
      employmentType: employee.employmentType as EmployeeSummary["employmentType"],
      status: employee.status as EmployeeSummary["status"],
      department: employee.department ? { id: employee.department.id, name: employee.department.name } : null,
      managerId: employee.managerId,
      hasPortalAccess: Boolean(employee.userId),
    };
  }

  private toDetail(employee: EmployeeWithDepartment): EmployeeDetail {
    return {
      ...this.toSummary(employee),
      firstNameTh: employee.firstNameTh,
      lastNameTh: employee.lastNameTh,
      nationalId: employee.nationalId,
      dateOfBirth: employee.dateOfBirth?.toISOString() ?? null,
      gender: employee.gender,
      email: employee.email,
      phone: employee.phone,
      address: employee.address,
      baseSalary: employee.baseSalary,
      bankName: employee.bankName,
      bankAccountNumber: employee.bankAccountNumber,
      startDate: employee.startDate.toISOString(),
      endDate: employee.endDate?.toISOString() ?? null,
      providentFundOptIn: employee.providentFundOptIn,
      providentFundEmployeeRate: employee.providentFundEmployeeRate,
    };
  }
}
