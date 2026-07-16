import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import type { PayrollRunDto, PayslipDto } from "@hrm/shared";
import { MembershipRole } from "@hrm/shared";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { RequestUser } from "../auth/request-context";
import { RunPayrollDto } from "./dto/run-payroll.dto";
import { PayrollRunsService } from "./payroll-runs.service";

@Controller("payroll/runs")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollRunsController {
  constructor(private readonly payrollRunsService: PayrollRunsService) {}

  @Get()
  @Roles(MembershipRole.OWNER, MembershipRole.HR_ADMIN)
  listRuns(@CurrentUser() user: RequestUser): Promise<PayrollRunDto[]> {
    return this.payrollRunsService.listRuns(user.organizationId);
  }

  @Post()
  @Roles(MembershipRole.OWNER, MembershipRole.HR_ADMIN)
  createRun(@CurrentUser() user: RequestUser, @Body() dto: RunPayrollDto): Promise<PayrollRunDto> {
    return this.payrollRunsService.createRun(user.organizationId, dto);
  }

  @Get(":id/payslips")
  @Roles(MembershipRole.OWNER, MembershipRole.HR_ADMIN)
  getPayslips(@CurrentUser() user: RequestUser, @Param("id") id: string): Promise<PayslipDto[]> {
    return this.payrollRunsService.getPayslips(user.organizationId, id);
  }

  @Get("my-payslips")
  myPayslips(@CurrentUser() user: RequestUser): Promise<PayslipDto[]> {
    return this.payrollRunsService.myPayslips(user.organizationId, user.sub);
  }
}
