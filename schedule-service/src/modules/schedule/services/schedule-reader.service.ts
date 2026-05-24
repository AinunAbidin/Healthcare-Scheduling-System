import { Injectable, NotFoundException } from '@nestjs/common';
import { ICacheService, IDatabaseService, ILoggerService } from 'src/infra';
import {
  toScheduleByIdCacheKey,
  toScheduleListCacheKey,
  SCHEDULE_DEFAULT_PAGINATION_TAKE,
  SCHEDULE_ERROR_MESSAGES,
  SCHEDULE_MAX_PAGINATION_TAKE,
} from '../constants';
import { ScheduleListOutput, ScheduleOutput } from '../dtos';
import { ScheduleMapper } from '../mappers/schedule.mapper';
import { ScheduleListQuery, SchedulePagination } from '../types';

@Injectable()
export class ScheduleReaderService {
  constructor(
    private readonly databaseService: IDatabaseService,
    private readonly loggerService: ILoggerService,
    private readonly cacheService: ICacheService,
  ) {}

  async getSchedules(query: ScheduleListQuery): Promise<ScheduleListOutput> {
    const pagination = this.resolvePagination(query);
    const cacheKey = toScheduleListCacheKey(query, pagination);
    const cached = await this.safeCacheGet<ScheduleListOutput>(cacheKey);
    if (cached) {
      return this.hydrateScheduleListOutput(cached);
    }

    const [items, total] = await Promise.all([
      this.databaseService.findSchedules({
        customerId: query.customerId,
        doctorId: query.doctorId,
        status: query.status,
        fromScheduledAt: query.fromScheduledAt,
        toScheduledAt: query.toScheduledAt,
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.databaseService.countSchedules({
        customerId: query.customerId,
        doctorId: query.doctorId,
        status: query.status,
        fromScheduledAt: query.fromScheduledAt,
        toScheduledAt: query.toScheduledAt,
      }),
    ]);

    const result = ScheduleMapper.toScheduleListOutput(
      items,
      total,
      pagination.skip,
      pagination.take,
    );
    await this.safeCacheSet(cacheKey, result);
    return result;
  }

  async getScheduleById(id: string): Promise<ScheduleOutput> {
    const cacheKey = toScheduleByIdCacheKey(id);
    const cached = await this.safeCacheGet<ScheduleOutput>(cacheKey);
    if (cached) {
      return this.hydrateScheduleOutput(cached);
    }

    const schedule = await this.databaseService.findScheduleById(id);
    if (!schedule) {
      throw new NotFoundException(SCHEDULE_ERROR_MESSAGES.scheduleNotFound);
    }

    const result = ScheduleMapper.toScheduleOutput(schedule);
    await this.safeCacheSet(cacheKey, result);
    return result;
  }

  private resolvePagination(query: ScheduleListQuery): SchedulePagination {
    const skip = query.skip ?? 0;
    const requestedTake = query.take ?? SCHEDULE_DEFAULT_PAGINATION_TAKE;
    const take = Math.min(requestedTake, SCHEDULE_MAX_PAGINATION_TAKE);

    this.loggerService.log(`Schedule read pagination: skip=${skip} take=${take}`);

    return {
      skip,
      take,
    };
  }

  private async safeCacheGet<T>(key: string): Promise<T | null> {
    try {
      return await this.cacheService.get<T>(key);
    } catch (error) {
      this.loggerService.warn(this.toCacheWarning('get', key, error));
      return null;
    }
  }

  private async safeCacheSet<T>(key: string, value: T): Promise<void> {
    try {
      await this.cacheService.set<T>(key, value);
    } catch (error) {
      this.loggerService.warn(this.toCacheWarning('set', key, error));
    }
  }

  private hydrateScheduleOutput(schedule: ScheduleOutput): ScheduleOutput {
    return {
      ...schedule,
      scheduledAt: new Date(schedule.scheduledAt),
      createdAt: new Date(schedule.createdAt),
      updatedAt: new Date(schedule.updatedAt),
    };
  }

  private hydrateScheduleListOutput(list: ScheduleListOutput): ScheduleListOutput {
    return {
      ...list,
      items: list.items.map((item) => this.hydrateScheduleOutput(item)),
    };
  }

  private toCacheWarning(operation: string, target: string, error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return `[ScheduleCache] ${operation} failed for ${target}: ${message}`;
  }
}
