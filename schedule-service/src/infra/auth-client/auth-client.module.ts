import { Module } from '@nestjs/common';
import { IAuthClientService } from './auth-client.interface';
import { GraphqlAuthClientInfra } from './graphql-auth-client.infra';

@Module({
  providers: [
    GraphqlAuthClientInfra,
    {
      provide: IAuthClientService,
      useExisting: GraphqlAuthClientInfra,
    },
  ],
  exports: [IAuthClientService],
})
export class AuthClientModule {}
