import {
  BadRequestException,
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DashboardService, TimelineRange } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }

  // GET /dashboard/bookings-timeline?range=30d | 12m
  @Get('bookings-timeline')
  getBookingsTimeline(@Query('range') range: string = '30d') {
    if (range !== '30d' && range !== '12m') {
      throw new BadRequestException('range must be 30d or 12m');
    }
    return this.dashboardService.getBookingsTimeline(range as TimelineRange);
  }

  // GET /dashboard/top-trips?limit=5
  @Get('top-trips')
  getTopTrips(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.dashboardService.getTopTrips(limit ?? 5);
  }

  // GET /dashboard/cancellation-rate?minBookings=3
  @Get('cancellation-rate')
  getCancellationRate(
    @Query('minBookings', new ParseIntPipe({ optional: true }))
    minBookings?: number,
  ) {
    return this.dashboardService.getCancellationRatePerTrip(minBookings ?? 3);
  }

  // GET /dashboard/bookings-by-destination
  @Get('bookings-by-destination')
  getBookingsByDestination() {
    return this.dashboardService.getBookingsByDestination();
  }

  // GET /dashboard/travelers
  @Get('travelers')
  getTravelers() {
    return this.dashboardService.getTravelersStats();
  }
}