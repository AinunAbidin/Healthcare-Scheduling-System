import { NotFoundException } from '@nestjs/common';
import { DOCTOR_ERROR_MESSAGES } from 'src/modules/doctor/constants';
import { DoctorService } from 'src/modules/doctor/services/doctor.service';
import {
  createMockCacheService,
  createMockLoggerService,
  createMockScheduleDatabaseService,
} from '../setup/test-utils';

describe('DoctorService', () => {
  const databaseService = createMockScheduleDatabaseService();
  const loggerService = createMockLoggerService();
  const cacheService = createMockCacheService();
  const service = new DoctorService(databaseService, loggerService, cacheService);

  const doctor = {
    id: 'doctor-1',
    name: 'Dr. Smith',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    cacheService.get.mockResolvedValue(null);
    cacheService.set.mockResolvedValue(undefined);
    cacheService.delete.mockResolvedValue(undefined);
    cacheService.deleteByPattern.mockResolvedValue(undefined);
  });

  it('createDoctor creates doctor', async () => {
    databaseService.createDoctor.mockResolvedValue(doctor);

    const result = await service.createDoctor({ name: '  Dr. Smith  ' });

    expect(databaseService.createDoctor).toHaveBeenCalledWith({ name: 'Dr. Smith' });
    expect(cacheService.deleteByPattern).toHaveBeenCalledWith('doctor:list:*');
    expect(cacheService.delete).toHaveBeenCalledWith(`doctor:id:${doctor.id}`);
    expect(result.id).toBe(doctor.id);
  });

  it('updateDoctor updates doctor', async () => {
    const updatedDoctor = {
      ...doctor,
      name: 'Dr. Updated',
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };

    databaseService.findDoctorById.mockResolvedValue(doctor);
    databaseService.updateDoctor.mockResolvedValue(updatedDoctor);

    const result = await service.updateDoctor({
      id: doctor.id,
      name: 'Dr. Updated',
    });

    expect(databaseService.updateDoctor).toHaveBeenCalledWith(doctor.id, {
      name: 'Dr. Updated',
    });
    expect(cacheService.deleteByPattern).toHaveBeenCalledWith('doctor:list:*');
    expect(cacheService.delete).toHaveBeenCalledWith(`doctor:id:${doctor.id}`);
    expect(result.name).toBe('Dr. Updated');
  });

  it('doctors returns paginated result', async () => {
    databaseService.findDoctors.mockResolvedValue([doctor]);
    databaseService.countDoctors.mockResolvedValue(1);

    const result = await service.getDoctors({
      skip: 3,
      take: 7,
    });

    expect(databaseService.findDoctors).toHaveBeenCalledWith({ skip: 3, take: 7 });
    expect(cacheService.set).toHaveBeenCalledWith(
      'doctor:list:skip=3:take=7',
      expect.objectContaining({
        total: 1,
        skip: 3,
        take: 7,
      }),
    );
    expect(result.items).toHaveLength(1);
  });

  it('doctor returns record by ID', async () => {
    databaseService.findDoctorById.mockResolvedValue(doctor);

    const result = await service.getDoctorById(doctor.id);

    expect(databaseService.findDoctorById).toHaveBeenCalledWith(doctor.id);
    expect(cacheService.set).toHaveBeenCalledWith(
      `doctor:id:${doctor.id}`,
      expect.objectContaining({ id: doctor.id }),
    );
    expect(result.id).toBe(doctor.id);
  });

  it('deleteDoctor deletes doctor', async () => {
    databaseService.deleteDoctor.mockResolvedValue(doctor);

    const result = await service.deleteDoctor(doctor.id);

    expect(databaseService.deleteDoctor).toHaveBeenCalledWith(doctor.id);
    expect(cacheService.deleteByPattern).toHaveBeenCalledWith('doctor:list:*');
    expect(cacheService.delete).toHaveBeenCalledWith(`doctor:id:${doctor.id}`);
    expect(result.id).toBe(doctor.id);
  });

  it('cache hit returns doctors without querying database', async () => {
    cacheService.get.mockResolvedValue({
      items: [
        {
          ...doctor,
          createdAt: doctor.createdAt.toISOString(),
          updatedAt: doctor.updatedAt.toISOString(),
        },
      ],
      total: 1,
      skip: 0,
      take: 10,
    });

    const result = await service.getDoctors({});

    expect(databaseService.findDoctors).not.toHaveBeenCalled();
    expect(databaseService.countDoctors).not.toHaveBeenCalled();
    expect(result.items[0].createdAt).toBeInstanceOf(Date);
    expect(result.items[0].updatedAt).toBeInstanceOf(Date);
  });

  it('cache miss reads from database then stores cache', async () => {
    databaseService.findDoctors.mockResolvedValue([doctor]);
    databaseService.countDoctors.mockResolvedValue(1);

    await service.getDoctors({ skip: 0, take: 10 });

    expect(databaseService.findDoctors).toHaveBeenCalled();
    expect(cacheService.set).toHaveBeenCalledWith(
      'doctor:list:skip=0:take=10',
      expect.any(Object),
    );
  });

  it('cache invalidation happens after successful write/delete', async () => {
    databaseService.createDoctor.mockResolvedValue(doctor);
    databaseService.deleteDoctor.mockResolvedValue(doctor);

    await service.createDoctor({ name: doctor.name });
    await service.deleteDoctor(doctor.id);

    const createOrder = databaseService.createDoctor.mock.invocationCallOrder[0];
    const invalidateAfterCreateOrder =
      cacheService.deleteByPattern.mock.invocationCallOrder[0];
    expect(invalidateAfterCreateOrder).toBeGreaterThan(createOrder);

    const deleteOrder = databaseService.deleteDoctor.mock.invocationCallOrder[0];
    const invalidateAfterDeleteOrder = cacheService.delete.mock.invocationCallOrder[1];
    expect(invalidateAfterDeleteOrder).toBeGreaterThan(deleteOrder);
  });

  it('getDoctorById throws not found when record does not exist', async () => {
    databaseService.findDoctorById.mockResolvedValue(null);

    await expect(service.getDoctorById('missing-id')).rejects.toThrow(
      new NotFoundException(DOCTOR_ERROR_MESSAGES.doctorNotFound),
    );
  });
});
