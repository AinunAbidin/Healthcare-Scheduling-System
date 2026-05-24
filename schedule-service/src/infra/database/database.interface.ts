export type ScheduleStatus = 'PENDING' | 'COMPLETED' | 'CANCELED';

export interface DatabaseCustomer {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseDoctor {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseSchedule {
  id: string;
  objective: string;
  customerId: string;
  doctorId: string;
  scheduledAt: Date;
  status: ScheduleStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  skip?: number;
  take?: number;
}

export interface CreateCustomerData {
  name: string;
  email: string;
}

export interface UpdateCustomerData {
  name?: string;
  email?: string;
}

export interface CreateDoctorData {
  name: string;
}

export interface UpdateDoctorData {
  name?: string;
}

export interface CreateScheduleData {
  objective: string;
  customerId: string;
  doctorId: string;
  scheduledAt: Date;
  status?: ScheduleStatus;
}

export interface UpdateScheduleData {
  status: ScheduleStatus;
}

export interface FindSchedulesParams extends PaginationParams {
  customerId?: string;
  doctorId?: string;
  status?: ScheduleStatus;
  fromScheduledAt?: Date;
  toScheduledAt?: Date;
}

export type CountSchedulesParams = Omit<FindSchedulesParams, 'skip' | 'take'>;

export abstract class IDatabaseService {
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;

  abstract createCustomer(data: CreateCustomerData): Promise<DatabaseCustomer>;
  abstract updateCustomer(
    id: string,
    data: UpdateCustomerData,
  ): Promise<DatabaseCustomer | null>;
  abstract findCustomers(params: PaginationParams): Promise<DatabaseCustomer[]>;
  abstract countCustomers(): Promise<number>;
  abstract findCustomerById(id: string): Promise<DatabaseCustomer | null>;
  abstract findCustomerByEmail(email: string): Promise<DatabaseCustomer | null>;
  abstract deleteCustomer(id: string): Promise<DatabaseCustomer | null>;

  abstract createDoctor(data: CreateDoctorData): Promise<DatabaseDoctor>;
  abstract updateDoctor(id: string, data: UpdateDoctorData): Promise<DatabaseDoctor | null>;
  abstract findDoctors(params: PaginationParams): Promise<DatabaseDoctor[]>;
  abstract countDoctors(): Promise<number>;
  abstract findDoctorById(id: string): Promise<DatabaseDoctor | null>;
  abstract deleteDoctor(id: string): Promise<DatabaseDoctor | null>;

  abstract createSchedule(data: CreateScheduleData): Promise<DatabaseSchedule>;
  abstract findSchedules(params: FindSchedulesParams): Promise<DatabaseSchedule[]>;
  abstract countSchedules(params: CountSchedulesParams): Promise<number>;
  abstract findScheduleById(id: string): Promise<DatabaseSchedule | null>;
  abstract findScheduleByDoctorAndScheduledAt(
    doctorId: string,
    scheduledAt: Date,
  ): Promise<DatabaseSchedule | null>;
  abstract updateSchedule(
    id: string,
    data: UpdateScheduleData,
  ): Promise<DatabaseSchedule | null>;
  abstract deleteSchedule(id: string): Promise<DatabaseSchedule | null>;
}
