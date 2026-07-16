import { ConflictException, Injectable } from "@nestjs/common";
import type { LeaveTypeDto } from "@hrm/shared";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLeaveTypeDto } from "./dto/create-leave-type.dto";

@Injectable()
export class LeaveTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string): Promise<LeaveTypeDto[]> {
    const types = await this.prisma.leaveType.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });
    return types.map((t) => this.toDto(t));
  }

  async create(organizationId: string, dto: CreateLeaveTypeDto): Promise<LeaveTypeDto> {
    const existing = await this.prisma.leaveType.findUnique({
      where: { organizationId_code: { organizationId, code: dto.code } },
    });
    if (existing) {
      throw new ConflictException("A leave type with this code already exists");
    }
    const type = await this.prisma.leaveType.create({
      data: {
        organizationId,
        name: dto.name,
        code: dto.code,
        defaultDaysPerYear: dto.defaultDaysPerYear,
        requiresApproval: dto.requiresApproval ?? true,
        isPaid: dto.isPaid ?? true,
      },
    });
    return this.toDto(type);
  }

  private toDto(type: {
    id: string;
    name: string;
    code: string;
    defaultDaysPerYear: number;
    requiresApproval: boolean;
    isPaid: boolean;
  }): LeaveTypeDto {
    return {
      id: type.id,
      name: type.name,
      code: type.code,
      defaultDaysPerYear: type.defaultDaysPerYear,
      requiresApproval: type.requiresApproval,
      isPaid: type.isPaid,
    };
  }
}
