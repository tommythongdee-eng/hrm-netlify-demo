import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import type { PayrollSettingsDto, TaxBracketDto } from "@hrm/shared";
import { MembershipRole } from "@hrm/shared";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { RequestUser } from "../auth/request-context";
import { UpdatePayrollSettingsDto } from "./dto/update-payroll-settings.dto";
import { UpdateTaxBracketDto } from "./dto/update-tax-bracket.dto";
import { PayrollSettingsService } from "./payroll-settings.service";

@Controller("payroll/settings")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(MembershipRole.OWNER, MembershipRole.HR_ADMIN)
export class PayrollSettingsController {
  constructor(private readonly payrollSettingsService: PayrollSettingsService) {}

  @Get()
  getSettings(@CurrentUser() user: RequestUser): Promise<PayrollSettingsDto> {
    return this.payrollSettingsService.getSettings(user.organizationId);
  }

  @Patch()
  updateSettings(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdatePayrollSettingsDto,
  ): Promise<PayrollSettingsDto> {
    return this.payrollSettingsService.updateSettings(user.organizationId, dto);
  }

  @Get("tax-brackets")
  getTaxBrackets(@CurrentUser() user: RequestUser): Promise<TaxBracketDto[]> {
    return this.payrollSettingsService.getTaxBrackets(user.organizationId);
  }

  @Patch("tax-brackets/:id")
  updateTaxBracket(
    @CurrentUser() user: RequestUser,
    @Param("id") id: string,
    @Body() dto: UpdateTaxBracketDto,
  ): Promise<TaxBracketDto> {
    return this.payrollSettingsService.updateTaxBracket(user.organizationId, id, dto);
  }
}
