import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsUUID } from 'class-validator';
import { ScheduleStatusEnum } from '../constants';

@InputType()
export class UpdateScheduleStatusInput {
  @Field()
  @IsUUID()
  id!: string;

  @Field(() => ScheduleStatusEnum)
  @IsEnum(ScheduleStatusEnum)
  status!: ScheduleStatusEnum;
}
