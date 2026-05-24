import { NotFoundException } from '@nestjs/common';
import { SCHEDULE_ERROR_MESSAGES } from 'src/modules/schedule/constants';
import { ScheduleReaderService } from 'src/modules/schedule/services/schedule-reader.service';
import {
  createMockCacheService,
  createMockLoggerService,
  createMockScheduleDatabaseService,
} from '../setup/test-utils';

describe('ScheduleReaderService', () => {
  const databaseService = createMockScheduleDatabaseService();
  const loggerService = createMockLoggerService();
  const cacheService = createMockCacheService();
  const service = new ScheduleReaderService(databaseService, loggerService, cacheService);

  const schedule = {
    id: 'schedule-1',
    objective: 'General checkup',
    customerId: 'customer-1',
    doctorId: 'doctor-1',
    scheduledAt: new Date('2026-06-01T09:00:00.000Z'),
    status: 'PENDING' as const,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    cacheService.get.mockResolvedValue(null);
    cacheService.set.mockResolvedValue(undefined);
  });

  it('schedules returns filtered paginated result', async () => {
    databaseService.findSchedules.mockResolvedValue([schedule]);
    databaseService.countSchedules.mockResolvedValue(1);

    const query = {
      customerId: schedule.customerId,
      doctorId: schedule.doctorId,
      status: 'PENDING' as const,
      fromScheduledAt: new Date('2026-06-01T08:00:00.000Z'),
      toScheduledAt: new Date('2026-06-01T10:00:00.000Z'),
      skip: 2,
      take: 5,
    };

    const result = await service.getSchedules(query);

    expect(databaseService.findSchedules).toHaveBeenCalledWith({
      customerId: query.customerId,
      doctorId: query.doctorId,
      status: query.status,
      fromScheduledAt: query.fromScheduledAt,
      toScheduledAt: query.toScheduledAt,
      skip: 2,
      take: 5,
    });
    expect(databaseService.countSchedules).toHaveBeenCalledWith({
      customerId: query.customerId,
      doctorId: query.doctorId,
      status: query.status,
      fromScheduledAt: query.fromScheduledAt,
      toScheduledAt: query.toScheduledAt,
    });
    expect(cacheService.set).toHaveBeenCalledWith(
      'schedule:list:customerId=customer-1:doctorId=doctor-1:status=PENDING:fromScheduledAt=2026-06-01T08:00:00.000Z:toScheduledAt=2026-06-01T10:00:00.000Z:skip=2:take=5',
      expect.any(Object),
    );
    expect(result.items).toHaveLength(1);
  });

  it('schedule returns record by ID', async () => {
    databaseService.findScheduleById.mockResolvedValue(schedule);

    const result = await service.getScheduleById(schedule.id);

    expect(databaseService.findScheduleById).toHaveBeenCalledWith(schedule.id);
    expect(cacheService.set).toHaveBeenCalledWith(
      `schedule:id:${schedule.id}`,
      expect.any(Object),
    );
    expect(result.id).toBe(schedule.id);
  });

  it('cache hit returns schedules without querying database', async () => {
    cacheService.get.mockResolvedValue({
      items: [
        {
          ...schedule,
          scheduledAt: schedule.scheduledAt.toISOString(),
          createdAt: schedule.createdAt.toISOString(),
          updatedAt: schedule.updatedAt.toISOString(),
        },
      ],
      total: 1,
      skip: 0,
      take: 10,
    });

    const result = await service.getSchedules({});

    expect(databaseService.findSchedules).not.toHaveBeenCalled();
    expect(databaseService.countSchedules).not.toHaveBeenCalled();
    expect(result.items[0].scheduledAt).toBeInstanceOf(Date);
    expect(result.items[0].createdAt).toBeInstanceOf(Date);
    expect(result.items[0].updatedAt).toBeInstanceOf(Date);
  });

  it('cache miss reads from database then stores cache', async () => {
    databaseService.findSchedules.mockResolvedValue([schedule]);
    databaseService.countSchedules.mockResolvedValue(1);

    await service.getSchedules({
      skip: 0,
      take: 10,
    });

    expect(databaseService.findSchedules).toHaveBeenCalled();
    expect(cacheService.set).toHaveBeenCalledWith(
      'schedule:list:customerId=:doctorId=:status=:fromScheduledAt=:toScheduledAt=:skip=0:take=10',
      expect.any(Object),
    );
  });

  it('getScheduleById throws not found when record does not exist', async () => {
    databaseService.findScheduleById.mockResolvedValue(null);

    await expect(service.getScheduleById('missing-id')).rejects.toThrow(
      new NotFoundException(SCHEDULE_ERROR_MESSAGES.scheduleNotFound),
    );
  });
});
