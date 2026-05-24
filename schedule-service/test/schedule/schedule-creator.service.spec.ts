import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SCHEDULE_ERROR_MESSAGES } from 'src/modules/schedule/constants';
import { ScheduleCreatorService } from 'src/modules/schedule/services/schedule-creator.service';
import {
  createMockCacheService,
  createMockLoggerService,
  createMockQueueService,
  createMockScheduleDatabaseService,
} from '../setup/test-utils';

describe('ScheduleCreatorService', () => {
  const databaseService = createMockScheduleDatabaseService();
  const loggerService = createMockLoggerService();
  const queueService = createMockQueueService();
  const cacheService = createMockCacheService();
  const service = new ScheduleCreatorService(
    databaseService,
    loggerService,
    queueService,
    cacheService,
  );

  const customer = {
    id: 'customer-1',
    name: 'Alice',
    email: 'alice@example.com',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const doctor = {
    id: 'doctor-1',
    name: 'Dr. Smith',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const schedule = {
    id: 'schedule-1',
    objective: 'General checkup',
    customerId: customer.id,
    doctorId: doctor.id,
    scheduledAt: new Date('2026-06-01T09:00:00.000Z'),
    status: 'PENDING' as const,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    cacheService.delete.mockResolvedValue(undefined);
    cacheService.deleteByPattern.mockResolvedValue(undefined);
    queueService.enqueue.mockResolvedValue(undefined);
  });

  it('createSchedule succeeds when customer exists, doctor exists, and no conflict exists', async () => {
    databaseService.findCustomerById.mockResolvedValue(customer);
    databaseService.findDoctorById.mockResolvedValue(doctor);
    databaseService.findSchedules.mockResolvedValue([]);
    databaseService.createSchedule.mockResolvedValue(schedule);

    const result = await service.createSchedule({
      objective: schedule.objective,
      customerId: customer.id,
      doctorId: doctor.id,
      scheduledAt: schedule.scheduledAt,
      status: 'PENDING',
    });

    expect(databaseService.findCustomerById).toHaveBeenCalledWith(customer.id);
    expect(databaseService.findDoctorById).toHaveBeenCalledWith(doctor.id);
    expect(databaseService.createSchedule).toHaveBeenCalled();
    expect(cacheService.deleteByPattern).toHaveBeenCalledWith('schedule:list:*');
    expect(cacheService.delete).toHaveBeenCalledWith(`schedule:id:${schedule.id}`);
    expect(queueService.enqueue).toHaveBeenCalled();
    expect(result.id).toBe(schedule.id);
  });

  it('createSchedule rejects missing customer', async () => {
    databaseService.findCustomerById.mockResolvedValue(null);

    await expect(
      service.createSchedule({
        objective: 'General checkup',
        customerId: 'missing-customer',
        doctorId: doctor.id,
        scheduledAt: schedule.scheduledAt,
      }),
    ).rejects.toThrow(new NotFoundException(SCHEDULE_ERROR_MESSAGES.customerNotFound));

    expect(databaseService.findDoctorById).not.toHaveBeenCalled();
    expect(databaseService.createSchedule).not.toHaveBeenCalled();
    expect(cacheService.deleteByPattern).not.toHaveBeenCalled();
  });

  it('createSchedule rejects missing doctor', async () => {
    databaseService.findCustomerById.mockResolvedValue(customer);
    databaseService.findDoctorById.mockResolvedValue(null);

    await expect(
      service.createSchedule({
        objective: 'General checkup',
        customerId: customer.id,
        doctorId: 'missing-doctor',
        scheduledAt: schedule.scheduledAt,
      }),
    ).rejects.toThrow(new NotFoundException(SCHEDULE_ERROR_MESSAGES.doctorNotFound));

    expect(databaseService.createSchedule).not.toHaveBeenCalled();
    expect(cacheService.deleteByPattern).not.toHaveBeenCalled();
  });

  it('createSchedule rejects same doctor and same scheduledAt conflict', async () => {
    databaseService.findCustomerById.mockResolvedValue(customer);
    databaseService.findDoctorById.mockResolvedValue(doctor);
    databaseService.findSchedules.mockResolvedValue([schedule]);

    await expect(
      service.createSchedule({
        objective: schedule.objective,
        customerId: customer.id,
        doctorId: doctor.id,
        scheduledAt: schedule.scheduledAt,
      }),
    ).rejects.toThrow(new ConflictException(SCHEDULE_ERROR_MESSAGES.scheduleConflict));

    expect(databaseService.createSchedule).not.toHaveBeenCalled();
    expect(cacheService.deleteByPattern).not.toHaveBeenCalled();
  });

  it('cache invalidation happens after successful create', async () => {
    databaseService.findCustomerById.mockResolvedValue(customer);
    databaseService.findDoctorById.mockResolvedValue(doctor);
    databaseService.findSchedules.mockResolvedValue([]);
    databaseService.createSchedule.mockResolvedValue(schedule);

    await service.createSchedule({
      objective: schedule.objective,
      customerId: customer.id,
      doctorId: doctor.id,
      scheduledAt: schedule.scheduledAt,
      status: 'PENDING',
    });

    const createOrder = databaseService.createSchedule.mock.invocationCallOrder[0];
    const invalidationOrder = cacheService.deleteByPattern.mock.invocationCallOrder[0];
    expect(invalidationOrder).toBeGreaterThan(createOrder);
  });
});
