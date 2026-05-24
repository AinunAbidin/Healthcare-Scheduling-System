import { DoctorResolver } from 'src/modules/doctor/resolvers/doctor.resolver';

describe('DoctorResolver', () => {
  const doctorService = {
    createDoctor: jest.fn(),
    updateDoctor: jest.fn(),
    getDoctors: jest.fn(),
    getDoctorById: jest.fn(),
    deleteDoctor: jest.fn(),
  };

  const resolver = new DoctorResolver(doctorService as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolvers delegate createDoctor to service', async () => {
    const output = { id: 'doctor-1' };
    doctorService.createDoctor.mockResolvedValue(output);

    const result = await resolver.createDoctor({ name: 'Dr. Smith' });

    expect(doctorService.createDoctor).toHaveBeenCalledWith({ name: 'Dr. Smith' });
    expect(result).toEqual(output);
  });

  it('resolvers delegate updateDoctor to service', async () => {
    const output = { id: 'doctor-1', name: 'Dr. Updated' };
    doctorService.updateDoctor.mockResolvedValue(output);

    const result = await resolver.updateDoctor({
      id: 'doctor-1',
      name: 'Dr. Updated',
    });

    expect(doctorService.updateDoctor).toHaveBeenCalledWith({
      id: 'doctor-1',
      name: 'Dr. Updated',
    });
    expect(result).toEqual(output);
  });

  it('resolvers delegate doctors to service', async () => {
    const output = {
      items: [],
      total: 0,
      skip: 1,
      take: 5,
    };
    doctorService.getDoctors.mockResolvedValue(output);

    const result = await resolver.doctors({
      skip: 1,
      take: 5,
    });

    expect(doctorService.getDoctors).toHaveBeenCalledWith({
      skip: 1,
      take: 5,
    });
    expect(result).toEqual(output);
  });

  it('resolvers delegate doctor to service', async () => {
    const output = { id: 'doctor-1' };
    doctorService.getDoctorById.mockResolvedValue(output);

    const result = await resolver.doctor({ id: 'doctor-1' });

    expect(doctorService.getDoctorById).toHaveBeenCalledWith('doctor-1');
    expect(result).toEqual(output);
  });

  it('resolvers delegate deleteDoctor to service', async () => {
    const output = { id: 'doctor-1' };
    doctorService.deleteDoctor.mockResolvedValue(output);

    const result = await resolver.deleteDoctor({ id: 'doctor-1' });

    expect(doctorService.deleteDoctor).toHaveBeenCalledWith('doctor-1');
    expect(result).toEqual(output);
  });
});
