import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { EmployeesModule } from "../employees/employees.module";
import { SurveyResponsesController } from "./survey-responses.controller";
import { SurveyResponsesService } from "./survey-responses.service";
import { SurveysAdminController } from "./surveys-admin.controller";
import { SurveysAdminService } from "./surveys-admin.service";

@Module({
  imports: [EmployeesModule, AuthModule],
  controllers: [SurveysAdminController, SurveyResponsesController],
  providers: [SurveysAdminService, SurveyResponsesService],
})
export class SurveysModule {}
