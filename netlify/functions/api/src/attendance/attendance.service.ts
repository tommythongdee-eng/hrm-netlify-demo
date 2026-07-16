import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { AttendanceRecordDto } from "@hrm/shared";
import type { AttendanceRecord, Employee } from "@prisma/client";
import { startOfDayUtc } from "../common/date.util";
import { EmployeesService } from "../employees/employees.service";
import { PrismaService } from "../prisma/prisma.service";
import { ManualAttendanceDto } from "./dto/manual-attendance.dto";

type RecordWithEmployee = AttendanceRecord & { employee: Pick<Employee, "firstName" | "lastName"> };

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employeesService: EmployeesService,
  ) {}

  async clockIn(organizationId: string, userId: string): Promise<AttendanceRecordDto> {
    const employee = await this.requireSelfServiceEmployee(organizationId, userId);
    const today = startOfDayUtc();

    const existing = await this.prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date: today } },
    });
    if (existing?.clockIn) {
      throw new ConflictException("Already clocked in today");
    }

    const record = await this.prisma.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId: employee.id, date: today } },
      create: {
        employeeId: employee.id,
        organizationId,
        date: today,
        clockIn: new Date(),
        source: "SELF_SERVICE",
      },
      update: { clockIn: new Date(), source: "SELF_SERVICE" },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });

    return this.toDto(record);
  }

  async clockOut(organizationId: string, userId: string): Promise<AttendanceRecordDto> {
    const employee = await this.requireSelfServiceEmployee(organizationId, userId);
    const today = startOfDayUtc();

    const existing = await this.prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date: today } },
    });
    if (!existing?.clockIn) {
      throw new BadRequestException("Clock in before clocking out");
    }
    if (existing.clockOut) {
      throw new ConflictException("Already clocked out today");
    }

    const record = await this.prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: { clockOut: new Date() },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });

    return this.toDto(record);
  }

  async myHistory(organizationId: string, userId: string): Promise<AttendanceRecordDto[]> {
    const employee = await this.requireSelfServiceEmployee(organizationId, userId);
    return this.listForEmployee(organizationId, employee.id);
  }

  async listForEmployee(organizationId: string, employeeId: string): Promise<AttendanceRecordDto[]> {
    const records = await this.prisma.attendanceRecord.findMany({
      where: { organizationId, employeeId },
      include: { employee: { select: { firstName: true, lastName: true } } },
      orderBy: { date: "desc" },
      take: 60,
    });
    return records.map((r) => this.toDto(r));
  }

  async listAll(organizationId: string): Promise<AttendanceRecordDto[]> {
    const records = await this.prisma.attendanceRecord.findMany({
      where: { organizationId },
      include: { employee: { select: { firstName: true, lastName: true } } },
      orderBy: { date: "desc" },
      take: 200,
    });
    return records.map((r) => this.toDto(r));
  }

  async manualUpsert(organizationId: string, dto: ManualAttendanceDto): Promise<AttendanceRecordDto> {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, organizationId },
    });
    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    const date = startOfDayUtc(new Date(dto.date));
    const record = await this.prisma.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId: dto.employeeId, date } },
      create: {
        employeeId: dto.employeeId,
        organizationId,
        date,
        clockIn: dto.clockIn ? new Date(dto.clockIn) : undefined,
        clockOut: dto.clockOut ? new Date(dto.clockOut) : undefined,
        note: dto.note,
        source: "MANUAL",
      },
      update: {
        clockIn: dto.clockIn ? new Date(dto.clockIn) : null,
        clockOut: dto.clockOut ? new Date(dto.clockOut) : null,
        note: dto.note,
        source: "MANUAL",
      },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });

    return this.toDto(record);
  }

  private async requireSelfServiceEmployee(organizationId: string, userId: string): Promise<Employee> {
    const employee = await this.employeesService.findByUserId(organizationId, userId);
    if (!employee) {
      throw new NotFoundException("Your account isn't linked to an employee record yet");
    }
    return employee;
  }

  private toDto(record: RecordWithEmployee): AttendanceRecordDto {
    return {
      id: record.id,
      employeeId: record.employeeId,
      employeeName: `${record.employee.firstName} ${record.employee.lastName}`,
      date: record.date.toISOString(),
      clockIn: record.clockIn?.toISOString() ?? null,
      clockOut: record.clockOut?.toISOString() ?? null,
      source: record.source as AttendanceRecordDto["source"],
      note: record.note,
    };
  }
}
