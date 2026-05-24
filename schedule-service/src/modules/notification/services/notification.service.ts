import { Injectable } from '@nestjs/common';
import { SendEmailData } from 'src/infra';
import { EMAIL_NOTIFICATION_SUBJECTS } from '../constants';
import { ScheduleEmailNotificationPayload } from '../types';

@Injectable()
export class NotificationService {
  buildScheduleCreatedEmail(
    payload: ScheduleEmailNotificationPayload,
  ): SendEmailData {
    const scheduledAtText = this.formatScheduledAt(payload.scheduledAt);

    return {
      to: payload.customerEmail,
      subject: EMAIL_NOTIFICATION_SUBJECTS.scheduleCreated,
      text:
        `Hello ${payload.customerName},\n\n` +
        `Your consultation schedule has been created.\n` +
        `Doctor: ${payload.doctorName}\n` +
        `Scheduled At: ${scheduledAtText}\n` +
        `Objective: ${payload.objective}\n\n` +
        `Thank you.`,
    };
  }

  buildScheduleDeletedEmail(
    payload: ScheduleEmailNotificationPayload,
  ): SendEmailData {
    const scheduledAtText = this.formatScheduledAt(payload.scheduledAt);

    return {
      to: payload.customerEmail,
      subject: EMAIL_NOTIFICATION_SUBJECTS.scheduleDeleted,
      text:
        `Hello ${payload.customerName},\n\n` +
        `Your consultation schedule has been canceled.\n` +
        `Doctor: ${payload.doctorName}\n` +
        `Scheduled At: ${scheduledAtText}\n` +
        `Objective: ${payload.objective}\n\n` +
        `Please contact support if you need a new appointment.`,
    };
  }

  buildScheduleCompletedEmail(
    payload: ScheduleEmailNotificationPayload,
  ): SendEmailData {
    const scheduledAtText = this.formatScheduledAt(payload.scheduledAt);

    return {
      to: payload.customerEmail,
      subject: EMAIL_NOTIFICATION_SUBJECTS.scheduleCompleted,
      text:
        `Hello ${payload.customerName},\n\n` +
        `Your consultation has been marked as completed.\n` +
        `Doctor: ${payload.doctorName}\n` +
        `Scheduled At: ${scheduledAtText}\n` +
        `Objective: ${payload.objective}\n\n` +
        `Thank you for using our service.`,
    };
  }

  private formatScheduledAt(value: string): string {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toISOString();
  }
}
