import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { EmployeesModule } from "../employees/employees.module";
import { PerformanceReviewsController } from "./performance-reviews.controller";
import { PerformanceReviewsService } from "./performance-reviews.service";
import { ReviewCyclesController } from "./review-cycles.controller";
import { ReviewCyclesService } from "./review-cycles.service";

@Module({
  imports: [EmployeesModule, AuthModule],
  controllers: [ReviewCyclesController, PerformanceReviewsController],
  providers: [ReviewCyclesService, PerformanceReviewsService],
})
export class PerformanceModule {}
