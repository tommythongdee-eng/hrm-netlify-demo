import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { EmployeesModule } from "../employees/employees.module";
import { PayrollRunsController } from "./payroll-runs.controller";
import { PayrollRunsService } from "./payroll-runs.service";
import { PayrollSettingsController } from "./payroll-settings.controller";
import { PayrollSettingsService } from "./payroll-settings.service";
import { PayslipPdfService } from "./payslip-pdf.service";
import { PayslipsController } from "./payslips.controller";

@Module({
  imports: [EmployeesModule, AuthModule],
  controllers: [PayrollSettingsController, PayrollRunsController, PayslipsController],
  providers: [PayrollSettingsService, PayrollRunsService, PayslipPdfService],
})
export class PayrollModule {}
