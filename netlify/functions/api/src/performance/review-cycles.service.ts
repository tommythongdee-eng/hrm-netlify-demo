import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { ReviewCycleDto } from "@hrm/shared";
import { PrismaService } from "../prisma/prisma.service";
import { CreateReviewCycleDto } from "./dto/create-review-cycle.dto";

@Injectable()
export class ReviewCyclesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string): Promise<ReviewCycleDto[]> {
    const cycles = await this.prisma.reviewCycle.findMany({
      where: { organizationId },
      orderBy: { startDate: "desc" },
    });
    return cycles.map((c) => this.toDto(c));
  }

  async create(organizationId: string, dto: CreateReviewCycleDto): Promise<ReviewCycleDto> {
    const cycle = await this.prisma.reviewCycle.create({
      data: {
        organizationId,
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        status: "DRAFT",
      },
    });
    return this.toDto(cycle);
  }

  // Activating a cycle creates a PerformanceReview row (NOT_STARTED) for every
  // active employee, so nothing needs to be manually seeded per-employee.
  async activate(organizationId: string, id: string): Promise<ReviewCycleDto> {
    const cycle = await this.findCycleOrThrow(organizationId, id);
    if (cycle.status !== "DRAFT") {
      throw new BadRequestException("Only a draft cycle can be activated");
    }

    const employees = await this.prisma.employee.findMany({
      where: { organizationId, status: "ACTIVE" },
      select: { id: true },
    });

    await this.prisma.$transaction([
      this.prisma.reviewCycle.update({ where: { id }, data: { status: "ACTIVE" } }),
      this.prisma.performanceReview.createMany({
        data: employees.map((e) => ({
          organizationId,
          cycleId: id,
          employeeId: e.id,
          status: "NOT_STARTED",
        })),
      }),
    ]);

    return this.toDto({ ...cycle, status: "ACTIVE" });
  }

  async close(organizationId: string, id: string): Promise<ReviewCycleDto> {
    const cycle = await this.findCycleOrThrow(organizationId, id);
    const updated = await this.prisma.reviewCycle.update({ where: { id }, data: { status: "CLOSED" } });
    return this.toDto(updated);
  }

  private async findCycleOrThrow(organizationId: string, id: string) {
    const cycle = await this.prisma.reviewCycle.findFirst({ where: { id, organizationId } });
    if (!cycle) {
      throw new NotFoundException("Review cycle not found");
    }
    return cycle;
  }

  private toDto(cycle: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    status: string;
  }): ReviewCycleDto {
    return {
      id: cycle.id,
      name: cycle.name,
      startDate: cycle.startDate.toISOString(),
      endDate: cycle.endDate.toISOString(),
      status: cycle.status as ReviewCycleDto["status"],
    };
  }
}
