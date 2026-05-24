import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { compareHash, hashValue } from 'src/common';
import { JwtConfig } from 'src/config';
import { DatabaseUser, IDatabaseService, ILoggerService } from 'src/infra';
import { SignOptions, sign, verify } from 'jsonwebtoken';
import { AUTH_ERROR_MESSAGES, AUTH_TOKEN_TYPE } from '../constants';
import { AuthTokenOutput, LoginInput, RegisterInput, UserOutput } from '../dtos';
import { AuthMapper } from '../mappers/auth.mapper';
import { AuthTokenPayload } from '../types';

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: IDatabaseService,
    private readonly loggerService: ILoggerService,
  ) {}

  async register(input: RegisterInput): Promise<UserOutput> {
    const email = this.normalizeEmail(input.email);
    const existingUser = await this.databaseService.findUserByEmail(email);

    if (existingUser) {
      this.loggerService.warn(`Registration rejected for existing email: ${email}`);
      throw new ConflictException(AUTH_ERROR_MESSAGES.emailAlreadyRegistered);
    }

    const hashedPassword = await hashValue(input.password);
    const user = await this.databaseService.createUser({
      email,
      password: hashedPassword,
    });

    this.loggerService.log(`User registered: userId=${user.id}`);
    return AuthMapper.toUserOutput(user);
  }

  async login(input: LoginInput): Promise<AuthTokenOutput> {
    const email = this.normalizeEmail(input.email);
    const user = await this.databaseService.findUserByEmail(email);

    if (!user) {
      this.loggerService.warn(`Login rejected for unknown email: ${email}`);
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.invalidCredentials);
    }

    const isPasswordValid = await compareHash(input.password, user.password);

    if (!isPasswordValid) {
      this.loggerService.warn(`Login rejected for invalid password: userId=${user.id}`);
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.invalidCredentials);
    }

    const accessToken = this.generateAccessToken(user);

    this.loggerService.log(`Login successful: userId=${user.id}`);
    return AuthMapper.toAuthTokenOutput(
      accessToken,
      AUTH_TOKEN_TYPE,
      JwtConfig.expiresIn,
      user,
    );
  }

  async validateToken(token: string): Promise<UserOutput> {
    const payload = this.verifyAccessToken(token);
    const user = await this.databaseService.findUserById(payload.sub);

    if (!user) {
      this.loggerService.warn(`Token rejected for missing user: userId=${payload.sub}`);
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.invalidToken);
    }

    return AuthMapper.toUserOutput(user);
  }

  private generateAccessToken(user: DatabaseUser): string {
    const payload: AuthTokenPayload = {
      sub: user.id,
      email: user.email,
    };

    const options: SignOptions = {
      expiresIn: JwtConfig.expiresIn as SignOptions['expiresIn'],
    };

    return sign(payload, JwtConfig.secret, options);
  }

  private verifyAccessToken(token: string): AuthTokenPayload {
    try {
      const payload = verify(token, JwtConfig.secret);

      if (!this.isAuthTokenPayload(payload)) {
        throw new UnauthorizedException(AUTH_ERROR_MESSAGES.invalidToken);
      }

      return payload;
    } catch {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.invalidToken);
    }
  }

  private isAuthTokenPayload(payload: string | object): payload is AuthTokenPayload {
    if (typeof payload === 'string' || payload === null) {
      return false;
    }

    const candidate = payload as Partial<AuthTokenPayload>;
    return typeof candidate.sub === 'string' && typeof candidate.email === 'string';
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
