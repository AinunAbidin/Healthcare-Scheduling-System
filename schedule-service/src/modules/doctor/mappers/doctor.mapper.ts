import { DatabaseDoctor } from 'src/infra';
import { DoctorListOutput, DoctorOutput } from '../dtos';

export class DoctorMapper {
  static toDoctorOutput(doctor: DatabaseDoctor): DoctorOutput {
    return {
      id: doctor.id,
      name: doctor.name,
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt,
    };
  }

  static toDoctorListOutput(
    items: DatabaseDoctor[],
    total: number,
    skip: number,
    take: number,
  ): DoctorListOutput {
    return {
      items: items.map((item) => this.toDoctorOutput(item)),
      total,
      skip,
      take,
    };
  }
}
