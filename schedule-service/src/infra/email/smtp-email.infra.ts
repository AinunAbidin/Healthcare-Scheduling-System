import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SendMailOptions, Transporter } from 'nodemailer';
import { EmailConfig } from 'src/config';
import { IEmailService, SendEmailData } from './email.interface';

@Injectable()
export class SmtpEmailInfra implements IEmailService {
  private readonly transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: EmailConfig.host,
      port: EmailConfig.port,
      secure: EmailConfig.port === 465,
      auth: {
        user: EmailConfig.user,
        pass: EmailConfig.password,
      },
    });
  }

  async sendEmail(data: SendEmailData): Promise<void> {
    const options: SendMailOptions = {
      from: data.from ?? EmailConfig.from,
      to: data.to,
      subject: data.subject,
      text: data.text,
      html: data.html,
    };

    await this.transporter.sendMail(options);
  }
}
