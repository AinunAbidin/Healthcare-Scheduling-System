export interface CreateUserData {
  email: string;
  password: string;
}

export interface DatabaseUser {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export abstract class IDatabaseService {
  abstract createUser(data: CreateUserData): Promise<DatabaseUser>;
  abstract findUserByEmail(email: string): Promise<DatabaseUser | null>;
  abstract findUserById(id: string): Promise<DatabaseUser | null>;
}
