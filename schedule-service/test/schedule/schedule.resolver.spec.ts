import { ScheduleStatusEnum } from 'src/modules/schedule/constants';
import { ScheduleResolver } from 'src/modules/schedule/resolvers/schedule.resolver';

describe('ScheduleResolver', () => {
  const scheduleCreatorService = {
    createSchedule: jest.fn(),
  };
  const scheduleReaderService = {
    getSchedules: jest.fn(),
    getScheduleById: jest.fn(),
  };
  const scheduleRemoverService = {
    deleteSchedule: jest.fn(),
  };
  const scheduleUpdaterService = {
    updateScheduleStatus: jest.fn(),
  };

  const resolver = new ScheduleResolver(
    scheduleCreatorService as never,
    scheduleReaderService as never,
    scheduleRemoverService as never,
    scheduleUpdaterService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolvers delegate createSchedule to service', async () => {
    const output = { id: 'schedule-1' };
    scheduleCreatorService.createSchedule.mockResolvedValue(output);

    const scheduledAt = new Date('2026-06-01T09:00:00.000Z');
    const result = await resolver.createSchedule({
      objective: 'General checkup',
      customerId: 'customer-1',
      doctorId: 'doctor-1',
      scheduledAt,
      status: ScheduleStatusEnum.PENDING,
    });

    expect(scheduleCreatorService.createSchedule).toHaveBeenCalledWith({
      objective: 'General checkup',
      customerId: 'customer-1',
      doctorId: 'doctor-1',
      scheduledAt,
      status: 'PENDING',
    });
    expect(result).toEqual(output);
  });

  it('resolvers delegate schedules to service', async () => {
    const output = { items: [], total: 0, skip: 0, take: 10 };
    scheduleReaderService.getSchedules.mockResolvedValue(output);

    const fromScheduledAt = new Date('2026-06-01T08:00:00.000Z');
    const toScheduledAt = new Date('2026-06-01T10:00:00.000Z');
    const result = await resolver.schedules({
      customerId: 'customer-1',
      doctorId: 'doctor-1',
      status: ScheduleStatusEnum.PENDING,
      fromScheduledAt,
      toScheduledAt,
      skip: 2,
      take: 5,
    });

    expect(scheduleReaderService.getSchedules).toHaveBeenCalledWith({
      customerId: 'customer-1',
      doctorId: 'doctor-1',
      status: 'PENDING',
      fromScheduledAt,
      toScheduledAt,
      skip: 2,
      take: 5,
    });
    expect(result).toEqual(output);
  });

  it('resolvers delegate schedule to service', async () => {
    const output = { id: 'schedule-1' };
    scheduleReaderService.getScheduleById.mockResolvedValue(output);

    const result = await resolver.schedule({ id: 'schedule-1' });

    expect(scheduleReaderService.getScheduleById).toHaveBeenCalledWith('schedule-1');
    expect(result).toEqual(output);
  });

  it('resolvers delegate deleteSchedule to service', async () => {
    const output = { id: 'schedule-1' };
    scheduleRemoverService.deleteSchedule.mockResolvedValue(output);

    const result = await resolver.deleteSchedule({ id: 'schedule-1' });

    expect(scheduleRemoverService.deleteSchedule).toHaveBeenCalledWith('schedule-1');
    expect(result).toEqual(output);
  });

  it('resolvers delegate updateScheduleStatus to service', async () => {
    const output = { id: 'schedule-1', status: 'COMPLETED' };
    scheduleUpdaterService.updateScheduleStatus.mockResolvedValue(output);

    const result = await resolver.updateScheduleStatus({
      id: 'schedule-1',
      status: ScheduleStatusEnum.COMPLETED,
    });

    expect(scheduleUpdaterService.updateScheduleStatus).toHaveBeenCalledWith({
      id: 'schedule-1',
      status: 'COMPLETED',
    });
    expect(result).toEqual(output);
  });
});
