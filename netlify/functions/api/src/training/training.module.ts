import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { EmployeesModule } from "../employees/employees.module";
import { TrainingController } from "./training.controller";
import { TrainingService } from "./training.service";

@Module({
  imports: [EmployeesModule, AuthModule],
  controllers: [TrainingController],
  providers: [TrainingService],
})
export class TrainingModule {}
