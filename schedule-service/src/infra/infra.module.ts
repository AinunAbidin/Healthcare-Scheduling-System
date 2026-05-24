import { Global, Module } from '@nestjs/common';
import { AuthClientModule } from './auth-client/auth-client.module';
import { CacheModule } from './cache/cache.module';
import { DatabaseModule } from './database/database.module';
import { EmailModule } from './email/email.module';
import { LoggerModule } from './logger/logger.module';
import { QueueModule } from './queue/queue.module';

@Global()
@Module({
  imports: [
    LoggerModule,
    DatabaseModule,
    AuthClientModule,
    QueueModule,
    EmailModule,
    CacheModule,
  ],
  exports: [
    LoggerModule,
    DatabaseModule,
    AuthClientModule,
    QueueModule,
    EmailModule,
    CacheModule,
  ],
})
export class InfraModule {}
