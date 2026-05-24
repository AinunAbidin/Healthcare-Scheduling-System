export interface AuthenticatedUser {
  id: string;
  email: string;
}

export abstract class IAuthClientService {
  abstract validateToken(token: string): Promise<AuthenticatedUser | null>;
}
