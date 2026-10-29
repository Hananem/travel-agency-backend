
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { QueryTripsDto } from './dto/query-trips.dto';

const tripInclude = {
  companions: {
    include: {
      teamMember: {
        select: { id: true, name: true, position: true, imageUrl: true },
      },
    },
  },
} satisfies Prisma.TripInclude;

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- مساعدات ----------

  private assertDates(start?: Date, end?: Date | null) {
    if (start && end && end < start) {
      throw new BadRequestException(
        'End date must be after start date',
      );
    }
  }

  private async assertTeamMembersExist(ids: string[]) {
    const unique = [...new Set(ids)];
    if (!unique.length) return;

    const count = await this.prisma.teamMember.count({
      where: { id: { in: unique } },
    });

    if (count !== unique.length) {
      throw new BadRequestException('Some team members do not exist');
    }
  }

  // المقاعد المحجوزة = (1 + المرافقون) لكل حجز غير ملغى
  private async bookedSeatsMap(tripIds: string[]) {
    const map = new Map<string, number>();
    if (!tripIds.length) return map;

    const rows = await this.prisma.booking.groupBy({
      by: ['tripId'],
      where: { tripId: { in: tripIds }, status: { not: 'CANCELLED' } },
      _count: { _all: true },
      _sum: { companionsCount: true },
    });

    rows.forEach((r) =>
      map.set(r.tripId, r._count._all + (r._sum.companionsCount ?? 0)),
    );
    return map;
  }

  private withSeats<T extends { capacity: number | null }>(
    trip: T,
    booked: number,
  ) {
    const remaining =
      trip.capacity === null ? null : Math.max(trip.capacity - booked, 0);

    return {
      ...trip,
      bookedSeats: booked,
      remainingSeats: remaining,
      isFull: remaining === 0,
    };
  }

  private async attachSeats<T extends { id: string; capacity: number | null }>(
    trips: T[],
  ) {
    const map = await this.bookedSeatsMap(trips.map((t) => t.id));
    return trips.map((t) => this.withSeats(t, map.get(t.id) ?? 0));
  }

  // ---------- القراءة ----------

  findPublic(query: QueryTripsDto) {
    return this.findMany(query, false);
  }

  findAllForAdmin(query: QueryTripsDto) {
    return this.findMany(query, true);
  }

  private async findMany(query: QueryTripsDto, isAdmin: boolean) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);

    const minPrice =
      query.minPrice !== undefined ? Number(query.minPrice) : undefined;
    const maxPrice =
      query.maxPrice !== undefined ? Number(query.maxPrice) : undefined;

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1
    ) {
      throw new BadRequestException('page and limit must be positive integers');
    }

    if (
      (minPrice !== undefined && !Number.isFinite(minPrice)) ||
      (maxPrice !== undefined && !Number.isFinite(maxPrice))
    ) {
      throw new BadRequestException('Prices must be valid numbers');
    }

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      throw new BadRequestException('minPrice cannot be greater than maxPrice');
    }

    const where: Prisma.TripWhereInput = {};

    if (!isAdmin) {
      where.isPublished = true;
    } else if (query.published !== undefined) {
      where.isPublished = query.published === 'true';
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { destination: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (query.destination?.trim()) {
      where.destination = {
        contains: query.destination.trim(),
        mode: 'insensitive',
      };
    }

    if (query.duration?.trim()) {
      where.duration = {
        contains: query.duration.trim(),
        mode: 'insensitive',
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {
        ...(minPrice !== undefined ? { gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
      };
    }

    const orderBy: Prisma.TripOrderByWithRelationInput =
      query.sort === 'price_asc'
        ? { price: 'asc' }
        : query.sort === 'price_desc'
          ? { price: 'desc' }
          : query.sort === 'oldest'
            ? { createdAt: 'asc' }
            : query.sort === 'soonest'
              ? { startDate: 'asc' }
              : { createdAt: 'desc' };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.trip.count({ where }),
      this.prisma.trip.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: tripInclude,
      }),
    ]);

    const data = await this.attachSeats(rows);

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

  async findOnePublic(slug: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { slug, isPublished: true },
      include: tripInclude,
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const [result] = await this.attachSeats([trip]);
    return result;
  }

  async findOneForAdmin(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: tripInclude,
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const [result] = await this.attachSeats([trip]);
    return result;
  }

  // ---------- الكتابة ----------

  async updateStatus(id: string, isPublished: boolean) {
    await this.findOneForAdmin(id);

    return this.prisma.trip.update({
      where: { id },
      data: { isPublished },
    });
  }

  async create(dto: CreateTripDto) {
    const existing = await this.prisma.trip.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Trip slug already exists');
    }

    this.assertDates(dto.startDate, dto.endDate);

    const companions = dto.companions ?? [];
    await this.assertTeamMembersExist(companions.map((c) => c.teamMemberId));

    const trip = await this.prisma.trip.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        destination: dto.destination,
        description: dto.description,
        price: new Prisma.Decimal(dto.price),
        duration: dto.duration,
        imageUrl: dto.imageUrl,
        isPublished: dto.isPublished ?? false,
        startDate: dto.startDate,
        endDate: dto.endDate,
        capacity: dto.capacity,
        features: dto.features ?? [],
        companions: {
          create: companions.map((c) => ({
            teamMemberId: c.teamMemberId,
            role: c.role,
          })),
        },
      },
      include: tripInclude,
    });

    return this.withSeats(trip, 0);
  }

  async update(id: string, dto: UpdateTripDto) {
    const current = await this.prisma.trip.findUnique({ where: { id } });

    if (!current) {
      throw new NotFoundException('Trip not found');
    }

    if (dto.slug) {
      const existing = await this.prisma.trip.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });

      if (existing) {
        throw new ConflictException('Trip slug already exists');
      }
    }

    this.assertDates(
      dto.startDate ?? current.startDate,
      dto.endDate !== undefined ? dto.endDate : current.endDate,
    );

    // لا يمكن تقليل المقاعد عن المحجوز فعلاً
    if (dto.capacity !== undefined) {
      const booked = (await this.bookedSeatsMap([id])).get(id) ?? 0;

      if (dto.capacity < booked) {
        throw new BadRequestException(
          `Capacity cannot be less than booked seats (${booked})`,
        );
      }
    }

    if (dto.companions) {
      await this.assertTeamMembersExist(
        dto.companions.map((c) => c.teamMemberId),
      );
    }

    const { price, companions, ...rest } = dto;

    const data: Prisma.TripUpdateInput = {
      ...rest,
      ...(price !== undefined ? { price: new Prisma.Decimal(price) } : {}),
      // إن أُرسلت companions تُستبدل القائمة كاملة، وإن لم تُرسل تبقى كما هي
      ...(companions !== undefined
        ? {
            companions: {
              deleteMany: {},
              create: companions.map((c) => ({
                teamMemberId: c.teamMemberId,
                role: c.role,
              })),
            },
          }
        : {}),
    };

    const trip = await this.prisma.trip.update({
      where: { id },
      data,
      include: tripInclude,
    });

    const booked = (await this.bookedSeatsMap([id])).get(id) ?? 0;
    return this.withSeats(trip, booked);
  }

  async remove(id: string) {
    await this.findOneForAdmin(id);

    await this.prisma.trip.delete({ where: { id } });

    return { message: 'Trip deleted successfully' };
  }
}