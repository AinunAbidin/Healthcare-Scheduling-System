import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DatabaseConfig } from 'src/config';
import { CreateUserData, DatabaseUser, IDatabaseService } from './database.interface';

interface UserRow {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PrismaUserDelegate {
  create(args: { data: CreateUserData }): Promise<UserRow>;
  findUnique(args: {
    where: { id?: string; email?: string };
  }): Promise<UserRow | null>;
}

interface PrismaClientLike {
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
  user: PrismaUserDelegate;
}

@Injectable()
export class PostgresInfra implements IDatabaseService, OnModuleInit, OnModuleDestroy {
  private readonly prismaClient: PrismaClientLike;

  constructor() {
    this.prismaClient = this.createPrismaClient();
  }

  async onModuleInit(): Promise<void> {
    await this.prismaClient.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.prismaClient.$disconnect();
  }

  async createUser(data: CreateUserData): Promise<DatabaseUser> {
    const row = await this.prismaClient.user.create({ data });
    return this.toDatabaseUser(row);
  }

  async findUserByEmail(email: string): Promise<DatabaseUser | null> {
    const row = await this.prismaClient.user.findUnique({
      where: { email },
    });

    return row ? this.toDatabaseUser(row) : null;
  }

  async findUserById(id: string): Promise<DatabaseUser | null> {
    const row = await this.prismaClient.user.findUnique({
      where: { id },
    });

    return row ? this.toDatabaseUser(row) : null;
  }

  private createPrismaClient(): PrismaClientLike {
    const prismaModule = require('@prisma/client') as Record<string, unknown>;
    const prismaClientCandidate = prismaModule.PrismaClient;

    if (typeof prismaClientCandidate !== 'function') {
      throw new Error('PrismaClient is unavailable. Run `prisma generate` first.');
    }

    const PrismaClientConstructor = prismaClientCandidate as new (options: {
      datasources: { db: { url: string } };
    }) => PrismaClientLike;

    return new PrismaClientConstructor({
      datasources: {
        db: {
          url: DatabaseConfig.url,
        },
      },
    });
  }

  private toDatabaseUser(row: UserRow): DatabaseUser {
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
