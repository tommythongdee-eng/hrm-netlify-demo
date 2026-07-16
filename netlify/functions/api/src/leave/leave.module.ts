import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { EmployeesModule } from "../employees/employees.module";
import { LeaveRequestsController } from "./leave-requests.controller";
import { LeaveRequestsService } from "./leave-requests.service";
import { LeaveTypesController } from "./leave-types.controller";
import { LeaveTypesService } from "./leave-types.service";

@Module({
  imports: [EmployeesModule, AuthModule],
  controllers: [LeaveTypesController, LeaveRequestsController],
  providers: [LeaveTypesService, LeaveRequestsService],
})
export class LeaveModule {}
