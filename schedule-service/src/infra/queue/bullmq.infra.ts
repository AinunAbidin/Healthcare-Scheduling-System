import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  ConnectionOptions,
  JobsOptions,
  Job as BullMqJob,
  Queue,
  Worker,
} from 'bullmq';
import { QueueConfig } from 'src/config';
import {
  IQueueService,
  QueueEnqueueOptions,
  QueueJob,
  QueueJobHandler,
} from './queue.interface';

interface QueueEntry {
  queue: Queue<object, unknown, string>;
  worker: Worker<object, unknown, string>;
  handlers: Map<string, QueueJobHandler<object>>;
}

@Injectable()
export class BullMqInfra implements IQueueService, OnModuleDestroy {
  private readonly connection: ConnectionOptions;
  private readonly entries = new Map<string, QueueEntry>();

  constructor() {
    this.connection = this.createConnectionOptions();
  }

  async enqueue<TPayload extends object>(
    queueName: string,
    jobName: string,
    payload: TPayload,
    options?: QueueEnqueueOptions,
  ): Promise<void> {
    const entry = this.getOrCreateEntry(queueName);
    await entry.queue.add(
      jobName,
      payload,
      this.toJobsOptions(options),
    );
  }

  async registerProcessor<TPayload extends object>(
    queueName: string,
    jobName: string,
    handler: QueueJobHandler<TPayload>,
  ): Promise<void> {
    const entry = this.getOrCreateEntry(queueName);
    entry.handlers.set(
      jobName,
      handler as QueueJobHandler<object>,
    );
  }

  async onModuleDestroy(): Promise<void> {
    for (const entry of this.entries.values()) {
      await entry.worker.close();
      await entry.queue.close();
    }

    this.entries.clear();
  }

  private getOrCreateEntry(queueName: string): QueueEntry {
    const existingEntry = this.entries.get(queueName);
    if (existingEntry) {
      return existingEntry;
    }

    const handlers = new Map<string, QueueJobHandler<object>>();

    const queue = new Queue<object, unknown, string>(queueName, {
      connection: this.connection,
    });

    const worker = new Worker<object, unknown, string>(
      queueName,
      async (job: BullMqJob<object, unknown, string>) => {
        const handler = handlers.get(job.name);

        if (!handler) {
          throw new Error(`No queue processor registered for jobName=${job.name}`);
        }

        await handler(this.toQueueJob(job));
      },
      {
        connection: this.connection,
      },
    );

    const entry: QueueEntry = {
      queue,
      worker,
      handlers,
    };

    this.entries.set(queueName, entry);
    return entry;
  }

  private toJobsOptions(options?: QueueEnqueueOptions): JobsOptions {
    if (!options) {
      return {};
    }

    return {
      attempts: options.attempts,
      backoff: options.backoff
        ? {
            type: options.backoff.type,
            delay: options.backoff.delayMs,
          }
        : undefined,
      removeOnComplete: options.removeOnComplete,
      removeOnFail: options.removeOnFail,
    };
  }

  private toQueueJob(
    job: BullMqJob<object, unknown, string>,
  ): QueueJob<object> {
    return {
      id: job.id ?? '',
      name: job.name,
      data: job.data,
      attemptsMade: job.attemptsMade,
    };
  }

  private createConnectionOptions(): ConnectionOptions {
    return {
      host: QueueConfig.redisHost,
      port: QueueConfig.redisPort,
      password: QueueConfig.redisPassword,
      maxRetriesPerRequest: null,
    };
  }
}
