import { Module } from '@nestjs/common';
import { IDatabaseService } from './database.interface';
import { PostgresInfra } from './postgres.infra';

@Module({
  providers: [
    PostgresInfra,
    {
      provide: IDatabaseService,
      useExisting: PostgresInfra,
    },
  ],
  exports: [IDatabaseService],
})
export class DatabaseModule {}
