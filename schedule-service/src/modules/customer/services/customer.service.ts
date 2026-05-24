import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ICacheService, IDatabaseService, ILoggerService } from 'src/infra';
import {
  CUSTOMER_CACHE_KEY_PATTERNS,
  CUSTOMER_DEFAULT_PAGINATION_TAKE,
  CUSTOMER_ERROR_MESSAGES,
  CUSTOMER_MAX_PAGINATION_TAKE,
  toCustomerByIdCacheKey,
  toCustomerListCacheKey,
} from '../constants';
import { CustomerListOutput, CustomerOutput } from '../dtos';
import { CustomerMapper } from '../mappers/customer.mapper';
import {
  CreateCustomerCommand,
  CustomerPagination,
  CustomerPaginationQuery,
  UpdateCustomerCommand,
} from '../types';

@Injectable()
export class CustomerService {
  constructor(
    private readonly databaseService: IDatabaseService,
    private readonly loggerService: ILoggerService,
    private readonly cacheService: ICacheService,
  ) {}

  async createCustomer(command: CreateCustomerCommand): Promise<CustomerOutput> {
    const email = this.normalizeEmail(command.email);
    const existingByEmail = await this.databaseService.findCustomerByEmail(email);

    if (existingByEmail) {
      throw new ConflictException(CUSTOMER_ERROR_MESSAGES.customerEmailAlreadyExists);
    }

    const customer = await this.databaseService.createCustomer({
      name: command.name.trim(),
      email,
    });

    this.loggerService.log(`Customer created: customerId=${customer.id}`);
    await this.invalidateCustomerCache(customer.id);
    return CustomerMapper.toCustomerOutput(customer);
  }

  async updateCustomer(command: UpdateCustomerCommand): Promise<CustomerOutput> {
    const hasNameUpdate = typeof command.name === 'string';
    const hasEmailUpdate = typeof command.email === 'string';

    if (!hasNameUpdate && !hasEmailUpdate) {
      throw new BadRequestException(CUSTOMER_ERROR_MESSAGES.updatePayloadIsEmpty);
    }

    const existingCustomer = await this.databaseService.findCustomerById(command.id);
    if (!existingCustomer) {
      throw new NotFoundException(CUSTOMER_ERROR_MESSAGES.customerNotFound);
    }

    const nextEmail =
      hasEmailUpdate && command.email
        ? this.normalizeEmail(command.email)
        : undefined;

    if (nextEmail && nextEmail !== existingCustomer.email) {
      const existingByEmail = await this.databaseService.findCustomerByEmail(nextEmail);
      if (existingByEmail && existingByEmail.id !== command.id) {
        throw new ConflictException(CUSTOMER_ERROR_MESSAGES.customerEmailAlreadyExists);
      }
    }

    const updatedCustomer = await this.databaseService.updateCustomer(command.id, {
      name: hasNameUpdate ? command.name?.trim() : undefined,
      email: nextEmail,
    });

    if (!updatedCustomer) {
      throw new NotFoundException(CUSTOMER_ERROR_MESSAGES.customerNotFound);
    }

    this.loggerService.log(`Customer updated: customerId=${updatedCustomer.id}`);
    await this.invalidateCustomerCache(updatedCustomer.id);
    return CustomerMapper.toCustomerOutput(updatedCustomer);
  }

  async getCustomers(query: CustomerPaginationQuery): Promise<CustomerListOutput> {
    const pagination = this.resolvePagination(query);
    const cacheKey = toCustomerListCacheKey(pagination);
    const cached = await this.safeCacheGet<CustomerListOutput>(cacheKey);

    if (cached) {
      return this.hydrateCustomerListOutput(cached);
    }

    const [items, total] = await Promise.all([
      this.databaseService.findCustomers({
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.databaseService.countCustomers(),
    ]);

    const result = CustomerMapper.toCustomerListOutput(
      items,
      total,
      pagination.skip,
      pagination.take,
    );
    await this.safeCacheSet(cacheKey, result);
    return result;
  }

  async getCustomerById(id: string): Promise<CustomerOutput> {
    const cacheKey = toCustomerByIdCacheKey(id);
    const cached = await this.safeCacheGet<CustomerOutput>(cacheKey);
    if (cached) {
      return this.hydrateCustomerOutput(cached);
    }

    const customer = await this.databaseService.findCustomerById(id);

    if (!customer) {
      throw new NotFoundException(CUSTOMER_ERROR_MESSAGES.customerNotFound);
    }

    const result = CustomerMapper.toCustomerOutput(customer);
    await this.safeCacheSet(cacheKey, result);
    return result;
  }

  async deleteCustomer(id: string): Promise<CustomerOutput> {
    const deleted = await this.databaseService.deleteCustomer(id);

    if (!deleted) {
      throw new NotFoundException(CUSTOMER_ERROR_MESSAGES.customerNotFound);
    }

    this.loggerService.log(`Customer deleted: customerId=${deleted.id}`);
    await this.invalidateCustomerCache(deleted.id);
    return CustomerMapper.toCustomerOutput(deleted);
  }

  private resolvePagination(query: CustomerPaginationQuery): CustomerPagination {
    const skip = query.skip ?? 0;
    const requestedTake = query.take ?? CUSTOMER_DEFAULT_PAGINATION_TAKE;
    const take = Math.min(requestedTake, CUSTOMER_MAX_PAGINATION_TAKE);

    return {
      skip,
      take,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async invalidateCustomerCache(customerId: string): Promise<void> {
    await this.safeCacheDeleteByPattern(CUSTOMER_CACHE_KEY_PATTERNS.list);
    await this.safeCacheDelete(toCustomerByIdCacheKey(customerId));
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

  private hydrateCustomerOutput(customer: CustomerOutput): CustomerOutput {
    return {
      ...customer,
      createdAt: new Date(customer.createdAt),
      updatedAt: new Date(customer.updatedAt),
    };
  }

  private hydrateCustomerListOutput(list: CustomerListOutput): CustomerListOutput {
    return {
      ...list,
      items: list.items.map((item) => this.hydrateCustomerOutput(item)),
    };
  }

  private toCacheWarning(operation: string, target: string, error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return `[CustomerCache] ${operation} failed for ${target}: ${message}`;
  }
}
