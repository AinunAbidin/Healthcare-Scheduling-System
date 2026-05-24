import { Injectable, Logger } from '@nestjs/common';
import { ILoggerService } from './logger.interface';

@Injectable()
export class NestLoggerInfra implements ILoggerService {
  private readonly logger = new Logger('AuthService');

  log(message: string): void {
    this.logger.log(message);
  }

  warn(message: string): void {
    this.logger.warn(message);
  }

  error(message: string): void {
    this.logger.error(message);
  }
}
