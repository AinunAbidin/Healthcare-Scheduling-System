import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { CacheConfig } from 'src/config';
import { ILoggerService } from '../logger/logger.interface';
import { ICacheService } from './cache.interface';

interface RedisClientLike {
  status: string;
  connect(): Promise<void>;
  quit(): Promise<'OK' | unknown>;
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    mode: 'EX',
    durationSeconds: number,
  ): Promise<'OK' | unknown>;
  del(...keys: string[]): Promise<number>;
  scan(
    cursor: string,
    keywordMatch: 'MATCH',
    pattern: string,
    keywordCount: 'COUNT',
    count: string,
  ): Promise<[string, string[]]>;
  on(eventName: 'error', listener: (error: Error) => void): void;
}

interface RedisModuleLike {
  Redis?: new (options: {
    host: string;
    port: number;
    password?: string;
    lazyConnect: boolean;
    maxRetriesPerRequest: number;
  }) => RedisClientLike;
  default?: new (options: {
    host: string;
    port: number;
    password?: string;
    lazyConnect: boolean;
    maxRetriesPerRequest: number;
  }) => RedisClientLike;
}

@Injectable()
export class RedisCacheInfra implements ICacheService, OnModuleDestroy {
  private readonly cacheEnabled = CacheConfig.enabled;
  private readonly defaultTtlSeconds = CacheConfig.ttlSeconds;

  private redisClient: RedisClientLike | null = null;
  private connectingPromise: Promise<void> | null = null;

  constructor(private readonly loggerService: ILoggerService) {
    if (!this.cacheEnabled) {
      this.loggerService.log('Redis cache is disabled (CACHE_ENABLED=false)');
      return;
    }

    try {
      this.redisClient = this.createRedisClient();
    } catch (error) {
      this.loggerService.warn(this.toLogMessage('init', 'client', error));
      this.redisClient = null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const redisClient = await this.getConnectedClient();
    if (!redisClient) {
      return null;
    }

    try {
      const value = await redisClient.get(key);
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      this.loggerService.warn(this.toLogMessage('get', key, error));
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const redisClient = await this.getConnectedClient();
    if (!redisClient) {
      return;
    }

    const resolvedTtlSeconds = this.resolveTtlSeconds(ttlSeconds);
    if (!resolvedTtlSeconds) {
      return;
    }

    try {
      await redisClient.set(
        key,
        JSON.stringify(value),
        'EX',
        resolvedTtlSeconds,
      );
    } catch (error) {
      this.loggerService.warn(this.toLogMessage('set', key, error));
    }
  }

  async delete(key: string): Promise<void> {
    const redisClient = await this.getConnectedClient();
    if (!redisClient) {
      return;
    }

    try {
      await redisClient.del(key);
    } catch (error) {
      this.loggerService.warn(this.toLogMessage('delete', key, error));
    }
  }

  async deleteByPattern(pattern: string): Promise<void> {
    const redisClient = await this.getConnectedClient();
    if (!redisClient) {
      return;
    }

    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await redisClient.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          '100',
        );

        if (keys.length > 0) {
          await redisClient.del(...keys);
        }

        cursor = nextCursor;
      } while (cursor !== '0');
    } catch (error) {
      this.loggerService.warn(this.toLogMessage('deleteByPattern', pattern, error));
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    try {
      await this.redisClient.quit();
    } catch (error) {
      this.loggerService.warn(this.toLogMessage('quit', 'client', error));
    } finally {
      this.redisClient = null;
      this.connectingPromise = null;
    }
  }

  private async getConnectedClient(): Promise<RedisClientLike | null> {
    if (!this.cacheEnabled || !this.redisClient) {
      return null;
    }

    try {
      await this.connectClientIfNeeded();
      return this.redisClient;
    } catch {
      return null;
    }
  }

  private async connectClientIfNeeded(): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    if (
      this.redisClient.status === 'ready' ||
      this.redisClient.status === 'connecting' ||
      this.redisClient.status === 'connect'
    ) {
      return;
    }

    if (!this.connectingPromise) {
      this.connectingPromise = this.redisClient
        .connect()
        .catch((error: unknown) => {
          this.loggerService.warn(this.toLogMessage('connect', 'client', error));
          throw error;
        })
        .finally(() => {
          this.connectingPromise = null;
        });
    }

    await this.connectingPromise;
  }

  private createRedisClient(): RedisClientLike {
    const redisModule = require('ioredis') as RedisModuleLike;
    const RedisConstructor =
      redisModule.Redis ??
      redisModule.default ??
      (redisModule as unknown as new (options: {
        host: string;
        port: number;
        password?: string;
        lazyConnect: boolean;
        maxRetriesPerRequest: number;
      }) => RedisClientLike);

    if (typeof RedisConstructor !== 'function') {
      throw new Error('ioredis constructor is unavailable');
    }

    const redisClient = new RedisConstructor({
      host: CacheConfig.redisHost,
      port: CacheConfig.redisPort,
      password: CacheConfig.redisPassword,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });

    redisClient.on('error', (error: Error) => {
      this.loggerService.warn(this.toLogMessage('error', 'client', error));
    });

    return redisClient;
  }

  private resolveTtlSeconds(ttlSeconds?: number): number | null {
    const value = ttlSeconds ?? this.defaultTtlSeconds;
    if (!Number.isInteger(value) || value < 1) {
      this.loggerService.warn(
        `[Cache] Invalid TTL for key set operation: ttlSeconds=${value}`,
      );
      return null;
    }

    return value;
  }

  private toLogMessage(operation: string, target: string, error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return `[Cache] ${operation} failed for ${target}: ${message}`;
  }
}
