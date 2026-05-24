import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CustomerOutput {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  email!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
