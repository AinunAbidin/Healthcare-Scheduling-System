import { Module } from '@nestjs/common';
import { DoctorResolver } from './resolvers/doctor.resolver';
import { DoctorService } from './services/doctor.service';

@Module({
  providers: [DoctorResolver, DoctorService],
})
export class DoctorModule {}
