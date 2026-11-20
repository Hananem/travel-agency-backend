
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { QueryTripsDto } from './dto/query-trips.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CloudinaryService } from '../uploads/cloudinary.service';

const imageInterceptor = FileInterceptor('image', {
  storage: memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(
        new BadRequestException('Only images are allowed'),
        false,
      );
    }

    cb(null, true);
  },
});

// تحويل الحقول القادمة عبر multipart إلى أنواعها الصحيحة
function normalizeBody(body: Record<string, any>) {
  const data: Record<string, any> = { ...body };

  for (const key of Object.keys(data)) {
    if (data[key] === '') {
      delete data[key];
    }
  }

  for (const key of ['features', 'companions']) {
    if (typeof data[key] === 'string') {
      try {
        data[key] = JSON.parse(data[key]);
      } catch {
        throw new BadRequestException(
          `${key} must be a valid JSON array`,
        );
      }
    }
  }

  if (data.isPublished === 'true') {
    data.isPublished = true;
  }

  if (data.isPublished === 'false') {
    data.isPublished = false;
  }

  return data;
}

async function toDto<T extends object>(
  cls: new () => T,
  body: Record<string, any>,
): Promise<T> {
  const dto = plainToInstance(cls, normalizeBody(body ?? {}), {
    enableImplicitConversion: true,
  });

  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length) {
    throw new BadRequestException(
      errors.flatMap((e) =>
        Object.values(e.constraints ?? {}),
      ),
    );
  }

  return dto;
}

@Controller('trips')
export class TripsController {
  constructor(
    private readonly tripsService: TripsService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @Get()
  findPublic(@Query() query: QueryTripsDto) {
    return this.tripsService.findPublic(query);
  }

  @Get('slug/:slug')
  findOnePublic(@Param('slug') slug: string) {
    return this.tripsService.findOnePublic(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  findAllForAdmin(@Query() query: QueryTripsDto) {
    return this.tripsService.findAllForAdmin(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/:id')
  findOneForAdmin(@Param('id') id: string) {
    return this.tripsService.findOneForAdmin(id);
  }

  // إنشاء رحلة جديدة
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(imageInterceptor)
  async create(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: Record<string, any>,
  ) {
    console.log('[TRIPS] POST /trips reached');

    try {
      console.log(
        '[TRIPS] Body fields:',
        Object.keys(body ?? {}),
      );

      console.log('[TRIPS] Image received:', !!file);

      const dto = await toDto(CreateTripDto, body);

      console.log('[TRIPS] DTO validation passed');

      if (file) {
        console.log('[TRIPS] Uploading image to Cloudinary');

        dto.imageUrl = await this.cloudinary.uploadImage(
          file,
          'trips',
        );

        console.log('[TRIPS] Cloudinary upload completed');
      }

      const result = await this.tripsService.create(dto);

      console.log('[TRIPS] Trip created successfully');

      return result;
    } catch (error) {
      console.error('[TRIPS] CREATE ERROR:', error);

      throw error;
    }
  }

  // تحديث حالة الرحلة
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.tripsService.updateStatus(id, dto.isPublished);
  }

  // تعديل رحلة
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(imageInterceptor)
  async update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: Record<string, any>,
  ) {
    console.log('[TRIPS] PATCH /trips reached:', id);

    try {
      const dto = await toDto(UpdateTripDto, body);

      if (file) {
        console.log('[TRIPS] Uploading updated image');

        dto.imageUrl = await this.cloudinary.uploadImage(
          file,
          'trips',
        );
      }

      const result = await this.tripsService.update(id, dto);

      console.log('[TRIPS] Trip updated successfully');

      return result;
    } catch (error) {
      console.error('[TRIPS] UPDATE ERROR:', error);

      throw error;
    }
  }

  // حذف رحلة
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tripsService.remove(id);
  }
}
