
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
import { DestinationsService } from './destinations.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('destinations')
export class DestinationsController {
  constructor(
    private readonly destinationsService: DestinationsService,
  ) {}

  // Public: published destinations only
  @Get()
  findPublic(@Query() query: Record<string, string>) {
    return this.destinationsService.findPublic(query);
  }

  // Public: a published destination by slug
  @Get('slug/:slug')
  findOnePublic(@Param('slug') slug: string) {
    return this.destinationsService.findOnePublic(slug);
  }

  // Admin: all destinations, including unpublished ones
  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  findAllForAdmin(@Query() query: Record<string, string>) {
    return this.destinationsService.findAllForAdmin(query);
  }

  // Admin: destination details by ID
  @UseGuards(JwtAuthGuard)
  @Get('admin/:id')
  findOneForAdmin(@Param('id') id: string) {
    return this.destinationsService.findOneForAdmin(id);
  }

  // Admin: create
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateDestinationDto) {
    return this.destinationsService.create(dto);
  }

  // Admin: update publication status
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.destinationsService.updateStatus(
      id,
      dto.isPublished,
    );
  }

  // Admin: update
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDestinationDto,
  ) {
    return this.destinationsService.update(id, dto);
  }

  // Admin: delete
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.destinationsService.remove(id);
  }
}
