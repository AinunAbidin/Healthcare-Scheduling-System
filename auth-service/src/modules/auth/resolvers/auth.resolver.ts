import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthTokenOutput, LoginInput, RegisterInput, UserOutput } from '../dtos';
import { AuthService } from '../services/auth.service';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => UserOutput)
  register(@Args('input') input: RegisterInput): Promise<UserOutput> {
    return this.authService.register(input);
  }

  @Mutation(() => AuthTokenOutput)
  login(@Args('input') input: LoginInput): Promise<AuthTokenOutput> {
    return this.authService.login(input);
  }

  @Query(() => UserOutput)
  validateToken(@Args('token') token: string): Promise<UserOutput> {
    return this.authService.validateToken(token);
  }
}
