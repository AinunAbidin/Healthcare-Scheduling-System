export interface QueueBackoffOptions {
  type: 'fixed' | 'exponential';
  delayMs: number;
}

export interface QueueEnqueueOptions {
  attempts?: number;
  backoff?: QueueBackoffOptions;
  removeOnComplete?: number;
  removeOnFail?: number;
}

export interface QueueJob<TPayload extends object> {
  id: string;
  name: string;
  data: TPayload;
  attemptsMade: number;
}

export type QueueJobHandler<TPayload extends object> = (
  job: QueueJob<TPayload>,
) => Promise<void>;

export abstract class IQueueService {
  abstract enqueue<TPayload extends object>(
    queueName: string,
    jobName: string,
    payload: TPayload,
    options?: QueueEnqueueOptions,
  ): Promise<void>;

  abstract registerProcessor<TPayload extends object>(
    queueName: string,
    jobName: string,
    handler: QueueJobHandler<TPayload>,
  ): Promise<void>;
}
