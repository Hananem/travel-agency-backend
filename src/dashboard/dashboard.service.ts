import { Injectable } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type TimelineRange = '30d' | '12m';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      trips,
      announcements,
      teamMembers,
      publishedTrips,
      publishedAnnouncements,
      publishedTeamMembers,
      bookingsByStatus,
    ] = await Promise.all([
      this.prisma.trip.count(),
      this.prisma.announcement.count(),
      this.prisma.teamMember.count(),
      this.prisma.trip.count({ where: { isPublished: true } }),
      this.prisma.announcement.count({ where: { isPublished: true } }),
      this.prisma.teamMember.count({ where: { isPublished: true } }),
      this.prisma.booking.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ]);

    return {
      trips,
      announcements,
      teamMembers,
      publishedTrips,
      publishedAnnouncements,
      publishedTeamMembers,
      bookings: this.buildBookingStats(bookingsByStatus),
    };
  }

  private buildBookingStats(
    grouped: { status: BookingStatus; _count: { _all: number } }[],
  ) {
    const counts: Record<BookingStatus, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      CANCELLED: 0,
    };
    grouped.forEach((g) => (counts[g.status] = g._count._all));

    const total = counts.PENDING + counts.CONFIRMED + counts.CANCELLED;
    const pct = (n: number) => (total ? Math.round((n / total) * 1000) / 10 : 0);

    return {
      total,
      pending: { count: counts.PENDING, percent: pct(counts.PENDING) },
      confirmed: { count: counts.CONFIRMED, percent: pct(counts.CONFIRMED) },
      cancelled: { count: counts.CANCELLED, percent: pct(counts.CANCELLED) },
    };
  }

  // الحجوزات عبر الزمن
  async getBookingsTimeline(range: TimelineRange = '30d') {
    if (range === '12m') {
      return this.prisma.$queryRaw<{ label: string; count: number }[]>`
        SELECT to_char(m, 'YYYY-MM') AS label,
               COUNT(b."id")::int AS count
        FROM generate_series(
          date_trunc('month', NOW()) - INTERVAL '11 months',
          date_trunc('month', NOW()),
          INTERVAL '1 month'
        ) AS m
        LEFT JOIN "Booking" b
          ON date_trunc('month', b."createdAt") = m
        GROUP BY m
        ORDER BY m
      `;
    }

    return this.prisma.$queryRaw<{ label: string; count: number }[]>`
      SELECT to_char(d, 'YYYY-MM-DD') AS label,
             COUNT(b."id")::int AS count
      FROM generate_series(
        CURRENT_DATE - INTERVAL '29 days',
        CURRENT_DATE,
        INTERVAL '1 day'
      ) AS d
      LEFT JOIN "Booking" b
        ON b."createdAt"::date = d::date
      GROUP BY d
      ORDER BY d
    `;
  }

  // أكثر الرحلات حجزاً
  async getTopTrips(limit = 5) {
    const grouped = await this.prisma.booking.groupBy({
      by: ['tripId'],
      _count: { _all: true },
      orderBy: { _count: { tripId: 'desc' } },
      take: limit,
    });

    const trips = await this.prisma.trip.findMany({
      where: { id: { in: grouped.map((g) => g.tripId) } },
      select: { id: true, title: true },
    });

    return grouped.map((g) => ({
      tripId: g.tripId,
      title: trips.find((t) => t.id === g.tripId)?.title ?? '—',
      bookings: g._count._all,
    }));
  }

  // معدل الإلغاء لكل رحلة
  async getCancellationRatePerTrip(minBookings = 3) {
    return this.prisma.$queryRaw<
      { tripId: string; title: string; total: number; cancelled: number; rate: number }[]
    >`
      SELECT t."id" AS "tripId",
             t."title",
             COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE b."status" = 'CANCELLED')::int AS cancelled,
             ROUND(
               100.0 * COUNT(*) FILTER (WHERE b."status" = 'CANCELLED') / COUNT(*),
               1
             )::float AS rate
      FROM "Booking" b
      JOIN "Trip" t ON t."id" = b."tripId"
      GROUP BY t."id", t."title"
      HAVING COUNT(*) >= ${minBookings}
      ORDER BY rate DESC, total DESC
    `;
  }

  // الحجوزات حسب الوجهة
  async getBookingsByDestination() {
    return this.prisma.$queryRaw<{ destination: string; count: number }[]>`
      SELECT t."destination",
             COUNT(*)::int AS count
      FROM "Booking" b
      JOIN "Trip" t ON t."id" = b."tripId"
      GROUP BY t."destination"
      ORDER BY count DESC
    `;
  }

  // عدد المسافرين الفعلي (الحاجز + المرافقون)
  async getTravelersStats() {
    const grouped = await this.prisma.booking.groupBy({
      by: ['status'],
      _count: { _all: true },
      _sum: { companionsCount: true },
    });

    const result: Record<BookingStatus, { bookings: number; travelers: number }> = {
      PENDING: { bookings: 0, travelers: 0 },
      CONFIRMED: { bookings: 0, travelers: 0 },
      CANCELLED: { bookings: 0, travelers: 0 },
    };

    grouped.forEach((g) => {
      const bookings = g._count._all;
      result[g.status] = {
        bookings,
        travelers: bookings + (g._sum.companionsCount ?? 0),
      };
    });

    const activeBookings = result.PENDING.bookings + result.CONFIRMED.bookings;
    const activeTravelers = result.CONFIRMED.travelers + result.PENDING.travelers;

    return {
      confirmed: result.CONFIRMED,
      pending: result.PENDING,
      cancelled: result.CANCELLED,
      totalActiveTravelers: activeTravelers,
      avgGroupSize: activeBookings
        ? Number((activeTravelers / activeBookings).toFixed(2))
        : 0,
    };
  }
}