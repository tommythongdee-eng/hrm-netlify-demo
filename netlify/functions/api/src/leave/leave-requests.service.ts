import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { MembershipRole } from "@hrm/shared";
import type { LeaveBalanceDto, LeaveRequestDto } from "@hrm/shared";
import type { Employee, LeaveBalance, LeaveRequest, LeaveType, Prisma } from "@prisma/client";
import { eachDateInRange, isWeekend, parseDateOnly } from "../common/date.util";
import { EmployeesService } from "../employees/employees.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLeaveRequestDto } from "./dto/create-leave-request.dto";

type RequestWithRelations = LeaveRequest & {
  employee: Pick<Employee, "firstName" | "lastName" | "managerId">;
  leaveType: Pick<LeaveType, "name">;
};

@Injectable()
export class LeaveRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employeesService: EmployeesService,
  ) {}

  async myBalances(organizationId: string, userId: string): Promise<LeaveBalanceDto[]> {
    const employee = await this.requireSelfServiceEmployee(organizationId, userId);
    return this.balancesForEmployee(organizationId, employee.id);
  }

  async balancesForEmployee(organizationId: string, employeeId: string): Promise<LeaveBalanceDto[]> {
    const year = new Date().getFullYear();
    const leaveTypes = await this.prisma.leaveType.findMany({ where: { organizationId } });

    return Promise.all(
      leaveTypes.map(async (leaveType) => {
        const balance = await this.getOrCreateBalance(employeeId, leaveType, year);
        return {
          leaveTypeId: leaveType.id,
          leaveTypeName: leaveType.name,
          year,
          allocatedDays: balance.allocatedDays,
          usedDays: balance.usedDays,
          remainingDays: balance.allocatedDays - balance.usedDays,
        };
      }),
    );
  }

  async myRequests(organizationId: string, userId: string): Promise<LeaveRequestDto[]> {
    const employee = await this.requireSelfServiceEmployee(organizationId, userId);
    const requests = await this.prisma.leaveRequest.findMany({
      where: { organizationId, employeeId: employee.id },
      include: {
        employee: { select: { firstName: true, lastName: true, managerId: true } },
        leaveType: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return requests.map((r) => this.toDto(r));
  }

  async pendingApprovals(
    organizationId: string,
    userId: string,
    role: MembershipRole,
  ): Promise<LeaveRequestDto[]> {
    const isHrOrOwner = role === MembershipRole.OWNER || role === MembershipRole.HR_ADMIN;
    const actingEmployee = await this.employeesService.findByUserId(organizationId, userId);

    const where: Prisma.LeaveRequestWhereInput = isHrOrOwner
      ? { organizationId, status: "PENDING" }
      : { organizationId, status: "PENDING", employee: { managerId: actingEmployee?.id ?? "__none__" } };

    const requests = await this.prisma.leaveRequest.findMany({
      where,
      include: {
        employee: { select: { firstName: true, lastName: true, managerId: true } },
        leaveType: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return requests.map((r) => this.toDto(r));
  }

  async create(organizationId: string, userId: string, dto: CreateLeaveRequestDto): Promise<LeaveRequestDto> {
    const employee = await this.requireSelfServiceEmployee(organizationId, userId);

    const leaveType = await this.prisma.leaveType.findFirst({
      where: { id: dto.leaveTypeId, organizationId },
    });
    if (!leaveType) {
      throw new BadRequestException("Leave type not found in this organization");
    }

    const startDate = parseDateOnly(dto.startDate);
    const endDate = parseDateOnly(dto.endDate);
    if (endDate < startDate) {
      throw new BadRequestException("endDate must be on or after startDate");
    }

    const daysCount = await this.computeWorkingDays(organizationId, startDate, endDate);
    if (daysCount === 0) {
      throw new BadRequestException("The selected range has no working days (all weekends/holidays)");
    }

    const balance = await this.getOrCreateBalance(employee.id, leaveType, startDate.getUTCFullYear());
    const remaining = balance.allocatedDays - balance.usedDays;
    if (daysCount > remaining) {
      throw new BadRequestException(
        `Insufficient balance: requested ${daysCount} day(s) but only ${remaining} remaining for ${leaveType.name}`,
      );
    }

    const request = await this.prisma.leaveRequest.create({
      data: {
        employeeId: employee.id,
        leaveTypeId: leaveType.id,
        organizationId,
        startDate,
        endDate,
        daysCount,
        reason: dto.reason,
        status: "PENDING",
      },
      include: {
        employee: { select: { firstName: true, lastName: true, managerId: true } },
        leaveType: { select: { name: true } },
      },
    });

    return this.toDto(request);
  }

  async respond(
    organizationId: string,
    actingUserId: string,
    actingRole: MembershipRole,
    requestId: string,
    decision: "APPROVED" | "REJECTED",
  ): Promise<LeaveRequestDto> {
    const request = await this.prisma.leaveRequest.findFirst({
      where: { id: requestId, organizationId },
      include: { employee: true, leaveType: true },
    });
    if (!request) {
      throw new NotFoundException("Leave request not found");
    }
    if (request.status !== "PENDING") {
      throw new ConflictException("This request has already been responded to");
    }

    const isHrOrOwner = actingRole === MembershipRole.OWNER || actingRole === MembershipRole.HR_ADMIN;
    if (!isHrOrOwner) {
      const actingEmployee = await this.employeesService.findByUserId(organizationId, actingUserId);
      if (!actingEmployee || actingEmployee.id !== request.employee.managerId) {
        throw new ForbiddenException("Only the requester's manager or HR can respond to this request");
      }
    }

    if (decision === "APPROVED") {
      const balance = await this.getOrCreateBalance(
        request.employeeId,
        request.leaveType,
        request.startDate.getUTCFullYear(),
      );
      await this.prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { usedDays: balance.usedDays + request.daysCount },
      });
    }

    const updated = await this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: decision, respondedByUserId: actingUserId, respondedAt: new Date() },
      include: {
        employee: { select: { firstName: true, lastName: true, managerId: true } },
        leaveType: { select: { name: true } },
      },
    });

    return this.toDto(updated);
  }

  async cancel(organizationId: string, userId: string, requestId: string): Promise<LeaveRequestDto> {
    const employee = await this.requireSelfServiceEmployee(organizationId, userId);
    const request = await this.prisma.leaveRequest.findFirst({
      where: { id: requestId, organizationId, employeeId: employee.id },
    });
    if (!request) {
      throw new NotFoundException("Leave request not found");
    }
    if (request.status !== "PENDING") {
      throw new ConflictException("Only pending requests can be cancelled");
    }

    const updated = await this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: "CANCELLED", respondedAt: new Date() },
      include: {
        employee: { select: { firstName: true, lastName: true, managerId: true } },
        leaveType: { select: { name: true } },
      },
    });
    return this.toDto(updated);
  }

  private async computeWorkingDays(organizationId: string, startDate: Date, endDate: Date): Promise<number> {
    const holidays = await this.prisma.publicHoliday.findMany({
      where: { organizationId, date: { gte: startDate, lte: endDate } },
    });
    const holidaySet = new Set(holidays.map((h) => h.date.toISOString().slice(0, 10)));

    return eachDateInRange(startDate, endDate).filter(
      (d) => !isWeekend(d) && !holidaySet.has(d.toISOString().slice(0, 10)),
    ).length;
  }

  private async getOrCreateBalance(
    employeeId: string,
    leaveType: LeaveType,
    year: number,
  ): Promise<LeaveBalance> {
    const existing = await this.prisma.leaveBalance.findUnique({
      where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId: leaveType.id, year } },
    });
    if (existing) return existing;

    return this.prisma.leaveBalance.create({
      data: {
        employeeId,
        leaveTypeId: leaveType.id,
        organizationId: leaveType.organizationId,
        year,
        allocatedDays: leaveType.defaultDaysPerYear,
        usedDays: 0,
      },
    });
  }

  private async requireSelfServiceEmployee(organizationId: string, userId: string): Promise<Employee> {
    const employee = await this.employeesService.findByUserId(organizationId, userId);
    if (!employee) {
      throw new NotFoundException("Your account isn't linked to an employee record yet");
    }
    return employee;
  }

  private toDto(request: RequestWithRelations): LeaveRequestDto {
    return {
      id: request.id,
      employeeId: request.employeeId,
      employeeName: `${request.employee.firstName} ${request.employee.lastName}`,
      leaveTypeId: request.leaveTypeId,
      leaveTypeName: request.leaveType.name,
      startDate: request.startDate.toISOString(),
      endDate: request.endDate.toISOString(),
      daysCount: request.daysCount,
      reason: request.reason,
      status: request.status as LeaveRequestDto["status"],
      createdAt: request.createdAt.toISOString(),
    };
  }
}
