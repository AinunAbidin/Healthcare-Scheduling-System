import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ICacheService, IDatabaseService, ILoggerService } from 'src/infra';
import {
  DOCTOR_CACHE_KEY_PATTERNS,
  DOCTOR_DEFAULT_PAGINATION_TAKE,
  DOCTOR_ERROR_MESSAGES,
  DOCTOR_MAX_PAGINATION_TAKE,
  toDoctorByIdCacheKey,
  toDoctorListCacheKey,
} from '../constants';
import { DoctorListOutput, DoctorOutput } from '../dtos';
import { DoctorMapper } from '../mappers/doctor.mapper';
import {
  CreateDoctorCommand,
  DoctorPagination,
  DoctorPaginationQuery,
  UpdateDoctorCommand,
} from '../types';

@Injectable()
export class DoctorService {
  constructor(
    private readonly databaseService: IDatabaseService,
    private readonly loggerService: ILoggerService,
    private readonly cacheService: ICacheService,
  ) {}

  async createDoctor(command: CreateDoctorCommand): Promise<DoctorOutput> {
    const doctor = await this.databaseService.createDoctor({
      name: command.name.trim(),
    });

    this.loggerService.log(`Doctor created: doctorId=${doctor.id}`);
    await this.invalidateDoctorCache(doctor.id);
    return DoctorMapper.toDoctorOutput(doctor);
  }

  async updateDoctor(command: UpdateDoctorCommand): Promise<DoctorOutput> {
    const hasNameUpdate = typeof command.name === 'string';

    if (!hasNameUpdate) {
      throw new BadRequestException(DOCTOR_ERROR_MESSAGES.updatePayloadIsEmpty);
    }

    const existingDoctor = await this.databaseService.findDoctorById(command.id);
    if (!existingDoctor) {
      throw new NotFoundException(DOCTOR_ERROR_MESSAGES.doctorNotFound);
    }

    const updatedDoctor = await this.databaseService.updateDoctor(command.id, {
      name: command.name?.trim(),
    });

    if (!updatedDoctor) {
      throw new NotFoundException(DOCTOR_ERROR_MESSAGES.doctorNotFound);
    }

    this.loggerService.log(`Doctor updated: doctorId=${updatedDoctor.id}`);
    await this.invalidateDoctorCache(updatedDoctor.id);
    return DoctorMapper.toDoctorOutput(updatedDoctor);
  }

  async getDoctors(query: DoctorPaginationQuery): Promise<DoctorListOutput> {
    const pagination = this.resolvePagination(query);
    const cacheKey = toDoctorListCacheKey(pagination);
    const cached = await this.safeCacheGet<DoctorListOutput>(cacheKey);
    if (cached) {
      return this.hydrateDoctorListOutput(cached);
    }

    const [items, total] = await Promise.all([
      this.databaseService.findDoctors({
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.databaseService.countDoctors(),
    ]);

    const result = DoctorMapper.toDoctorListOutput(
      items,
      total,
      pagination.skip,
      pagination.take,
    );
    await this.safeCacheSet(cacheKey, result);
    return result;
  }

  async getDoctorById(id: string): Promise<DoctorOutput> {
    const cacheKey = toDoctorByIdCacheKey(id);
    const cached = await this.safeCacheGet<DoctorOutput>(cacheKey);
    if (cached) {
      return this.hydrateDoctorOutput(cached);
    }

    const doctor = await this.databaseService.findDoctorById(id);

    if (!doctor) {
      throw new NotFoundException(DOCTOR_ERROR_MESSAGES.doctorNotFound);
    }

    const result = DoctorMapper.toDoctorOutput(doctor);
    await this.safeCacheSet(cacheKey, result);
    return result;
  }

  async deleteDoctor(id: string): Promise<DoctorOutput> {
    const deleted = await this.databaseService.deleteDoctor(id);

    if (!deleted) {
      throw new NotFoundException(DOCTOR_ERROR_MESSAGES.doctorNotFound);
    }

    this.loggerService.log(`Doctor deleted: doctorId=${deleted.id}`);
    await this.invalidateDoctorCache(deleted.id);
    return DoctorMapper.toDoctorOutput(deleted);
  }

  private resolvePagination(query: DoctorPaginationQuery): DoctorPagination {
    const skip = query.skip ?? 0;
    const requestedTake = query.take ?? DOCTOR_DEFAULT_PAGINATION_TAKE;
    const take = Math.min(requestedTake, DOCTOR_MAX_PAGINATION_TAKE);

    return {
      skip,
      take,
    };
  }

  private async invalidateDoctorCache(doctorId: string): Promise<void> {
    await this.safeCacheDeleteByPattern(DOCTOR_CACHE_KEY_PATTERNS.list);
    await this.safeCacheDelete(toDoctorByIdCacheKey(doctorId));
  }

  private async safeCacheGet<T>(key: string): Promise<T | null> {
    try {
      return await this.cacheService.get<T>(key);
    } catch (error) {
      this.loggerService.warn(this.toCacheWarning('get', key, error));
      return null;
    }
  }

  private async safeCacheSet<T>(key: string, value: T): Promise<void> {
    try {
      await this.cacheService.set<T>(key, value);
    } catch (error) {
      this.loggerService.warn(this.toCacheWarning('set', key, error));
    }
  }

  private async safeCacheDelete(key: string): Promise<void> {
    try {
      await this.cacheService.delete(key);
    } catch (error) {
      this.loggerService.warn(this.toCacheWarning('delete', key, error));
    }
  }

  private async safeCacheDeleteByPattern(pattern: string): Promise<void> {
    try {
      await this.cacheService.deleteByPattern(pattern);
    } catch (error) {
      this.loggerService.warn(this.toCacheWarning('deleteByPattern', pattern, error));
    }
  }

  private hydrateDoctorOutput(doctor: DoctorOutput): DoctorOutput {
    return {
      ...doctor,
      createdAt: new Date(doctor.createdAt),
      updatedAt: new Date(doctor.updatedAt),
    };
  }

  private hydrateDoctorListOutput(list: DoctorListOutput): DoctorListOutput {
    return {
      ...list,
      items: list.items.map((item) => this.hydrateDoctorOutput(item)),
    };
  }

  private toCacheWarning(operation: string, target: string, error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return `[DoctorCache] ${operation} failed for ${target}: ${message}`;
  }
}
