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
import { TeamService } from './team.service';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { QueryTeamMembersDto } from './dto/query-team-members.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  findPublic(@Query() query: QueryTeamMembersDto) {
    return this.teamService.findPublic(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  findAllForAdmin(@Query() query: QueryTeamMembersDto) {
    return this.teamService.findAllForAdmin(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/:id')
  findOneForAdmin(@Param('id') id: string) {
    return this.teamService.findOneForAdmin(id);
  }

  @Get(':id')
  findOnePublic(@Param('id') id: string) {
    return this.teamService.findOnePublic(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateTeamMemberDto) {
    return this.teamService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.teamService.updateStatus(id, dto.isPublished);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTeamMemberDto) {
    return this.teamService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teamService.remove(id);
  }
}