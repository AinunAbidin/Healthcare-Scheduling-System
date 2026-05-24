import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ICacheService,
  IDatabaseService,
  ILoggerService,
  IQueueService,
} from 'src/infra';
import {
  EMAIL_NOTIFICATION_JOB_NAMES,
  EMAIL_NOTIFICATION_RETRY_OPTIONS,
  NOTIFICATION_QUEUE_NAMES,
} from '../../notification/constants';
import { ScheduleEmailNotificationPayload } from '../../notification/types';
import {
  SCHEDULE_CACHE_KEY_PATTERNS,
  SCHEDULE_ERROR_MESSAGES,
  toScheduleByIdCacheKey,
} from '../constants';
import { ScheduleOutput } from '../dtos';
import { ScheduleMapper } from '../mappers/schedule.mapper';

@Injectable()
export class ScheduleRemoverService {
  constructor(
    private readonly databaseService: IDatabaseService,
    private readonly loggerService: ILoggerService,
    private readonly queueService: IQueueService,
    private readonly cacheService: ICacheService,
  ) {}

  async deleteSchedule(id: string): Promise<ScheduleOutput> {
    const schedule = await this.databaseService.findScheduleById(id);
    if (!schedule) {
      throw new NotFoundException(SCHEDULE_ERROR_MESSAGES.scheduleNotFound);
    }

    const customer = await this.databaseService.findCustomerById(schedule.customerId);
    const doctor = await this.databaseService.findDoctorById(schedule.doctorId);

    const deleted = await this.databaseService.deleteSchedule(id);
    if (!deleted) {
      throw new NotFoundException(SCHEDULE_ERROR_MESSAGES.scheduleNotFound);
    }

    this.loggerService.log(`Schedule deleted: scheduleId=${deleted.id}`);
    await this.invalidateScheduleCache(deleted.id);

    if (!customer || !doctor) {
      this.loggerService.warn(
        `Skipping schedule deleted email enqueue due to missing relation data: scheduleId=${deleted.id}`,
      );
      return ScheduleMapper.toScheduleOutput(deleted);
    }

    await this.enqueueDeletedScheduleNotification({
      customerEmail: customer.email,
      customerName: customer.name,
      doctorName: doctor.name,
      scheduledAt: schedule.scheduledAt.toISOString(),
      objective: schedule.objective,
    });

    return ScheduleMapper.toScheduleOutput(deleted);
  }

  private async enqueueDeletedScheduleNotification(
    payload: ScheduleEmailNotificationPayload,
  ): Promise<void> {
    try {
      await this.queueService.enqueue(
        NOTIFICATION_QUEUE_NAMES.email,
        EMAIL_NOTIFICATION_JOB_NAMES.scheduleDeleted,
        payload,
        {
          attempts: EMAIL_NOTIFICATION_RETRY_OPTIONS.attempts,
          backoff: {
            type: EMAIL_NOTIFICATION_RETRY_OPTIONS.backoffType,
            delayMs: EMAIL_NOTIFICATION_RETRY_OPTIONS.backoffDelayMs,
          },
          removeOnComplete: EMAIL_NOTIFICATION_RETRY_OPTIONS.removeOnComplete,
          removeOnFail: EMAIL_NOTIFICATION_RETRY_OPTIONS.removeOnFail,
        },
      );

      this.loggerService.log(
        `Schedule deleted email job enqueued for customerEmail=${payload.customerEmail}`,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown queue enqueue error';
      this.loggerService.error(
        `Failed to enqueue schedule deleted email job: ${message}`,
      );
    }
  }

  private async invalidateScheduleCache(scheduleId: string): Promise<void> {
    await this.safeCacheDeleteByPattern(SCHEDULE_CACHE_KEY_PATTERNS.list);
    await this.safeCacheDelete(toScheduleByIdCacheKey(scheduleId));
  }

  private async safeCacheDelete(key: string): Promise<void> {
    try {
      await this.cacheService.delete(key);
    } catch (error) {
      this.loggerService.warn(this.toCacheWarning('delete', key, error));
    }
  }

  private async safeCacheDeleteByPattern(pattern: string): Promise<void> {
    try {
      await this.cacheService.deleteByPattern(pattern);
    } catch (error) {
      this.loggerService.warn(this.toCacheWarning('deleteByPattern', pattern, error));
    }
  }

  private toCacheWarning(operation: string, target: string, error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return `[ScheduleCache] ${operation} failed for ${target}: ${message}`;
  }
}
