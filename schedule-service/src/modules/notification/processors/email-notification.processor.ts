import { Injectable, OnModuleInit } from '@nestjs/common';
import { IEmailService, ILoggerService, IQueueService } from 'src/infra';
import {
  EMAIL_NOTIFICATION_JOB_NAMES,
  NOTIFICATION_QUEUE_NAMES,
} from '../constants';
import { NotificationService } from '../services/notification.service';
import { ScheduleEmailNotificationPayload } from '../types';

@Injectable()
export class EmailNotificationProcessor implements OnModuleInit {
  constructor(
    private readonly queueService: IQueueService,
    private readonly emailService: IEmailService,
    private readonly loggerService: ILoggerService,
    private readonly notificationService: NotificationService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.queueService.registerProcessor<ScheduleEmailNotificationPayload>(
      NOTIFICATION_QUEUE_NAMES.email,
      EMAIL_NOTIFICATION_JOB_NAMES.scheduleCreated,
      async (job) => {
        try {
          const message = this.notificationService.buildScheduleCreatedEmail(job.data);
          await this.emailService.sendEmail(message);
          this.loggerService.log(
            `Email job success: name=${job.name} jobId=${job.id} attempts=${job.attemptsMade}`,
          );
        } catch (error: unknown) {
          this.loggerService.error(
            `Email job failed: name=${job.name} jobId=${job.id} error=${this.getErrorMessage(error)}`,
          );
          throw this.toError(error);
        }
      },
    );

    await this.queueService.registerProcessor<ScheduleEmailNotificationPayload>(
      NOTIFICATION_QUEUE_NAMES.email,
      EMAIL_NOTIFICATION_JOB_NAMES.scheduleDeleted,
      async (job) => {
        try {
          const message = this.notificationService.buildScheduleDeletedEmail(job.data);
          await this.emailService.sendEmail(message);
          this.loggerService.log(
            `Email job success: name=${job.name} jobId=${job.id} attempts=${job.attemptsMade}`,
          );
        } catch (error: unknown) {
          this.loggerService.error(
            `Email job failed: name=${job.name} jobId=${job.id} error=${this.getErrorMessage(error)}`,
          );
          throw this.toError(error);
        }
      },
    );

    await this.queueService.registerProcessor<ScheduleEmailNotificationPayload>(
      NOTIFICATION_QUEUE_NAMES.email,
      EMAIL_NOTIFICATION_JOB_NAMES.scheduleCompleted,
      async (job) => {
        try {
          const message = this.notificationService.buildScheduleCompletedEmail(job.data);
          await this.emailService.sendEmail(message);
          this.loggerService.log(
            `Email job success: name=${job.name} jobId=${job.id} attempts=${job.attemptsMade}`,
          );
        } catch (error: unknown) {
          this.loggerService.error(
            `Email job failed: name=${job.name} jobId=${job.id} error=${this.getErrorMessage(error)}`,
          );
          throw this.toError(error);
        }
      },
    );
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown email processing error';
  }

  private toError(error: unknown): Error {
    return error instanceof Error ? error : new Error(this.getErrorMessage(error));
  }
}
