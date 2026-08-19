import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ScheduleEventsQueryDto } from './dto/schedule-events-query.dto';
import { ScheduleUpcomingQueryDto } from './dto/schedule-upcoming-query.dto';
import { ScheduleService } from './schedule.service';

@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get('events')
  getEvents(
    @Query() query: ScheduleEventsQueryDto,
    @CurrentUser() user: { timezone?: string },
  ) {
    return this.scheduleService.getEventsForMonth(
      Number(query.month),
      Number(query.year),
      user.timezone,
      query.includePaid === 'true',
    );
  }

  @Get('upcoming')
  getUpcoming(
    @Query() query: ScheduleUpcomingQueryDto,
    @CurrentUser() user: { timezone?: string },
  ) {
    return this.scheduleService.getUpcoming(
      query.limit !== undefined ? Number(query.limit) : undefined,
      user.timezone,
    );
  }
}
