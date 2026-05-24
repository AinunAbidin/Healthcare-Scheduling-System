import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
  SCHEDULE_MIN_INTERVAL_MINUTES,
  toScheduleByIdCacheKey,
} from '../constants';
import { ScheduleOutput } from '../dtos';
import { ScheduleMapper } from '../mappers/schedule.mapper';
import { CreateScheduleCommand } from '../types';

@Injectable()
export class ScheduleCreatorService {
  constructor(
    private readonly databaseService: IDatabaseService,
    private readonly loggerService: ILoggerService,
    private readonly queueService: IQueueService,
    private readonly cacheService: ICacheService,
  ) {}

  async createSchedule(command: CreateScheduleCommand): Promise<ScheduleOutput> {
    const customer = await this.databaseService.findCustomerById(command.customerId);
    if (!customer) {
      throw new NotFoundException(SCHEDULE_ERROR_MESSAGES.customerNotFound);
    }

    const doctor = await this.databaseService.findDoctorById(command.doctorId);
    if (!doctor) {
      throw new NotFoundException(SCHEDULE_ERROR_MESSAGES.doctorNotFound);
    }

    const hasConflict = await this.hasScheduleConflictWithinInterval(
      command.doctorId,
      command.scheduledAt,
    );
    if (hasConflict) {
      throw new ConflictException(SCHEDULE_ERROR_MESSAGES.scheduleConflict);
    }

    const created = await this.databaseService.createSchedule({
      objective: command.objective.trim(),
      customerId: command.customerId,
      doctorId: command.doctorId,
      scheduledAt: command.scheduledAt,
      status: command.status,
    });

    this.loggerService.log(`Schedule created: scheduleId=${created.id}`);
    await this.invalidateScheduleCache(created.id);

    await this.enqueueCreatedScheduleNotification({
      customerEmail: customer.email,
      customerName: customer.name,
      doctorName: doctor.name,
      scheduledAt: created.scheduledAt.toISOString(),
      objective: created.objective,
    });

    return ScheduleMapper.toScheduleOutput(created);
  }

  private async hasScheduleConflictWithinInterval(
    doctorId: string,
    scheduledAt: Date,
  ): Promise<boolean> {
    const intervalMs = SCHEDULE_MIN_INTERVAL_MINUTES * 60 * 1000;
    const fromScheduledAt = new Date(scheduledAt.getTime() - intervalMs);
    const toScheduledAt = new Date(scheduledAt.getTime() + intervalMs);

    const nearbySchedules = await this.databaseService.findSchedules({
      doctorId,
      fromScheduledAt,
      toScheduledAt,
    });

    return nearbySchedules.some((schedule) => {
      const diffMs = Math.abs(schedule.scheduledAt.getTime() - scheduledAt.getTime());
      return diffMs < intervalMs;
    });
  }

  private async enqueueCreatedScheduleNotification(
    payload: ScheduleEmailNotificationPayload,
  ): Promise<void> {
    try {
      await this.queueService.enqueue(
        NOTIFICATION_QUEUE_NAMES.email,
        EMAIL_NOTIFICATION_JOB_NAMES.scheduleCreated,
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
        `Schedule created email job enqueued for customerEmail=${payload.customerEmail}`,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown queue enqueue error';
      this.loggerService.error(
        `Failed to enqueue schedule created email job: ${message}`,
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
