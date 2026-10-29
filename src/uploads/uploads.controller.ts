import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import type { Request } from 'express';

@Controller('uploads')
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_req, file, callback) => {
          callback(
            null,
            `${randomUUID()}${extname(file.originalname).toLowerCase()}`,
          );
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (_req, file, callback) => {
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
        ];

        if (!allowedTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Only JPG, PNG, and WebP images are allowed.',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() request: Request,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required.');
    }

    return {
      url: `${request.protocol}://${request.get('host')}/uploads/${file.filename}`,
    };
  }
}