import { Body, Controller, Get, HttpCode, HttpStatus, Param, Put, UseGuards } from "@nestjs/common";
import type { NineBoxGridDto } from "@hrm/shared";
import { MembershipRole } from "@hrm/shared";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { RequestUser } from "../auth/request-context";
import { UpsertTalentAssessmentDto } from "./dto/upsert-talent-assessment.dto";
import { TalentAssessmentsService } from "./talent-assessments.service";

// Entirely HR/Owner — 9-box/succession data is confidential HR material with
// no self-service or manager visibility.
@Controller("succession/talent-assessments")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(MembershipRole.OWNER, MembershipRole.HR_ADMIN)
export class TalentAssessmentsController {
  constructor(private readonly talentAssessmentsService: TalentAssessmentsService) {}

  @Get("grid")
  getGrid(@CurrentUser() user: RequestUser): Promise<NineBoxGridDto> {
    return this.talentAssessmentsService.getGrid(user.organizationId);
  }

  @Put(":employeeId")
  @HttpCode(HttpStatus.NO_CONTENT)
  upsert(
    @CurrentUser() user: RequestUser,
    @Param("employeeId") employeeId: string,
    @Body() dto: UpsertTalentAssessmentDto,
  ): Promise<void> {
    return this.talentAssessmentsService.upsert(user.organizationId, user.sub, employeeId, dto);
  }
}
