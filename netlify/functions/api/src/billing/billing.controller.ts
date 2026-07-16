import { Controller, Get, UseGuards } from "@nestjs/common";
import type { BillingSummaryDto, PlanDto } from "@hrm/shared";
import { MembershipRole } from "@hrm/shared";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { RequestUser } from "../auth/request-context";
import { BillingService } from "./billing.service";

@Controller("billing")
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get("plan")
  @Roles(MembershipRole.OWNER)
  getSummary(@CurrentUser() user: RequestUser): Promise<BillingSummaryDto> {
    return this.billingService.getSummary(user.organizationId);
  }

  @Get("plans")
  listPlans(): Promise<PlanDto[]> {
    return this.billingService.listPlans();
  }
}
