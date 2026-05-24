import { Module } from '@nestjs/common';
import { LoggerModule } from '../logger/logger.module';
import { ICacheService } from './cache.interface';
import { RedisCacheInfra } from './redis-cache.infra';

@Module({
  imports: [LoggerModule],
  providers: [
    RedisCacheInfra,
    {
      provide: ICacheService,
      useExisting: RedisCacheInfra,
    },
  ],
  exports: [ICacheService],
})
export class CacheModule {}
