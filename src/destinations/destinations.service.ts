
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';

interface QueryDestinationsDto {
  page?: string;
  limit?: string;
  search?: string;
  country?: string;
  published?: string;
  sort?: string;
}

@Injectable()
export class DestinationsService {
  constructor(private readonly prisma: PrismaService) {}

  findPublic(query: QueryDestinationsDto) {
    return this.findMany(query, false);
  }

  findAllForAdmin(query: QueryDestinationsDto) {
    return this.findMany(query, true);
  }

  private async findMany(
    query: QueryDestinationsDto,
    isAdmin: boolean,
  ) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      throw new BadRequestException(
        'page and limit must be positive integers; limit cannot exceed 100',
      );
    }

    const where: Prisma.DestinationWhereInput = {};

    if (!isAdmin) {
      where.isPublished = true;
    } else if (query.published !== undefined) {
      if (!['true', 'false'].includes(query.published)) {
        throw new BadRequestException(
          'published must be true or false',
        );
      }

      where.isPublished = query.published === 'true';
    }

    if (query.search?.trim()) {
      const term = query.search.trim();

      where.OR = [
        {
          name: {
            contains: term,
            mode: 'insensitive',
          },
        },
        {
          country: {
            contains: term,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: term,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (query.country?.trim()) {
      where.country = {
        contains: query.country.trim(),
        mode: 'insensitive',
      };
    }

    const orderBy: Prisma.DestinationOrderByWithRelationInput =
      query.sort === 'oldest'
        ? { createdAt: 'asc' }
        : query.sort === 'name'
          ? { name: 'asc' }
          : { sortOrder: 'asc' };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.destination.count({ where }),
      this.prisma.destination.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }
async updateStatus(id: string, isPublished: boolean) {
  await this.findOneForAdmin(id);

  return this.prisma.destination.update({
    where: { id },
    data: { isPublished },
  });
}
  async findOnePublic(slug: string) {
    const destination = await this.prisma.destination.findFirst({
      where: {
        slug,
        isPublished: true,
      },
    });

    if (!destination) {
      throw new NotFoundException('Destination not found');
    }

    return destination;
  }

  async findOneForAdmin(id: string) {
    const destination = await this.prisma.destination.findUnique({
      where: { id },
    });

    if (!destination) {
      throw new NotFoundException('Destination not found');
    }

    return destination;
  }

  async create(dto: CreateDestinationDto) {
    const existing = await this.prisma.destination.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(
        'Destination slug already exists',
      );
    }

    return this.prisma.destination.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        country: dto.country,
        description: dto.description,
        imageUrl: dto.imageUrl,
        isPublished: dto.isPublished ?? false,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateDestinationDto) {
    await this.findOneForAdmin(id);

    if (dto.slug) {
      const existing = await this.prisma.destination.findFirst({
        where: {
          slug: dto.slug,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(
          'Destination slug already exists',
        );
      }
    }

    const data: Prisma.DestinationUpdateInput = {
      ...dto,
    };

    return this.prisma.destination.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOneForAdmin(id);

    await this.prisma.destination.delete({
      where: { id },
    });

    return {
      message: 'Destination deleted successfully',
    };
  }
}
