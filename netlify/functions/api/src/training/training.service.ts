import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { MembershipRole } from "@hrm/shared";
import type { TrainingRecordDto } from "@hrm/shared";
import type { Employee, TrainingRecord } from "@prisma/client";
import { EmployeesService } from "../employees/employees.service";
import { PrismaService } from "../prisma/prisma.service";
import { LogTrainingDto } from "./dto/log-training.dto";
import { LogTrainingForEmployeeDto } from "./dto/log-training-for-employee.dto";

type RecordWithEmployee = TrainingRecord & { employee: Pick<Employee, "firstName" | "lastName"> };

@Injectable()
export class TrainingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employeesService: EmployeesService,
  ) {}

  async myRecords(organizationId: string, userId: string): Promise<TrainingRecordDto[]> {
    const employee = await this.requireSelfServiceEmployee(organizationId, userId);
    return this.listForEmployee(organizationId, employee.id);
  }

  async logMine(organizationId: string, userId: string, dto: LogTrainingDto): Promise<TrainingRecordDto> {
    const employee = await this.requireSelfServiceEmployee(organizationId, userId);
    return this.create(organizationId, employee.id, userId, dto);
  }

  async logForEmployee(
    organizationId: string,
    actingUserId: string,
    actingRole: MembershipRole,
    dto: LogTrainingForEmployeeDto,
  ): Promise<TrainingRecordDto> {
    await this.assertCanManage(organizationId, actingUserId, actingRole, dto.employeeId);
    const { employeeId, ...rest } = dto;
    return this.create(organizationId, employeeId, actingUserId, rest);
  }

  async listAll(organizationId: string, actingUserId: string, actingRole: MembershipRole): Promise<TrainingRecordDto[]> {
    const isHrOrOwner = actingRole === MembershipRole.OWNER || actingRole === MembershipRole.HR_ADMIN;
    if (isHrOrOwner) {
      const records = await this.prisma.trainingRecord.findMany({
        where: { organizationId },
        include: { employee: { select: { firstName: true, lastName: true } } },
        orderBy: { completionDate: "desc" },
      });
      return records.map((r) => this.toDto(r));
    }

    const actingEmployee = await this.employeesService.findByUserId(organizationId, actingUserId);
    const records = await this.prisma.trainingRecord.findMany({
      where: { organizationId, employee: { managerId: actingEmployee?.id ?? "__none__" } },
      include: { employee: { select: { firstName: true, lastName: true } } },
      orderBy: { completionDate: "desc" },
    });
    return records.map((r) => this.toDto(r));
  }

  async listForEmployeeAsManager(
    organizationId: string,
    actingUserId: string,
    actingRole: MembershipRole,
    employeeId: string,
  ): Promise<TrainingRecordDto[]> {
    await this.assertCanManage(organizationId, actingUserId, actingRole, employeeId);
    return this.listForEmployee(organizationId, employeeId);
  }

  private async listForEmployee(organizationId: string, employeeId: string): Promise<TrainingRecordDto[]> {
    const records = await this.prisma.trainingRecord.findMany({
      where: { organizationId, employeeId },
      include: { employee: { select: { firstName: true, lastName: true } } },
      orderBy: { completionDate: "desc" },
    });
    return records.map((r) => this.toDto(r));
  }

  private async create(
    organizationId: string,
    employeeId: string,
    createdByUserId: string,
    dto: LogTrainingDto,
  ): Promise<TrainingRecordDto> {
    const record = await this.prisma.trainingRecord.create({
      data: {
        organizationId,
        employeeId,
        title: dto.title,
        provider: dto.provider,
        category: dto.category,
        completionDate: new Date(dto.completionDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        hours: dto.hours,
        notes: dto.notes,
        createdByUserId,
      },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });
    return this.toDto(record);
  }

  private async assertCanManage(
    organizationId: string,
    actingUserId: string,
    actingRole: MembershipRole,
    employeeId: string,
  ): Promise<void> {
    const isHrOrOwner = actingRole === MembershipRole.OWNER || actingRole === MembershipRole.HR_ADMIN;
    if (isHrOrOwner) return;

    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId } });
    if (!employee) {
      throw new NotFoundException("Employee not found");
    }
    const actingEmployee = await this.employeesService.findByUserId(organizationId, actingUserId);
    if (!actingEmployee || employee.managerId !== actingEmployee.id) {
      throw new ForbiddenException("You can only manage training records for your direct reports");
    }
  }

  private async requireSelfServiceEmployee(organizationId: string, userId: string): Promise<Employee> {
    const employee = await this.employeesService.findByUserId(organizationId, userId);
    if (!employee) {
      throw new NotFoundException("Your account isn't linked to an employee record yet");
    }
    return employee;
  }

  private toDto(record: RecordWithEmployee): TrainingRecordDto {
    return {
      id: record.id,
      employeeId: record.employeeId,
      employeeName: `${record.employee.firstName} ${record.employee.lastName}`,
      title: record.title,
      provider: record.provider,
      category: record.category as TrainingRecordDto["category"],
      completionDate: record.completionDate.toISOString(),
      expiryDate: record.expiryDate?.toISOString() ?? null,
      hours: record.hours,
      notes: record.notes,
    };
  }
}
