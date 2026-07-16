import { Controller, Get, UseGuards } from "@nestjs/common";
import type { PlanDto } from "@hrm/shared";
import { SuperAdminGuard } from "../auth/guards/superadmin.guard";
import { PrismaService } from "../prisma/prisma.service";

@Controller("superadmin/plans")
@UseGuards(SuperAdminGuard)
export class PlansController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(): Promise<PlanDto[]> {
    const plans = await this.prisma.plan.findMany({ orderBy: { priceThbPerMonth: "asc" } });
    return plans.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      maxEmployees: p.maxEmployees,
      priceThbPerMonth: p.priceThbPerMonth,
    }));
  }
}
