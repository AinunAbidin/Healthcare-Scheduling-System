import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthGuard } from 'src/common';
import { toScheduleStatus } from '../constants';
import {
  CreateScheduleInput,
  ScheduleIdInput,
  ScheduleListOutput,
  ScheduleOutput,
  ScheduleQueryInput,
  UpdateScheduleStatusInput,
} from '../dtos';
import { ScheduleCreatorService } from '../services/schedule-creator.service';
import { ScheduleReaderService } from '../services/schedule-reader.service';
import { ScheduleRemoverService } from '../services/schedule-remover.service';
import { ScheduleUpdaterService } from '../services/schedule-updater.service';

@Resolver(() => ScheduleOutput)
@UseGuards(AuthGuard)
export class ScheduleResolver {
  constructor(
    private readonly scheduleCreatorService: ScheduleCreatorService,
    private readonly scheduleReaderService: ScheduleReaderService,
    private readonly scheduleRemoverService: ScheduleRemoverService,
    private readonly scheduleUpdaterService: ScheduleUpdaterService,
  ) {}

  @Mutation(() => ScheduleOutput)
  createSchedule(@Args('input') input: CreateScheduleInput): Promise<ScheduleOutput> {
    return this.scheduleCreatorService.createSchedule({
      objective: input.objective,
      customerId: input.customerId,
      doctorId: input.doctorId,
      scheduledAt: input.scheduledAt,
      status: toScheduleStatus(input.status),
    });
  }

  @Query(() => ScheduleListOutput)
  schedules(
    @Args('input', { nullable: true }) input?: ScheduleQueryInput,
  ): Promise<ScheduleListOutput> {
    return this.scheduleReaderService.getSchedules({
      customerId: input?.customerId,
      doctorId: input?.doctorId,
      status: toScheduleStatus(input?.status),
      fromScheduledAt: input?.fromScheduledAt,
      toScheduledAt: input?.toScheduledAt,
      skip: input?.skip,
      take: input?.take,
    });
  }

  @Query(() => ScheduleOutput)
  schedule(@Args('input') input: ScheduleIdInput): Promise<ScheduleOutput> {
    return this.scheduleReaderService.getScheduleById(input.id);
  }

  @Mutation(() => ScheduleOutput)
  deleteSchedule(@Args('input') input: ScheduleIdInput): Promise<ScheduleOutput> {
    return this.scheduleRemoverService.deleteSchedule(input.id);
  }

  @Mutation(() => ScheduleOutput)
  updateScheduleStatus(
    @Args('input') input: UpdateScheduleStatusInput,
  ): Promise<ScheduleOutput> {
    return this.scheduleUpdaterService.updateScheduleStatus({
      id: input.id,
      status: toScheduleStatus(input.status)!,
    });
  }
}
