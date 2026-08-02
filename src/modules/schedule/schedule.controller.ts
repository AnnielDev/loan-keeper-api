import { Controller, Get, Query } from '@nestjs/common';
import { ScheduleEventsQueryDto } from './dto/schedule-events-query.dto';
import { ScheduleUpcomingQueryDto } from './dto/schedule-upcoming-query.dto';
import { ScheduleService } from './schedule.service';

@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get('events')
  getEvents(@Query() query: ScheduleEventsQueryDto) {
    return this.scheduleService.getEventsForMonth(
      Number(query.month),
      Number(query.year),
    );
  }

  @Get('upcoming')
  getUpcoming(@Query() query: ScheduleUpcomingQueryDto) {
    return this.scheduleService.getUpcoming(
      query.limit !== undefined ? Number(query.limit) : undefined,
    );
  }
}
