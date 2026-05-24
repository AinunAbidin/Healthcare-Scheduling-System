import { CustomerResolver } from 'src/modules/customer/resolvers/customer.resolver';

describe('CustomerResolver', () => {
  const customerService = {
    createCustomer: jest.fn(),
    updateCustomer: jest.fn(),
    getCustomers: jest.fn(),
    getCustomerById: jest.fn(),
    deleteCustomer: jest.fn(),
  };

  const resolver = new CustomerResolver(customerService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolvers delegate createCustomer to service', async () => {
    const output = { id: 'customer-1' };
    customerService.createCustomer.mockResolvedValue(output);

    const result = await resolver.createCustomer({
      name: 'Alice',
      email: 'alice@example.com',
    });

    expect(customerService.createCustomer).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'alice@example.com',
    });
    expect(result).toEqual(output);
  });

  it('resolvers delegate updateCustomer to service', async () => {
    const output = { id: 'customer-1', name: 'Alice Updated' };
    customerService.updateCustomer.mockResolvedValue(output);

    const result = await resolver.updateCustomer({
      id: 'customer-1',
      name: 'Alice Updated',
      email: 'alice.updated@example.com',
    });

    expect(customerService.updateCustomer).toHaveBeenCalledWith({
      id: 'customer-1',
      name: 'Alice Updated',
      email: 'alice.updated@example.com',
    });
    expect(result).toEqual(output);
  });

  it('resolvers delegate customers to service', async () => {
    const output = {
      items: [],
      total: 0,
      skip: 5,
      take: 10,
    };
    customerService.getCustomers.mockResolvedValue(output);

    const result = await resolver.customers({
      skip: 5,
      take: 10,
    });

    expect(customerService.getCustomers).toHaveBeenCalledWith({
      skip: 5,
      take: 10,
    });
    expect(result).toEqual(output);
  });

  it('resolvers delegate customer to service', async () => {
    const output = { id: 'customer-1' };
    customerService.getCustomerById.mockResolvedValue(output);

    const result = await resolver.customer({ id: 'customer-1' });

    expect(customerService.getCustomerById).toHaveBeenCalledWith('customer-1');
    expect(result).toEqual(output);
  });

  it('resolvers delegate deleteCustomer to service', async () => {
    const output = { id: 'customer-1' };
    customerService.deleteCustomer.mockResolvedValue(output);

    const result = await resolver.deleteCustomer({ id: 'customer-1' });

    expect(customerService.deleteCustomer).toHaveBeenCalledWith('customer-1');
    expect(result).toEqual(output);
  });
});
