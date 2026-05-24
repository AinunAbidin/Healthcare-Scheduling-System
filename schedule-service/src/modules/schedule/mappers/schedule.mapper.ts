import { DatabaseSchedule } from 'src/infra';
import { ScheduleStatusEnum } from '../constants';
import { ScheduleListOutput, ScheduleOutput } from '../dtos';

export class ScheduleMapper {
  static toScheduleOutput(schedule: DatabaseSchedule): ScheduleOutput {
    return {
      id: schedule.id,
      objective: schedule.objective,
      customerId: schedule.customerId,
      doctorId: schedule.doctorId,
      scheduledAt: schedule.scheduledAt,
      status: schedule.status as ScheduleStatusEnum,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
    };
  }

  static toScheduleListOutput(
    items: DatabaseSchedule[],
    total: number,
    skip: number,
    take: number,
  ): ScheduleListOutput {
    return {
      items: items.map((item) => this.toScheduleOutput(item)),
      total,
      skip,
      take,
    };
  }
}
