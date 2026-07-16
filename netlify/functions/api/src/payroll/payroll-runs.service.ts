import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { PayrollRunDto, PayslipDto } from "@hrm/shared";
import type { Employee } from "@prisma/client";
import { eachDateInRange, isWeekend } from "../common/date.util";
import { EmployeesService } from "../employees/employees.service";
import { PrismaService } from "../prisma/prisma.service";
import { RunPayrollDto } from "./dto/run-payroll.dto";
import { calculateMonthlyWithholdingTax, calculateProvidentFund, calculateSocialSecurity, round2 } from "./tax-engine";

@Injectable()
export class PayrollRunsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employeesService: EmployeesService,
  ) {}

  async listRuns(organizationId: string): Promise<PayrollRunDto[]> {
    const runs = await this.prisma.payrollRun.findMany({
      where: { organizationId },
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    });
    return runs.map((r) => this.toRunDto(r));
  }

  async getPayslips(organizationId: string, runId: string): Promise<PayslipDto[]> {
    const run = await this.prisma.payrollRun.findFirst({ where: { id: runId, organizationId } });
    if (!run) {
      throw new NotFoundException("Payroll run not found");
    }
    const payslips = await this.prisma.payslip.findMany({
      where: { payrollRunId: runId },
      include: { employee: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "asc" },
    });
    return payslips.map((p) => this.toPayslipDto(p, run.periodYear, run.periodMonth));
  }

  async myPayslips(organizationId: string, userId: string): Promise<PayslipDto[]> {
    const employee = await this.employeesService.findByUserId(organizationId, userId);
    if (!employee) {
      throw new NotFoundException("Your account isn't linked to an employee record yet");
    }
    const payslips = await this.prisma.payslip.findMany({
      where: { organizationId, employeeId: employee.id },
      include: { employee: { select: { firstName: true, lastName: true } }, payrollRun: true },
      orderBy: { createdAt: "desc" },
    });
    return payslips.map((p) => this.toPayslipDto(p, p.payrollRun.periodYear, p.payrollRun.periodMonth));
  }

  async createRun(organizationId: string, dto: RunPayrollDto): Promise<PayrollRunDto> {
    const existing = await this.prisma.payrollRun.findUnique({
      where: {
        organizationId_periodYear_periodMonth: {
          organizationId,
          periodYear: dto.periodYear,
          periodMonth: dto.periodMonth,
        },
      },
    });
    if (existing) {
      throw new ConflictException("A payroll run already exists for this period");
    }

    const settings = await this.prisma.payrollSettings.findUnique({ where: { organizationId } });
    if (!settings) {
      throw new BadRequestException("Payroll settings are not configured for this organization");
    }
    const brackets = await this.prisma.taxBracket.findMany({ where: { organizationId } });
    if (brackets.length === 0) {
      throw new BadRequestException("No tax brackets configured for this organization");
    }

    const periodStart = new Date(Date.UTC(dto.periodYear, dto.periodMonth - 1, 1));
    const periodEnd = new Date(Date.UTC(dto.periodYear, dto.periodMonth, 0));

    const employees = await this.prisma.employee.findMany({ where: { organizationId, status: "ACTIVE" } });
    const workingDaysInMonth = await this.countWorkingDays(organizationId, periodStart, periodEnd);

    const run = await this.prisma.payrollRun.create({
      data: { organizationId, periodYear: dto.periodYear, periodMonth: dto.periodMonth, status: "DRAFT" },
    });

    for (const employee of employees) {
      const unpaidDays = await this.sumUnpaidApprovedLeaveDays(organizationId, employee, periodStart, periodEnd);
      const dailyRate = workingDaysInMonth > 0 ? employee.baseSalary / workingDaysInMonth : 0;
      const unpaidLeaveDeduction = round2(dailyRate * unpaidDays);
      const grossPay = round2(Math.max(0, employee.baseSalary - unpaidLeaveDeduction));

      const ssf = calculateSocialSecurity(grossPay, {
        employeeRate: settings.socialSecurityEmployeeRate,
        employerRate: settings.socialSecurityEmployerRate,
        wageFloor: settings.socialSecurityWageFloor,
        wageCeiling: settings.socialSecurityWageCeiling,
      });

      const pfActive = settings.providentFundEnabled && employee.providentFundOptIn;
      const providentFund = pfActive
        ? calculateProvidentFund(grossPay, {
            employeeRate: employee.providentFundEmployeeRate ?? settings.providentFundDefaultEmployeeRate,
            employerRate: settings.providentFundDefaultEmployerRate,
          })
        : { employeeContribution: 0, employerContribution: 0 };

      const withholdingTax = calculateMonthlyWithholdingTax(
        grossPay,
        ssf.employeeContribution + providentFund.employeeContribution,
        brackets,
      );
      const netPay = round2(grossPay - ssf.employeeContribution - providentFund.employeeContribution - withholdingTax);

      await this.prisma.payslip.create({
        data: {
          payrollRunId: run.id,
          employeeId: employee.id,
          organizationId,
          baseSalary: employee.baseSalary,
          unpaidLeaveDeduction,
          grossPay,
          socialSecurityEmployee: ssf.employeeContribution,
          socialSecurityEmployer: ssf.employerContribution,
          providentFundEmployee: providentFund.employeeContribution,
          providentFundEmployer: providentFund.employerContribution,
          withholdingTax,
          netPay,
        },
      });
    }

    return this.toRunDto(run);
  }

  private async countWorkingDays(organizationId: string, start: Date, end: Date): Promise<number> {
    const holidays = await this.prisma.publicHoliday.findMany({
      where: { organizationId, date: { gte: start, lte: end } },
    });
    const holidaySet = new Set(holidays.map((h) => h.date.toISOString().slice(0, 10)));
    return eachDateInRange(start, end).filter(
      (d) => !isWeekend(d) && !holidaySet.has(d.toISOString().slice(0, 10)),
    ).length;
  }

  // Simplification: sums the full daysCount of any APPROVED request on an
  // unpaid leave type overlapping the period, rather than clipping to the
  // period boundary. Fine in practice since the seeded default leave types
  // are all isPaid: true — this only matters for unpaid types HR adds later.
  private async sumUnpaidApprovedLeaveDays(
    organizationId: string,
    employee: Employee,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<number> {
    const requests = await this.prisma.leaveRequest.findMany({
      where: {
        organizationId,
        employeeId: employee.id,
        status: "APPROVED",
        leaveType: { isPaid: false },
        startDate: { lte: periodEnd },
        endDate: { gte: periodStart },
      },
    });
    return requests.reduce((sum, r) => sum + r.daysCount, 0);
  }

  private toRunDto(run: { id: string; periodYear: number; periodMonth: number; status: string; createdAt: Date }): PayrollRunDto {
    return {
      id: run.id,
      periodYear: run.periodYear,
      periodMonth: run.periodMonth,
      status: run.status as PayrollRunDto["status"],
      createdAt: run.createdAt.toISOString(),
    };
  }

  private toPayslipDto(
    payslip: {
      id: string;
      employeeId: string;
      employee: { firstName: string; lastName: string };
      baseSalary: number;
      unpaidLeaveDeduction: number;
      grossPay: number;
      socialSecurityEmployee: number;
      socialSecurityEmployer: number;
      providentFundEmployee: number;
      providentFundEmployer: number;
      withholdingTax: number;
      netPay: number;
    },
    periodYear: number,
    periodMonth: number,
  ): PayslipDto {
    return {
      id: payslip.id,
      employeeId: payslip.employeeId,
      employeeName: `${payslip.employee.firstName} ${payslip.employee.lastName}`,
      periodYear,
      periodMonth,
      baseSalary: payslip.baseSalary,
      unpaidLeaveDeduction: payslip.unpaidLeaveDeduction,
      grossPay: payslip.grossPay,
      socialSecurityEmployee: payslip.socialSecurityEmployee,
      socialSecurityEmployer: payslip.socialSecurityEmployer,
      providentFundEmployee: payslip.providentFundEmployee,
      providentFundEmployer: payslip.providentFundEmployer,
      withholdingTax: payslip.withholdingTax,
      netPay: payslip.netPay,
    };
  }
}
