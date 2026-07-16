import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { EmployeesModule } from "../employees/employees.module";
import { KeyPositionsController } from "./key-positions.controller";
import { KeyPositionsService } from "./key-positions.service";
import { TalentAssessmentsController } from "./talent-assessments.controller";
import { TalentAssessmentsService } from "./talent-assessments.service";

@Module({
  imports: [EmployeesModule, AuthModule],
  controllers: [TalentAssessmentsController, KeyPositionsController],
  providers: [TalentAssessmentsService, KeyPositionsService],
})
export class SuccessionModule {}
