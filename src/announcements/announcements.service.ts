import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Announcement } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { QueryAnnouncementsDto } from './dto/query-announcements.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublic(query: QueryAnnouncementsDto) {
    return this.findMany(query, true);
  }

  async findAllForAdmin(query: QueryAnnouncementsDto) {
    return this.findMany(query, false);
  }

  private async findMany(query: QueryAnnouncementsDto, publicOnly: boolean) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const where: Prisma.AnnouncementWhereInput = {};

    if (publicOnly) {
      where.isPublished = true;
    } else if (query.published !== undefined) {
      where.isPublished = query.published === 'true';
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.AnnouncementOrderByWithRelationInput =
      query.sort === 'oldest'
        ? { createdAt: 'asc' }
        : { createdAt: 'desc' };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.announcement.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.announcement.count({ where }),
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

  async updateStatus(id: string, isPublished: boolean): Promise<Announcement> {
  const existing = await this.findOneForAdmin(id);

  if (existing.isPublished === isPublished) {
    return existing;
  }

  return this.prisma.announcement.update({
    where: { id },
    data: {
      isPublished,
      publishedAt: isPublished ? new Date() : null,
    },
  });
}

  async findOnePublic(id: string): Promise<Announcement> {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id, isPublished: true },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return announcement;
  }

  async findOneForAdmin(id: string): Promise<Announcement> {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return announcement;
  }

  async create(dto: CreateAnnouncementDto): Promise<Announcement> {
    const shouldPublish = dto.isPublished === true;

    return this.prisma.announcement.create({
      data: {
        title: dto.title,
        content: dto.content,
        type: dto.type ?? 'news',
        imageUrl: dto.imageUrl,
        isPublished: shouldPublish,
        publishedAt: shouldPublish ? new Date() : null,
      },
    });
  }

  async update(id: string, dto: UpdateAnnouncementDto): Promise<Announcement> {
    const existing = await this.findOneForAdmin(id);

    let publishedAt = existing.publishedAt;

    if (dto.isPublished === true && !existing.isPublished) {
      publishedAt = new Date();
    } else if (dto.isPublished === false) {
      publishedAt = null;
    }

    return this.prisma.announcement.update({
      where: { id },
      data: {
        ...dto,
        publishedAt,
      },
    });
  }

  async remove(id: string): Promise<Announcement> {
    await this.findOneForAdmin(id);

    return this.prisma.announcement.delete({
      where: { id },
    });
  }
}
