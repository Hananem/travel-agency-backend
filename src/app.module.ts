import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TripsModule } from './trips/trips.module';
import { TeamModule } from './team/team.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DestinationsModule } from './destinations/destinations.module';
import { BookingsModule } from './bookings/bookings.module';
import { UploadModule } from './uploads/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TripsModule,
    TeamModule,
    AnnouncementsModule,
    DashboardModule,
    DestinationsModule,
    BookingsModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}