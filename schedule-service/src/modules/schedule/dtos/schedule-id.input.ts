import { Field, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class ScheduleIdInput {
  @Field()
  @IsUUID()
  id!: string;
}
