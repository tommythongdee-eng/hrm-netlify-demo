import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AttendanceModule } from "./attendance/attendance.module";
import { AuthModule } from "./auth/auth.module";
import { BillingModule } from "./billing/billing.module";
import { EmployeesModule } from "./employees/employees.module";
import { LeaveModule } from "./leave/leave.module";
import { PayrollModule } from "./payroll/payroll.module";
import { PerformanceModule } from "./performance/performance.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SuccessionModule } from "./succession/succession.module";
import { SuperAdminModule } from "./superadmin/superadmin.module";
import { SurveysModule } from "./surveys/surveys.module";
import { TrainingModule } from "./training/training.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    EmployeesModule,
    AttendanceModule,
    LeaveModule,
    PayrollModule,
    PerformanceModule,
    TrainingModule,
    SurveysModule,
    SuccessionModule,
    SuperAdminModule,
    BillingModule,
  ],
})
export class AppModule {}
