import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CUSTOMER_ERROR_MESSAGES } from 'src/modules/customer/constants';
import { CustomerService } from 'src/modules/customer/services/customer.service';
import {
  createMockCacheService,
  createMockLoggerService,
  createMockScheduleDatabaseService,
} from '../setup/test-utils';

describe('CustomerService', () => {
  const databaseService = createMockScheduleDatabaseService();
  const loggerService = createMockLoggerService();
  const cacheService = createMockCacheService();
  const service = new CustomerService(databaseService, loggerService, cacheService);

  const customer = {
    id: 'customer-1',
    name: 'Alice',
    email: 'alice@example.com',
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

  it('createCustomer creates customer', async () => {
    databaseService.findCustomerByEmail.mockResolvedValue(null);
    databaseService.createCustomer.mockResolvedValue(customer);

    const result = await service.createCustomer({
      name: '  Alice  ',
      email: 'ALICE@EXAMPLE.COM',
    });

    expect(databaseService.createCustomer).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'alice@example.com',
    });
    expect(result.id).toBe(customer.id);
  });

  it('createCustomer handles duplicate email if implemented', async () => {
    databaseService.findCustomerByEmail.mockResolvedValue(customer);

    await expect(
      service.createCustomer({
        name: 'Alice',
        email: customer.email,
      }),
    ).rejects.toThrow(new ConflictException(CUSTOMER_ERROR_MESSAGES.customerEmailAlreadyExists));

    expect(databaseService.createCustomer).not.toHaveBeenCalled();
    expect(cacheService.deleteByPattern).not.toHaveBeenCalled();
  });

  it('updateCustomer updates customer', async () => {
    const updatedCustomer = {
      ...customer,
      name: 'Alice Updated',
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };

    databaseService.findCustomerById.mockResolvedValue(customer);
    databaseService.updateCustomer.mockResolvedValue(updatedCustomer);

    const result = await service.updateCustomer({
      id: customer.id,
      name: 'Alice Updated',
    });

    expect(databaseService.updateCustomer).toHaveBeenCalledWith(customer.id, {
      name: 'Alice Updated',
      email: undefined,
    });
    expect(result.name).toBe('Alice Updated');
    expect(cacheService.deleteByPattern).toHaveBeenCalledWith('customer:list:*');
    expect(cacheService.delete).toHaveBeenCalledWith(`customer:id:${customer.id}`);
  });

  it('customers returns paginated result', async () => {
    databaseService.findCustomers.mockResolvedValue([customer]);
    databaseService.countCustomers.mockResolvedValue(1);

    const result = await service.getCustomers({
      skip: 2,
      take: 5,
    });

    expect(databaseService.findCustomers).toHaveBeenCalledWith({ skip: 2, take: 5 });
    expect(databaseService.countCustomers).toHaveBeenCalled();
    expect(cacheService.set).toHaveBeenCalledWith(
      'customer:list:skip=2:take=5',
      expect.objectContaining({
        total: 1,
        skip: 2,
        take: 5,
      }),
    );
    expect(result.items).toHaveLength(1);
  });

  it('customer returns record by ID', async () => {
    databaseService.findCustomerById.mockResolvedValue(customer);

    const result = await service.getCustomerById(customer.id);

    expect(databaseService.findCustomerById).toHaveBeenCalledWith(customer.id);
    expect(cacheService.set).toHaveBeenCalledWith(
      `customer:id:${customer.id}`,
      expect.objectContaining({ id: customer.id }),
    );
    expect(result.id).toBe(customer.id);
  });

  it('deleteCustomer deletes customer', async () => {
    databaseService.deleteCustomer.mockResolvedValue(customer);

    const result = await service.deleteCustomer(customer.id);

    expect(databaseService.deleteCustomer).toHaveBeenCalledWith(customer.id);
    expect(cacheService.deleteByPattern).toHaveBeenCalledWith('customer:list:*');
    expect(cacheService.delete).toHaveBeenCalledWith(`customer:id:${customer.id}`);
    expect(result.id).toBe(customer.id);
  });

  it('cache hit returns customers without querying database', async () => {
    cacheService.get.mockResolvedValue({
      items: [
        {
          ...customer,
          createdAt: customer.createdAt.toISOString(),
          updatedAt: customer.updatedAt.toISOString(),
        },
      ],
      total: 1,
      skip: 0,
      take: 10,
    });

    const result = await service.getCustomers({});

    expect(databaseService.findCustomers).not.toHaveBeenCalled();
    expect(databaseService.countCustomers).not.toHaveBeenCalled();
    expect(result.items[0].createdAt).toBeInstanceOf(Date);
    expect(result.items[0].updatedAt).toBeInstanceOf(Date);
  });

  it('cache miss reads from database then stores cache', async () => {
    cacheService.get.mockResolvedValue(null);
    databaseService.findCustomers.mockResolvedValue([customer]);
    databaseService.countCustomers.mockResolvedValue(1);

    await service.getCustomers({ skip: 0, take: 10 });

    expect(databaseService.findCustomers).toHaveBeenCalled();
    expect(cacheService.set).toHaveBeenCalledWith(
      'customer:list:skip=0:take=10',
      expect.any(Object),
    );
  });

  it('cache invalidation happens after successful write/delete', async () => {
    databaseService.findCustomerByEmail.mockResolvedValue(null);
    databaseService.createCustomer.mockResolvedValue(customer);
    databaseService.deleteCustomer.mockResolvedValue(customer);

    await service.createCustomer({
      name: customer.name,
      email: customer.email,
    });
    await service.deleteCustomer(customer.id);

    const createOrder = databaseService.createCustomer.mock.invocationCallOrder[0];
    const invalidateAfterCreateOrder =
      cacheService.deleteByPattern.mock.invocationCallOrder[0];
    expect(invalidateAfterCreateOrder).toBeGreaterThan(createOrder);

    const deleteOrder = databaseService.deleteCustomer.mock.invocationCallOrder[0];
    const invalidateAfterDeleteOrder = cacheService.delete.mock.invocationCallOrder[1];
    expect(invalidateAfterDeleteOrder).toBeGreaterThan(deleteOrder);
  });

  it('getCustomerById throws not found when record does not exist', async () => {
    databaseService.findCustomerById.mockResolvedValue(null);

    await expect(service.getCustomerById('missing-id')).rejects.toThrow(
      new NotFoundException(CUSTOMER_ERROR_MESSAGES.customerNotFound),
    );
  });
});
