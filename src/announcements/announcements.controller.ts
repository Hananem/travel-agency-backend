
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
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { QueryAnnouncementsDto } from './dto/query-announcements.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('announcements')
export class AnnouncementsController {
  constructor(
    private readonly announcementsService: AnnouncementsService,
  ) {}

  @Get()
  findPublic(@Query() query: QueryAnnouncementsDto) {
    return this.announcementsService.findPublic(query);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  findAllForAdmin(@Query() query: QueryAnnouncementsDto) {
    return this.announcementsService.findAllForAdmin(query);
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard)
  findOneForAdmin(@Param('id') id: string) {
    return this.announcementsService.findOneForAdmin(id);
  }

  @Get(':id')
  findOnePublic(@Param('id') id: string) {
    return this.announcementsService.findOnePublic(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateAnnouncementDto) {
    return this.announcementsService.create(dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.announcementsService.updateStatus(
      id,
      dto.isPublished,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.announcementsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.announcementsService.remove(id);
  }
}
