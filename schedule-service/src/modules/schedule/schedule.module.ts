import { Module } from '@nestjs/common';
import { ScheduleResolver } from './resolvers/schedule.resolver';
import { ScheduleCreatorService } from './services/schedule-creator.service';
import { ScheduleReaderService } from './services/schedule-reader.service';
import { ScheduleRemoverService } from './services/schedule-remover.service';
import { ScheduleUpdaterService } from './services/schedule-updater.service';

@Module({
  providers: [
    ScheduleResolver,
    ScheduleCreatorService,
    ScheduleReaderService,
    ScheduleRemoverService,
    ScheduleUpdaterService,
  ],
})
export class ScheduleModule {}
