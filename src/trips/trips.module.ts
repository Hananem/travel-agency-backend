import { Module } from '@nestjs/common';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { UploadModule } from '../uploads/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [TripsController],
  providers: [TripsService],
})
export class TripsModule {}
