import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly from: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    this.from =
      this.configService.get<string>('SMTP_FROM') ||
      'Loan Keeper <no-reply@loankeeper.app>';
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

    this.transporter = host
      ? nodemailer.createTransport({
          host,
          port: this.configService.get<number>('SMTP_PORT'),
          secure: this.configService.get<boolean>('SMTP_SECURE'),
          auth: {
            user: this.configService.get<string>('SMTP_USER'),
            pass: this.configService.get<string>('SMTP_PASS'),
          },
        })
      : null;
  }

  async sendPasswordResetEmail(to: string, name: string, token: string) {
    const link = `${this.frontendUrl}/reset-password?token=${token}`;
    const subject = 'Reset your password';
    const html = `<p>Hi ${name},</p><p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${link}">${link}</a></p><p>If you didn't request this, you can ignore this email.</p>`;

    if (!this.transporter) {
      this.logger.warn(
        `SMTP not configured — password reset link for ${to}: ${link}`,
      );
      return;
    }

    await this.transporter.sendMail({ from: this.from, to, subject, html });
  }
}
