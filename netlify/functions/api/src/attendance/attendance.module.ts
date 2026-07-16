import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { EmployeesModule } from "../employees/employees.module";
import { AttendanceController } from "./attendance.controller";
import { AttendanceService } from "./attendance.service";

@Module({
  imports: [EmployeesModule, AuthModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
})
export class AttendanceModule {}
