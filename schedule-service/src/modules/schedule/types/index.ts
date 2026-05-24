import { ScheduleStatus } from 'src/infra';

export interface CreateScheduleCommand {
  objective: string;
  customerId: string;
  doctorId: string;
  scheduledAt: Date;
  status?: ScheduleStatus;
}

export interface ScheduleIdQuery {
  id: string;
}

export interface ScheduleListQuery {
  customerId?: string;
  doctorId?: string;
  status?: ScheduleStatus;
  fromScheduledAt?: Date;
  toScheduledAt?: Date;
  skip?: number;
  take?: number;
}

export interface SchedulePagination {
  skip: number;
  take: number;
}

export interface UpdateScheduleStatusCommand {
  id: string;
  status: ScheduleStatus;
}
