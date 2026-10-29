import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';

const tripSelect = {
  id: true,
  title: true,
  slug: true,
  destination: true,
  price: true,
  duration: true,
};

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  // Public: the customer submits the form (no login)
  async create(dto: CreateBookingDto) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: dto.tripId, isPublished: true },
      select: { id: true, title: true },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    const booking = await this.prisma.booking.create({
      data: {
        tripId: trip.id,
        fullName: dto.fullName.trim(),
        phone: dto.phone.trim(),
        companionsCount: dto.companionsCount ?? 0,
        note: dto.note?.trim() || null,
      },
    });

    // Return only what the customer needs (never adminNote)
    return {
      message: 'Booking received successfully',
      booking: {
        id: booking.id,
        status: booking.status,
        tripTitle: trip.title,
        createdAt: booking.createdAt,
      },
    };
  }

  async findAllForAdmin(query: QueryBookingsDto) {
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
        'page must be >= 1 and limit between 1 and 100',
      );
    }

    const where: Prisma.BookingWhereInput = {};

    if (query.status) {
      const status = query.status.toUpperCase();

      if (
        !Object.values(BookingStatus).includes(
          status as BookingStatus,
        )
      ) {
        throw new BadRequestException('Invalid status');
      }

      where.status = status as BookingStatus;
    }

    if (query.tripId?.trim()) {
      where.tripId = query.tripId.trim();
    }

    if (query.search?.trim()) {
      const term = query.search.trim();

      where.OR = [
        { fullName: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term } },
      ];
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { trip: { select: tripSelect } },
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

  async findOneForAdmin(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { trip: { select: tripSelect } },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  // Confirm / cancel and/or write an admin note
  async update(id: string, dto: UpdateBookingDto) {
    await this.findOneForAdmin(id);

    if (dto.status === undefined && dto.adminNote === undefined) {
      throw new BadRequestException(
        'Provide status or adminNote',
      );
    }

    return this.prisma.booking.update({
      where: { id },
      data: {
        ...(dto.status !== undefined
          ? { status: dto.status }
          : {}),
        ...(dto.adminNote !== undefined
          ? { adminNote: dto.adminNote.trim() || null }
          : {}),
      },
      include: { trip: { select: tripSelect } },
    });
  }

  async remove(id: string) {
    await this.findOneForAdmin(id);

    await this.prisma.booking.delete({ where: { id } });

    return { message: 'Booking deleted successfully' };
  }
}
