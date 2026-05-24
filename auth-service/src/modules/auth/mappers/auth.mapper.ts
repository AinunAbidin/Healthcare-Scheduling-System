import { DatabaseUser } from 'src/infra';
import { AuthTokenOutput, UserOutput } from '../dtos';

export class AuthMapper {
  static toUserOutput(user: DatabaseUser): UserOutput {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static toAuthTokenOutput(
    accessToken: string,
    tokenType: string,
    expiresIn: string,
    user: DatabaseUser,
  ): AuthTokenOutput {
    return {
      accessToken,
      tokenType,
      expiresIn,
      user: this.toUserOutput(user),
    };
  }
}
