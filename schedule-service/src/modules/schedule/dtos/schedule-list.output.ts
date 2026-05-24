import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ScheduleOutput } from './schedule.output';

@ObjectType()
export class ScheduleListOutput {
  @Field(() => [ScheduleOutput])
  items!: ScheduleOutput[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  skip!: number;

  @Field(() => Int)
  take!: number;
}
