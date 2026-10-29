import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { QueryTeamMembersDto } from './dto/query-team-members.dto';

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublic(query: QueryTeamMembersDto) {
    return this.findMany(query, true);
  }

  async findAllForAdmin(query: QueryTeamMembersDto) {
    return this.findMany(query, false);
  }

  private async findMany(query: QueryTeamMembersDto, publicOnly: boolean) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const where: Prisma.TeamMemberWhereInput = {};

    if (publicOnly) {
      where.isPublished = true;
    } else if (query.published !== undefined) {
      where.isPublished = query.published === 'true';
    }

    if (query.position) {
      where.position = { contains: query.position, mode: 'insensitive' };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { position: { contains: query.search, mode: 'insensitive' } },
        { bio: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    let orderBy: Prisma.TeamMemberOrderByWithRelationInput;

    switch (query.sort) {
      case 'order_desc':
        orderBy = { sortOrder: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      default:
        orderBy = { sortOrder: 'asc' };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.teamMember.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.teamMember.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOnePublic(id: string) {
    const member = await this.prisma.teamMember.findFirst({
      where: { id, isPublished: true },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    return member;
  }

  async findOneForAdmin(id: string) {
    const member = await this.prisma.teamMember.findUnique({
      where: { id },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    return member;
  }

  async create(dto: CreateTeamMemberDto) {
    return this.prisma.teamMember.create({
      data: {
        name: dto.name,
        position: dto.position,
        bio: dto.bio,
        imageUrl: dto.imageUrl,
        sortOrder: dto.sortOrder,
        isPublished: dto.isPublished ?? false,
      },
    });
  }

  async update(id: string, dto: UpdateTeamMemberDto) {
    await this.findOneForAdmin(id);

    return this.prisma.teamMember.update({
      where: { id },
      data: dto,
    });
  }

  async updateStatus(id: string, isPublished: boolean) {
    await this.findOneForAdmin(id);

    return this.prisma.teamMember.update({
      where: { id },
      data: { isPublished },
    });
  }

  async remove(id: string) {
    await this.findOneForAdmin(id);

    await this.prisma.teamMember.delete({
      where: { id },
    });

    return { message: 'Team member deleted successfully' };
  }
}