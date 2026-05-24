import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthGuard } from 'src/common';
import {
  CreateDoctorInput,
  DoctorIdInput,
  DoctorListOutput,
  DoctorOutput,
  DoctorPaginationInput,
  UpdateDoctorInput,
} from '../dtos';
import { DoctorService } from '../services/doctor.service';

@Resolver(() => DoctorOutput)
@UseGuards(AuthGuard)
export class DoctorResolver {
  constructor(private readonly doctorService: DoctorService) {}

  @Mutation(() => DoctorOutput)
  createDoctor(@Args('input') input: CreateDoctorInput): Promise<DoctorOutput> {
    return this.doctorService.createDoctor({
      name: input.name,
    });
  }

  @Mutation(() => DoctorOutput)
  updateDoctor(@Args('input') input: UpdateDoctorInput): Promise<DoctorOutput> {
    return this.doctorService.updateDoctor({
      id: input.id,
      name: input.name,
    });
  }

  @Query(() => DoctorListOutput)
  doctors(
    @Args('input', { nullable: true }) input?: DoctorPaginationInput,
  ): Promise<DoctorListOutput> {
    return this.doctorService.getDoctors({
      skip: input?.skip,
      take: input?.take,
    });
  }

  @Query(() => DoctorOutput)
  doctor(@Args('input') input: DoctorIdInput): Promise<DoctorOutput> {
    return this.doctorService.getDoctorById(input.id);
  }

  @Mutation(() => DoctorOutput)
  deleteDoctor(@Args('input') input: DoctorIdInput): Promise<DoctorOutput> {
    return this.doctorService.deleteDoctor(input.id);
  }
}
