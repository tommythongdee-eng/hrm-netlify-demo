import { Injectable, NotFoundException } from "@nestjs/common";
import type { PayrollSettingsDto, TaxBracketDto } from "@hrm/shared";
import { PrismaService } from "../prisma/prisma.service";
import { UpdatePayrollSettingsDto } from "./dto/update-payroll-settings.dto";
import { UpdateTaxBracketDto } from "./dto/update-tax-bracket.dto";

@Injectable()
export class PayrollSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(organizationId: string): Promise<PayrollSettingsDto> {
    const settings = await this.prisma.payrollSettings.findUnique({ where: { organizationId } });
    if (!settings) {
      throw new NotFoundException("Payroll settings not found for this organization");
    }
    return this.toDto(settings);
  }

  async updateSettings(organizationId: string, dto: UpdatePayrollSettingsDto): Promise<PayrollSettingsDto> {
    const settings = await this.prisma.payrollSettings.update({
      where: { organizationId },
      data: { ...dto },
    });
    return this.toDto(settings);
  }

  async getTaxBrackets(organizationId: string): Promise<TaxBracketDto[]> {
    const brackets = await this.prisma.taxBracket.findMany({
      where: { organizationId },
      orderBy: { order: "asc" },
    });
    return brackets.map((b) => ({ id: b.id, minIncome: b.minIncome, maxIncome: b.maxIncome, rate: b.rate, order: b.order }));
  }

  async updateTaxBracket(organizationId: string, id: string, dto: UpdateTaxBracketDto): Promise<TaxBracketDto> {
    const bracket = await this.prisma.taxBracket.findFirst({ where: { id, organizationId } });
    if (!bracket) {
      throw new NotFoundException("Tax bracket not found");
    }
    const updated = await this.prisma.taxBracket.update({ where: { id }, data: { ...dto } });
    return {
      id: updated.id,
      minIncome: updated.minIncome,
      maxIncome: updated.maxIncome,
      rate: updated.rate,
      order: updated.order,
    };
  }

  private toDto(settings: {
    socialSecurityEmployeeRate: number;
    socialSecurityEmployerRate: number;
    socialSecurityWageFloor: number;
    socialSecurityWageCeiling: number;
    providentFundEnabled: boolean;
    providentFundDefaultEmployeeRate: number;
    providentFundDefaultEmployerRate: number;
  }): PayrollSettingsDto {
    return {
      socialSecurityEmployeeRate: settings.socialSecurityEmployeeRate,
      socialSecurityEmployerRate: settings.socialSecurityEmployerRate,
      socialSecurityWageFloor: settings.socialSecurityWageFloor,
      socialSecurityWageCeiling: settings.socialSecurityWageCeiling,
      providentFundEnabled: settings.providentFundEnabled,
      providentFundDefaultEmployeeRate: settings.providentFundDefaultEmployeeRate,
      providentFundDefaultEmployerRate: settings.providentFundDefaultEmployerRate,
    };
  }
}
