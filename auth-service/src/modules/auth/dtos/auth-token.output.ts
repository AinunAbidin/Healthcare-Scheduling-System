import { Field, ObjectType } from '@nestjs/graphql';
import { UserOutput } from './user.output';

@ObjectType()
export class AuthTokenOutput {
  @Field()
  accessToken!: string;

  @Field()
  tokenType!: string;

  @Field()
  expiresIn!: string;

  @Field(() => UserOutput)
  user!: UserOutput;
}
