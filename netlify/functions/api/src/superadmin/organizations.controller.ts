import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import type { OrganizationDetailDto, OrganizationSummaryDto } from "@hrm/shared";
import { SuperAdminGuard } from "../auth/guards/superadmin.guard";
import { AssignPlanDto } from "./dto/assign-plan.dto";
import { OrganizationsService } from "./organizations.service";

@Controller("superadmin/organizations")
@UseGuards(SuperAdminGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  findAll(): Promise<OrganizationSummaryDto[]> {
    return this.organizationsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string): Promise<OrganizationDetailDto> {
    return this.organizationsService.findOne(id);
  }

  @Post(":id/suspend")
  suspend(@Param("id") id: string): Promise<OrganizationSummaryDto> {
    return this.organizationsService.suspend(id);
  }

  @Post(":id/reactivate")
  reactivate(@Param("id") id: string): Promise<OrganizationSummaryDto> {
    return this.organizationsService.reactivate(id);
  }

  @Post(":id/plan")
  assignPlan(@Param("id") id: string, @Body() dto: AssignPlanDto): Promise<OrganizationSummaryDto> {
    return this.organizationsService.assignPlan(id, dto);
  }
}
