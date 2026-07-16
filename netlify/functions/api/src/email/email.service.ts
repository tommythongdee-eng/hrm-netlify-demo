import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";
import * as nodemailer from "nodemailer";
import { UPLOADS_ROOT } from "../employees/storage/uploads-path";

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
}

const DEV_EMAILS_DIR = path.join(UPLOADS_ROOT, "dev-emails");

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  // Real SMTP when configured; otherwise writes a .eml file + logs a line so
  // the "send" is visible without a real inbox — the same zero-install dev
  // fallback pattern used for the DB (SQLite) and file storage (local disk).
  async sendMail(input: SendMailInput): Promise<void> {
    const host = this.configService.get<string>("SMTP_HOST");

    if (!host) {
      await this.writeDevEmail(input);
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port: this.configService.get<number>("SMTP_PORT", 587),
        secure: this.configService.get<string>("SMTP_SECURE", "false") === "true",
        auth: {
          user: this.configService.get<string>("SMTP_USER"),
          pass: this.configService.get<string>("SMTP_PASSWORD"),
        },
      });

      await transporter.sendMail({
        from: this.configService.get<string>("SMTP_FROM", "no-reply@hrm-for-sme.local"),
        to: input.to,
        subject: input.subject,
        html: input.html,
      });
    } catch (error) {
      // A delivery failure shouldn't fail the caller's operation (e.g. an
      // employee invite) — the underlying record was already created either way.
      this.logger.warn(`Failed to send email to ${input.to}: ${(error as Error).message}`);
    }
  }

  private async writeDevEmail(input: SendMailInput): Promise<void> {
    fs.mkdirSync(DEV_EMAILS_DIR, { recursive: true });
    const safeRecipient = input.to.replace(/[^a-zA-Z0-9.@-]/g, "_");
    const filePath = path.join(DEV_EMAILS_DIR, `${Date.now()}-${safeRecipient}.eml`);
    const contents = [
      `To: ${input.to}`,
      `Subject: ${input.subject}`,
      "Content-Type: text/html; charset=utf-8",
      "",
      input.html,
    ].join("\n");

    await fs.promises.writeFile(filePath, contents, "utf-8");
    this.logger.log(`No SMTP_HOST configured — wrote dev email to ${filePath}`);
  }
}
