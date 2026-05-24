import { Module } from '@nestjs/common';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'node:path';
import { AppConfig } from './config';
import { InfraModule } from './infra/infra.module';
import { AuthModule } from './modules';

@Module({
  imports: [
    InfraModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: AppConfig.graphqlPlayground,
    }),
    AuthModule,
  ],
})
export class AppModule {}
