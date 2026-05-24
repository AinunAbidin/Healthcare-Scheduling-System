import * as bcrypt from 'bcrypt';

export interface HashOptions {
  saltRounds?: number;
}

const DEFAULT_SALT_ROUNDS = 10;

export async function hashValue(
  value: string,
  options?: HashOptions,
): Promise<string> {
  const saltRounds = options?.saltRounds ?? DEFAULT_SALT_ROUNDS;
  return bcrypt.hash(value, saltRounds);
}

export async function compareHash(
  plainValue: string,
  hashedValue: string,
): Promise<boolean> {
  return bcrypt.compare(plainValue, hashedValue);
}
