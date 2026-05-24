import { Injectable, NotFoundException } from '@nestjs/common';
import { IDatabaseService, ILoggerService, IQueueService } from 'src/infra';
import {
  EMAIL_NOTIFICATION_JOB_NAMES,
  EMAIL_NOTIFICATION_RETRY_OPTIONS,
  NOTIFICATION_QUEUE_NAMES,
} from '../../notification/constants';
import { ScheduleEmailNotificationPayload } from '../../notification/types';
import { SCHEDULE_ERROR_MESSAGES } from '../constants';
import { ScheduleOutput } from '../dtos';
import { ScheduleMapper } from '../mappers/schedule.mapper';
import { UpdateScheduleStatusCommand } from '../types';

@Injectable()
export class ScheduleUpdaterService {
  constructor(
    private readonly databaseService: IDatabaseService,
    private readonly loggerService: ILoggerService,
    private readonly queueService: IQueueService,
  ) {}

  async updateScheduleStatus(
    command: UpdateScheduleStatusCommand,
  ): Promise<ScheduleOutput> {
    const updatedSchedule = await this.databaseService.updateSchedule(command.id, {
      status: command.status,
    });

    if (!updatedSchedule) {
      throw new NotFoundException(SCHEDULE_ERROR_MESSAGES.scheduleNotFound);
    }

    this.loggerService.log(
      `Schedule status updated: scheduleId=${updatedSchedule.id} status=${updatedSchedule.status}`,
    );

    if (updatedSchedule.status === 'COMPLETED') {
      const customer = await this.databaseService.findCustomerById(
        updatedSchedule.customerId,
      );
      const doctor = await this.databaseService.findDoctorById(updatedSchedule.doctorId);

      if (!customer || !doctor) {
        this.loggerService.warn(
          `Skipping schedule completed email enqueue due to missing relation data: scheduleId=${updatedSchedule.id}`,
        );
      } else {
        await this.enqueueCompletedScheduleNotification({
          customerEmail: customer.email,
          customerName: customer.name,
          doctorName: doctor.name,
          scheduledAt: updatedSchedule.scheduledAt.toISOString(),
          objective: updatedSchedule.objective,
        });
      }
    }

    return ScheduleMapper.toScheduleOutput(updatedSchedule);
  }

  private async enqueueCompletedScheduleNotification(
    payload: ScheduleEmailNotificationPayload,
  ): Promise<void> {
    try {
      await this.queueService.enqueue(
        NOTIFICATION_QUEUE_NAMES.email,
        EMAIL_NOTIFICATION_JOB_NAMES.scheduleCompleted,
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
        `Schedule completed email job enqueued for customerEmail=${payload.customerEmail}`,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown queue enqueue error';
      this.loggerService.error(
        `Failed to enqueue schedule completed email job: ${message}`,
      );
    }
  }
}
