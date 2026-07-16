import { Injectable } from "@nestjs/common";
import type { BillingSummaryDto, PlanDto } from "@hrm/shared";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(organizationId: string): Promise<BillingSummaryDto> {
    const organization = await this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      include: { plan: true },
    });
    const employeeCount = await this.prisma.employee.count({
      where: { organizationId, status: "ACTIVE" },
    });

    return {
      plan: organization.plan
        ? {
            id: organization.plan.id,
            code: organization.plan.code,
            name: organization.plan.name,
            maxEmployees: organization.plan.maxEmployees,
            priceThbPerMonth: organization.plan.priceThbPerMonth,
          }
        : null,
      subscriptionStatus: organization.subscriptionStatus as BillingSummaryDto["subscriptionStatus"],
      employeeCount,
    };
  }

  async listPlans(): Promise<PlanDto[]> {
    const plans = await this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceThbPerMonth: "asc" },
    });
    return plans.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      maxEmployees: p.maxEmployees,
      priceThbPerMonth: p.priceThbPerMonth,
    }));
  }
}
