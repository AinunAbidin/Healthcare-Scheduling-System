import { Field, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class CustomerIdInput {
  @Field()
  @IsUUID()
  id!: string;
}
