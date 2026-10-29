
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { QueryTripsDto } from './dto/query-trips.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  findPublic(@Query() query: QueryTripsDto) {
    return this.tripsService.findPublic(query);
  }

  @Get('slug/:slug')
  findOnePublic(@Param('slug') slug: string) {
    return this.tripsService.findOnePublic(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  findAllForAdmin(@Query() query: QueryTripsDto) {
    return this.tripsService.findAllForAdmin(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/:id')
  findOneForAdmin(@Param('id') id: string) {
    return this.tripsService.findOneForAdmin(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateTripDto) {
    return this.tripsService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.tripsService.updateStatus(id, dto.isPublished);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTripDto) {
    return this.tripsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tripsService.remove(id);
  }
}
