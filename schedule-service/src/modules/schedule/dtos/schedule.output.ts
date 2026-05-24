import { Field, ObjectType } from '@nestjs/graphql';
import { ScheduleStatusEnum } from '../constants';

@ObjectType()
export class ScheduleOutput {
  @Field()
  id!: string;

  @Field()
  objective!: string;

  @Field()
  customerId!: string;

  @Field()
  doctorId!: string;

  @Field(() => Date)
  scheduledAt!: Date;

  @Field(() => ScheduleStatusEnum)
  status!: ScheduleStatusEnum;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
