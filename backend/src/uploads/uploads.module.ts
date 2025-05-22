import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        storage: diskStorage({
          destination: configService.get('UPLOAD_DEST', './uploads'),
          filename: (req, file, callback) => {
            const uniqueName = `${uuid()}${extname(file.originalname)}`;
            callback(null, uniqueName);
          },
        }),
        limits: {
          fileSize: configService.get('MAX_FILE_SIZE', 10485760), // 10MB default
        },
        fileFilter: (req, file, callback) => {
          // Allow common file types
          const allowedTypes = /\.(jpg|jpeg|png|gif|pdf|doc|docx|ppt|pptx|xls|xlsx|txt|zip|rar)$/i;
          const isAllowed = allowedTypes.test(file.originalname);
          
          if (isAllowed) {
            callback(null, true);
          } else {
            callback(new Error('Tipe file tidak diizinkan'), false);
          }
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
