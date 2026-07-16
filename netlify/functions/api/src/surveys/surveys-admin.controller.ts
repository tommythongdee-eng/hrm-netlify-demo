import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import type { SurveyDto, SurveyResultsDto } from "@hrm/shared";
import { MembershipRole } from "@hrm/shared";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { RequestUser } from "../auth/request-context";
import { CreateSurveyDto } from "./dto/create-survey.dto";
import { SurveysAdminService } from "./surveys-admin.service";

@Controller("surveys")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(MembershipRole.OWNER, MembershipRole.HR_ADMIN)
export class SurveysAdminController {
  constructor(private readonly surveysAdminService: SurveysAdminService) {}

  @Get()
  findAll(@CurrentUser() user: RequestUser): Promise<SurveyDto[]> {
    return this.surveysAdminService.findAll(user.organizationId);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateSurveyDto): Promise<SurveyDto> {
    return this.surveysAdminService.create(user.organizationId, dto);
  }

  @Post(":id/open")
  open(@CurrentUser() user: RequestUser, @Param("id") id: string): Promise<SurveyDto> {
    return this.surveysAdminService.open(user.organizationId, id);
  }

  @Post(":id/close")
  close(@CurrentUser() user: RequestUser, @Param("id") id: string): Promise<SurveyDto> {
    return this.surveysAdminService.close(user.organizationId, id);
  }

  @Get(":id/results")
  getResults(@CurrentUser() user: RequestUser, @Param("id") id: string): Promise<SurveyResultsDto> {
    return this.surveysAdminService.getResults(user.organizationId, id);
  }
}
