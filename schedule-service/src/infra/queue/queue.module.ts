import { Module } from '@nestjs/common';
import { BullMqInfra } from './bullmq.infra';
import { IQueueService } from './queue.interface';

@Module({
  providers: [
    BullMqInfra,
    {
      provide: IQueueService,
      useExisting: BullMqInfra,
    },
  ],
  exports: [IQueueService],
})
export class QueueModule {}
