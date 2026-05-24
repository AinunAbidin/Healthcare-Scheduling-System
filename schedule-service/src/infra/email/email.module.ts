import { Module } from '@nestjs/common';
import { IEmailService } from './email.interface';
import { SmtpEmailInfra } from './smtp-email.infra';

@Module({
  providers: [
    SmtpEmailInfra,
    {
      provide: IEmailService,
      useExisting: SmtpEmailInfra,
    },
  ],
  exports: [IEmailService],
})
export class EmailModule {}
