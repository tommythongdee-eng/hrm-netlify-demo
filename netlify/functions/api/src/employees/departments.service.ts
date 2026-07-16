import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { DepartmentDto } from "@hrm/shared";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDepartmentDto } from "./dto/create-department.dto";

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string): Promise<DepartmentDto[]> {
    const departments = await this.prisma.department.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });
    return departments.map((d) => ({ id: d.id, name: d.name }));
  }

  async create(organizationId: string, dto: CreateDepartmentDto): Promise<DepartmentDto> {
    const existing = await this.prisma.department.findUnique({
      where: { organizationId_name: { organizationId, name: dto.name } },
    });
    if (existing) {
      throw new ConflictException("A department with this name already exists");
    }
    const department = await this.prisma.department.create({
      data: { organizationId, name: dto.name },
    });
    return { id: department.id, name: department.name };
  }

  async remove(organizationId: string, id: string): Promise<void> {
    const department = await this.prisma.department.findFirst({ where: { id, organizationId } });
    if (!department) {
      throw new NotFoundException("Department not found");
    }
    await this.prisma.department.delete({ where: { id } });
  }
}
