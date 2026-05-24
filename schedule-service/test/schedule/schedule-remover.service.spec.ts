import { NotFoundException } from '@nestjs/common';
import { SCHEDULE_ERROR_MESSAGES } from 'src/modules/schedule/constants';
import { ScheduleRemoverService } from 'src/modules/schedule/services/schedule-remover.service';
import {
  createMockCacheService,
  createMockLoggerService,
  createMockQueueService,
  createMockScheduleDatabaseService,
} from '../setup/test-utils';

describe('ScheduleRemoverService', () => {
  const databaseService = createMockScheduleDatabaseService();
  const loggerService = createMockLoggerService();
  const queueService = createMockQueueService();
  const cacheService = createMockCacheService();
  const service = new ScheduleRemoverService(
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

  it('deleteSchedule deletes schedule', async () => {
    databaseService.findScheduleById.mockResolvedValue(schedule);
    databaseService.findCustomerById.mockResolvedValue(customer);
    databaseService.findDoctorById.mockResolvedValue(doctor);
    databaseService.deleteSchedule.mockResolvedValue(schedule);

    const result = await service.deleteSchedule(schedule.id);

    expect(databaseService.findScheduleById).toHaveBeenCalledWith(schedule.id);
    expect(databaseService.deleteSchedule).toHaveBeenCalledWith(schedule.id);
    expect(cacheService.deleteByPattern).toHaveBeenCalledWith('schedule:list:*');
    expect(cacheService.delete).toHaveBeenCalledWith(`schedule:id:${schedule.id}`);
    expect(queueService.enqueue).toHaveBeenCalled();
    expect(result.id).toBe(schedule.id);
  });

  it('deleteSchedule throws not found when schedule does not exist', async () => {
    databaseService.findScheduleById.mockResolvedValue(null);

    await expect(service.deleteSchedule('missing-id')).rejects.toThrow(
      new NotFoundException(SCHEDULE_ERROR_MESSAGES.scheduleNotFound),
    );

    expect(databaseService.deleteSchedule).not.toHaveBeenCalled();
    expect(cacheService.deleteByPattern).not.toHaveBeenCalled();
  });

  it('cache invalidation happens after successful delete', async () => {
    databaseService.findScheduleById.mockResolvedValue(schedule);
    databaseService.findCustomerById.mockResolvedValue(customer);
    databaseService.findDoctorById.mockResolvedValue(doctor);
    databaseService.deleteSchedule.mockResolvedValue(schedule);

    await service.deleteSchedule(schedule.id);

    const deleteOrder = databaseService.deleteSchedule.mock.invocationCallOrder[0];
    const invalidateOrder = cacheService.deleteByPattern.mock.invocationCallOrder[0];
    expect(invalidateOrder).toBeGreaterThan(deleteOrder);
  });
});
