import { Module } from '@nestjs/common';
import { ILoggerService } from './logger.interface';
import { NestLoggerInfra } from './nest-logger.infra';

@Module({
  providers: [
    NestLoggerInfra,
    {
      provide: ILoggerService,
      useExisting: NestLoggerInfra,
    },
  ],
  exports: [ILoggerService],
})
export class LoggerModule {}
