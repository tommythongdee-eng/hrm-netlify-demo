import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { MembershipRole } from "@hrm/shared";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import { EmployeesService } from "../employees/employees.service";
import { PrismaService } from "../prisma/prisma.service";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export interface PayslipPdf {
  stream: PassThrough;
  fileName: string;
}

@Injectable()
export class PayslipPdfService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employeesService: EmployeesService,
  ) {}

  // One endpoint for both HR/Owner (any payslip in their org) and the
  // employee themselves (their own payslip only) — same authorization
  // branching shape as the other self-service-or-HR endpoints.
  async generate(
    organizationId: string,
    payslipId: string,
    actingUserId: string,
    actingRole: MembershipRole,
  ): Promise<PayslipPdf> {
    const payslip = await this.prisma.payslip.findFirst({
      where: { id: payslipId, organizationId },
      include: { employee: true, payrollRun: true },
    });
    if (!payslip) {
      throw new NotFoundException("Payslip not found");
    }

    const isHrOrOwner = actingRole === MembershipRole.OWNER || actingRole === MembershipRole.HR_ADMIN;
    if (!isHrOrOwner) {
      const employee = await this.employeesService.findByUserId(organizationId, actingUserId);
      if (!employee || employee.id !== payslip.employeeId) {
        throw new ForbiddenException("You can only download your own payslip");
      }
    }

    const organization = await this.prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });

    const doc = new PDFDocument({ margin: 50 });
    const stream = new PassThrough();
    doc.pipe(stream);

    doc.fontSize(18).text(organization.name);
    doc.fontSize(14).fillColor("#334155").text("Payslip");
    doc.moveDown();

    doc.fontSize(10).fillColor("black");
    doc.text(`Employee: ${payslip.employee.firstName} ${payslip.employee.lastName} (${payslip.employee.employeeCode})`);
    doc.text(`Position: ${payslip.employee.position}`);
    doc.text(`Period: ${MONTH_NAMES[payslip.payrollRun.periodMonth - 1]} ${payslip.payrollRun.periodYear}`);
    doc.moveDown();

    const rows: [string, number][] = [["Base salary", payslip.baseSalary]];
    if (payslip.unpaidLeaveDeduction > 0) {
      rows.push(["Unpaid leave deduction", -payslip.unpaidLeaveDeduction]);
    }
    rows.push(["Gross pay", payslip.grossPay]);
    rows.push(["Social security (employee)", -payslip.socialSecurityEmployee]);
    if (payslip.providentFundEmployee > 0) {
      rows.push(["Provident fund (employee)", -payslip.providentFundEmployee]);
    }
    rows.push(["Withholding tax", -payslip.withholdingTax]);

    for (const [label, amount] of rows) {
      doc.text(`${label}: ${amount < 0 ? "-" : ""}${Math.abs(amount).toLocaleString()} THB`);
    }

    doc.moveDown(0.5);
    doc.fontSize(12).text(`Net pay: ${payslip.netPay.toLocaleString()} THB`, { underline: true });

    doc.moveDown(2);
    doc
      .fontSize(8)
      .fillColor("gray")
      .text(
        "Social security, withholding tax, and provident fund figures use a simplified calculation — verify with an accountant before relying on this for real payroll.",
      );

    doc.end();

    const periodLabel = `${payslip.payrollRun.periodYear}-${String(payslip.payrollRun.periodMonth).padStart(2, "0")}`;
    return { stream, fileName: `payslip-${periodLabel}-${payslip.employee.employeeCode}.pdf` };
  }
}
