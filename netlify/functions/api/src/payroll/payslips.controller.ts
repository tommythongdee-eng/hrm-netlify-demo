import { Controller, Get, Param, StreamableFile, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { RequestUser } from "../auth/request-context";
import { PayslipPdfService } from "./payslip-pdf.service";

@Controller("payroll/payslips")
@UseGuards(JwtAuthGuard)
export class PayslipsController {
  constructor(private readonly payslipPdfService: PayslipPdfService) {}

  @Get(":id/pdf")
  async downloadPdf(@CurrentUser() user: RequestUser, @Param("id") id: string): Promise<StreamableFile> {
    const { stream, fileName } = await this.payslipPdfService.generate(
      user.organizationId,
      id,
      user.sub,
      user.role,
    );
    return new StreamableFile(stream, {
      type: "application/pdf",
      disposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
    });
  }
}
