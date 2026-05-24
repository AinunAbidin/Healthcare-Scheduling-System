import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ScheduleStatusEnum } from '../constants';

@InputType()
export class CreateScheduleInput {
  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  objective!: string;

  @Field()
  @IsUUID()
  customerId!: string;

  @Field()
  @IsUUID()
  doctorId!: string;

  @Field(() => Date)
  @Type(() => Date)
  @IsDate()
  scheduledAt!: Date;

  @Field(() => ScheduleStatusEnum, { nullable: true })
  @IsOptional()
  @IsEnum(ScheduleStatusEnum)
  status?: ScheduleStatusEnum;
}
