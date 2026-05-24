import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { DatabaseConfig } from 'src/config';
import {
  CountSchedulesParams,
  CreateCustomerData,
  CreateDoctorData,
  CreateScheduleData,
  DatabaseCustomer,
  DatabaseDoctor,
  DatabaseSchedule,
  FindSchedulesParams,
  IDatabaseService,
  PaginationParams,
  ScheduleStatus,
  UpdateScheduleData,
  UpdateCustomerData,
  UpdateDoctorData,
} from './database.interface';

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DoctorRow {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ScheduleRow {
  id: string;
  objective: string;
  customerId: string;
  doctorId: string;
  scheduledAt: Date;
  status: ScheduleStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface CustomerDelegate {
  create(args: { data: CreateCustomerData }): Promise<CustomerRow>;
  update(args: { where: { id: string }; data: UpdateCustomerData }): Promise<CustomerRow>;
  findUnique(args: {
    where: { id?: string; email?: string };
  }): Promise<CustomerRow | null>;
  findMany(args: {
    skip?: number;
    take?: number;
    orderBy?: { createdAt: 'asc' | 'desc' };
  }): Promise<CustomerRow[]>;
  count(): Promise<number>;
  delete(args: { where: { id: string } }): Promise<CustomerRow>;
}

interface DoctorDelegate {
  create(args: { data: CreateDoctorData }): Promise<DoctorRow>;
  update(args: { where: { id: string }; data: UpdateDoctorData }): Promise<DoctorRow>;
  findUnique(args: { where: { id: string } }): Promise<DoctorRow | null>;
  findMany(args: {
    skip?: number;
    take?: number;
    orderBy?: { createdAt: 'asc' | 'desc' };
  }): Promise<DoctorRow[]>;
  count(): Promise<number>;
  delete(args: { where: { id: string } }): Promise<DoctorRow>;
}

interface ScheduleWhereInput {
  customerId?: string;
  doctorId?: string;
  status?: ScheduleStatus;
  scheduledAt?: {
    gte?: Date;
    lte?: Date;
  };
}

interface ScheduleDelegate {
  create(args: { data: CreateScheduleData }): Promise<ScheduleRow>;
  update(args: { where: { id: string }; data: UpdateScheduleData }): Promise<ScheduleRow>;
  findMany(args: {
    where?: ScheduleWhereInput;
    skip?: number;
    take?: number;
    orderBy?: { scheduledAt: 'asc' | 'desc' };
  }): Promise<ScheduleRow[]>;
  count(args: { where?: ScheduleWhereInput }): Promise<number>;
  findUnique(args: { where: { id: string } }): Promise<ScheduleRow | null>;
  findFirst(args: { where: { doctorId: string; scheduledAt: Date } }): Promise<ScheduleRow | null>;
  delete(args: { where: { id: string } }): Promise<ScheduleRow>;
}

interface PrismaClientLike {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  customer: CustomerDelegate;
  doctor: DoctorDelegate;
  schedule: ScheduleDelegate;
}

@Injectable()
export class PostgresInfra implements IDatabaseService, OnModuleDestroy {
  private prismaClient: PrismaClientLike | null = null;

  async connect(): Promise<void> {
    const client = this.getPrismaClient();
    await client.$connect();
  }

  async disconnect(): Promise<void> {
    if (!this.prismaClient) {
      return;
    }

    await this.prismaClient.$disconnect();
    this.prismaClient = null;
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  async createCustomer(data: CreateCustomerData): Promise<DatabaseCustomer> {
    const row = await this.getPrismaClient().customer.create({ data });
    return this.toDatabaseCustomer(row);
  }

  async updateCustomer(
    id: string,
    data: UpdateCustomerData,
  ): Promise<DatabaseCustomer | null> {
    const existing = await this.getPrismaClient().customer.findUnique({
      where: { id },
    });

    if (!existing) {
      return null;
    }

    const row = await this.getPrismaClient().customer.update({
      where: { id },
      data,
    });

    return this.toDatabaseCustomer(row);
  }

  async findCustomers(params: PaginationParams): Promise<DatabaseCustomer[]> {
    const rows = await this.getPrismaClient().customer.findMany({
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.toDatabaseCustomer(row));
  }

  async countCustomers(): Promise<number> {
    return this.getPrismaClient().customer.count();
  }

  async findCustomerById(id: string): Promise<DatabaseCustomer | null> {
    const row = await this.getPrismaClient().customer.findUnique({
      where: { id },
    });

    return row ? this.toDatabaseCustomer(row) : null;
  }

  async findCustomerByEmail(email: string): Promise<DatabaseCustomer | null> {
    const row = await this.getPrismaClient().customer.findUnique({
      where: { email },
    });

    return row ? this.toDatabaseCustomer(row) : null;
  }

  async deleteCustomer(id: string): Promise<DatabaseCustomer | null> {
    const existing = await this.getPrismaClient().customer.findUnique({
      where: { id },
    });

    if (!existing) {
      return null;
    }

    const row = await this.getPrismaClient().customer.delete({
      where: { id },
    });

    return this.toDatabaseCustomer(row);
  }

  async createDoctor(data: CreateDoctorData): Promise<DatabaseDoctor> {
    const row = await this.getPrismaClient().doctor.create({ data });
    return this.toDatabaseDoctor(row);
  }

  async updateDoctor(id: string, data: UpdateDoctorData): Promise<DatabaseDoctor | null> {
    const existing = await this.getPrismaClient().doctor.findUnique({
      where: { id },
    });

    if (!existing) {
      return null;
    }

    const row = await this.getPrismaClient().doctor.update({
      where: { id },
      data,
    });

    return this.toDatabaseDoctor(row);
  }

  async findDoctors(params: PaginationParams): Promise<DatabaseDoctor[]> {
    const rows = await this.getPrismaClient().doctor.findMany({
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.toDatabaseDoctor(row));
  }

  async countDoctors(): Promise<number> {
    return this.getPrismaClient().doctor.count();
  }

  async findDoctorById(id: string): Promise<DatabaseDoctor | null> {
    const row = await this.getPrismaClient().doctor.findUnique({
      where: { id },
    });

    return row ? this.toDatabaseDoctor(row) : null;
  }

  async deleteDoctor(id: string): Promise<DatabaseDoctor | null> {
    const existing = await this.getPrismaClient().doctor.findUnique({
      where: { id },
    });

    if (!existing) {
      return null;
    }

    const row = await this.getPrismaClient().doctor.delete({
      where: { id },
    });

    return this.toDatabaseDoctor(row);
  }

  async createSchedule(data: CreateScheduleData): Promise<DatabaseSchedule> {
    const row = await this.getPrismaClient().schedule.create({
      data: {
        objective: data.objective,
        customerId: data.customerId,
        doctorId: data.doctorId,
        scheduledAt: data.scheduledAt,
        status: data.status ?? 'PENDING',
      },
    });

    return this.toDatabaseSchedule(row);
  }

  async findSchedules(params: FindSchedulesParams): Promise<DatabaseSchedule[]> {
    const rows = await this.getPrismaClient().schedule.findMany({
      where: this.toScheduleWhere(params),
      skip: params.skip,
      take: params.take,
      orderBy: { scheduledAt: 'desc' },
    });

    return rows.map((row) => this.toDatabaseSchedule(row));
  }

  async countSchedules(params: CountSchedulesParams): Promise<number> {
    return this.getPrismaClient().schedule.count({
      where: this.toScheduleWhere(params),
    });
  }

  async findScheduleById(id: string): Promise<DatabaseSchedule | null> {
    const row = await this.getPrismaClient().schedule.findUnique({
      where: { id },
    });

    return row ? this.toDatabaseSchedule(row) : null;
  }

  async findScheduleByDoctorAndScheduledAt(
    doctorId: string,
    scheduledAt: Date,
  ): Promise<DatabaseSchedule | null> {
    const row = await this.getPrismaClient().schedule.findFirst({
      where: { doctorId, scheduledAt },
    });

    return row ? this.toDatabaseSchedule(row) : null;
  }

  async updateSchedule(
    id: string,
    data: UpdateScheduleData,
  ): Promise<DatabaseSchedule | null> {
    const existing = await this.getPrismaClient().schedule.findUnique({
      where: { id },
    });

    if (!existing) {
      return null;
    }

    const row = await this.getPrismaClient().schedule.update({
      where: { id },
      data,
    });

    return this.toDatabaseSchedule(row);
  }

  async deleteSchedule(id: string): Promise<DatabaseSchedule | null> {
    const existing = await this.getPrismaClient().schedule.findUnique({
      where: { id },
    });

    if (!existing) {
      return null;
    }

    const row = await this.getPrismaClient().schedule.delete({
      where: { id },
    });

    return this.toDatabaseSchedule(row);
  }

  private getPrismaClient(): PrismaClientLike {
    if (this.prismaClient) {
      return this.prismaClient;
    }

    const prismaModule = require('@prisma/client') as Record<string, unknown>;
    const prismaClientCandidate = prismaModule.PrismaClient;

    if (typeof prismaClientCandidate !== 'function') {
      throw new Error('PrismaClient is unavailable. Run `prisma generate` first.');
    }

    const PrismaClientConstructor = prismaClientCandidate as new (options: {
      datasources: { db: { url: string } };
    }) => PrismaClientLike;

    this.prismaClient = new PrismaClientConstructor({
      datasources: {
        db: {
          url: DatabaseConfig.url,
        },
      },
    });

    return this.prismaClient;
  }

  private toScheduleWhere(params: CountSchedulesParams): ScheduleWhereInput {
    const where: ScheduleWhereInput = {};

    if (params.customerId) {
      where.customerId = params.customerId;
    }

    if (params.doctorId) {
      where.doctorId = params.doctorId;
    }

    if (params.status) {
      where.status = params.status;
    }

    const hasFrom = params.fromScheduledAt instanceof Date;
    const hasTo = params.toScheduledAt instanceof Date;
    if (hasFrom || hasTo) {
      where.scheduledAt = {
        ...(hasFrom ? { gte: params.fromScheduledAt } : {}),
        ...(hasTo ? { lte: params.toScheduledAt } : {}),
      };
    }

    return where;
  }

  private toDatabaseCustomer(row: CustomerRow): DatabaseCustomer {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toDatabaseDoctor(row: DoctorRow): DatabaseDoctor {
    return {
      id: row.id,
      name: row.name,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toDatabaseSchedule(row: ScheduleRow): DatabaseSchedule {
    return {
      id: row.id,
      objective: row.objective,
      customerId: row.customerId,
      doctorId: row.doctorId,
      scheduledAt: row.scheduledAt,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
