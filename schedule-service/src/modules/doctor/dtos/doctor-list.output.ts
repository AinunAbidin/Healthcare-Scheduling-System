import { Field, Int, ObjectType } from '@nestjs/graphql';
import { DoctorOutput } from './doctor.output';

@ObjectType()
export class DoctorListOutput {
  @Field(() => [DoctorOutput])
  items!: DoctorOutput[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  skip!: number;

  @Field(() => Int)
  take!: number;
}
