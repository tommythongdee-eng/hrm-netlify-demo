import { Injectable, NotFoundException } from "@nestjs/common";
import { RatingLevel } from "@hrm/shared";
import type { NineBoxGridDto } from "@hrm/shared";
import { PrismaService } from "../prisma/prisma.service";
import { UpsertTalentAssessmentDto } from "./dto/upsert-talent-assessment.dto";

const RATING_LEVELS = Object.values(RatingLevel);

@Injectable()
export class TalentAssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getGrid(organizationId: string): Promise<NineBoxGridDto> {
    const employees = await this.prisma.employee.findMany({
      where: { organizationId, status: "ACTIVE" },
      include: { talentAssessment: true },
    });

    const cells: NineBoxGridDto["cells"] = [];
    for (const potentialRating of RATING_LEVELS) {
      for (const performanceRating of RATING_LEVELS) {
        cells.push({ performanceRating, potentialRating, employees: [] });
      }
    }

    const unassessedEmployees: NineBoxGridDto["unassessedEmployees"] = [];

    for (const employee of employees) {
      const name = { employeeId: employee.id, employeeName: `${employee.firstName} ${employee.lastName}` };
      if (!employee.talentAssessment) {
        unassessedEmployees.push(name);
        continue;
      }
      const cell = cells.find(
        (c) =>
          c.performanceRating === employee.talentAssessment!.performanceRating &&
          c.potentialRating === employee.talentAssessment!.potentialRating,
      );
      cell?.employees.push(name);
    }

    return { cells, unassessedEmployees };
  }

  async upsert(
    organizationId: string,
    assessedByUserId: string,
    employeeId: string,
    dto: UpsertTalentAssessmentDto,
  ): Promise<void> {
    const employee = await this.prisma.employee.findFirst({ where: { id: employeeId, organizationId } });
    if (!employee) {
      throw new NotFoundException("Employee not found");
    }

    await this.prisma.talentAssessment.upsert({
      where: { employeeId },
      create: {
        organizationId,
        employeeId,
        performanceRating: dto.performanceRating,
        potentialRating: dto.potentialRating,
        notes: dto.notes,
        assessedByUserId,
      },
      update: {
        performanceRating: dto.performanceRating,
        potentialRating: dto.potentialRating,
        notes: dto.notes,
        assessedByUserId,
        assessedAt: new Date(),
      },
    });
  }
}
