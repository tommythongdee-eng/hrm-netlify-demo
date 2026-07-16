import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import type { SurveyDto } from "@hrm/shared";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { RequestUser } from "../auth/request-context";
import { SubmitSurveyResponseDto } from "./dto/submit-survey-response.dto";
import { SurveyResponsesService } from "./survey-responses.service";

@Controller("survey-responses")
@UseGuards(JwtAuthGuard)
export class SurveyResponsesController {
  constructor(private readonly surveyResponsesService: SurveyResponsesService) {}

  @Get("open")
  listOpen(@CurrentUser() user: RequestUser): Promise<SurveyDto[]> {
    return this.surveyResponsesService.listOpen(user.organizationId, user.sub);
  }

  @Post(":surveyId")
  @HttpCode(HttpStatus.NO_CONTENT)
  submit(
    @CurrentUser() user: RequestUser,
    @Param("surveyId") surveyId: string,
    @Body() dto: SubmitSurveyResponseDto,
  ): Promise<void> {
    return this.surveyResponsesService.submit(user.organizationId, user.sub, surveyId, dto);
  }
}
