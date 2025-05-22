import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity';

@Injectable()
export class UploadsService {
  constructor(private configService: ConfigService) {}

  async handleFileUpload(file: Express.Multer.File, user: User) {
    const baseUrl = this.configService.get('APP_URL', 'http://localhost:3000');
    const fileUrl = `${baseUrl}/uploads/${file.filename}`;

    return {
      message: 'File berhasil diupload',
      file: {
        originalName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        url: fileUrl,
      },
    };
  }

  async handleAvatarUpload(file: Express.Multer.File, user: User) {
    const baseUrl = this.configService.get('APP_URL', 'http://localhost:3000');
    const avatarUrl = `${baseUrl}/uploads/${file.filename}`;

    return {
      message: 'Avatar berhasil diupload',
      avatar: {
        originalName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        fileSize: file.size,
        url: avatarUrl,
      },
    };
  }

  getFileUrl(filename: string): string {
    const baseUrl = this.configService.get('APP_URL', 'http://localhost:3000');
    return `${baseUrl}/uploads/${filename}`;
  }
}
