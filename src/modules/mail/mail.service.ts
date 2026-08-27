import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    this.from =
      this.configService.get<string>('SMTP_FROM') ||
      'Loan Keeper <no-reply@loankeeper.app>';

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

  async sendPasswordResetCodeEmail(
    to: string,
    name: string,
    code: string,
    language: string,
  ) {
    const t = (key: string) =>
      I18nContext.current()?.t(`auth.${key}`, {
        lang: language,
        args: { name, code },
      }) ?? key;

    const subject = t('MAIL_RESET_CODE_SUBJECT');
    const html = `<p>${t('MAIL_RESET_CODE_GREETING')}</p><p>${t('MAIL_RESET_CODE_BODY')}</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px;">${code}</p><p>${t('MAIL_RESET_CODE_EXPIRY')}</p><p>${t('MAIL_RESET_CODE_IGNORE')}</p>`;

    if (!this.transporter) {
      this.logger.warn(
        `SMTP not configured — password reset code for ${to}: ${code}`,
      );
      return;
    }

    await this.transporter.sendMail({ from: this.from, to, subject, html });
  }

  async sendEmailVerificationCode(
    to: string,
    name: string,
    code: string,
    language: string,
  ) {
    const t = (key: string) =>
      I18nContext.current()?.t(`auth.${key}`, {
        lang: language,
        args: { name, code },
      }) ?? key;

    const subject = t('MAIL_SIGNUP_CODE_SUBJECT');
    const html = `<p>${t('MAIL_SIGNUP_CODE_GREETING')}</p><p>${t('MAIL_SIGNUP_CODE_BODY')}</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px;">${code}</p><p>${t('MAIL_SIGNUP_CODE_EXPIRY')}</p><p>${t('MAIL_SIGNUP_CODE_IGNORE')}</p>`;

    if (!this.transporter) {
      this.logger.warn(
        `SMTP not configured — signup verification code for ${to}: ${code}`,
      );
      return;
    }

    await this.transporter.sendMail({ from: this.from, to, subject, html });
  }
}
