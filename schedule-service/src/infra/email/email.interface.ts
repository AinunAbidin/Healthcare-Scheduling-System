export interface SendEmailData {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
}

export abstract class IEmailService {
  abstract sendEmail(data: SendEmailData): Promise<void>;
}
