import { Field, Int, ObjectType } from '@nestjs/graphql';
import { CustomerOutput } from './customer.output';

@ObjectType()
export class CustomerListOutput {
  @Field(() => [CustomerOutput])
  items!: CustomerOutput[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  skip!: number;

  @Field(() => Int)
  take!: number;
}
