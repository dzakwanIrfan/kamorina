import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../config/env.config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  constructor(
    private configService: ConfigService<EnvironmentVariables>,
  ) {}

  getFileUrl(filename: string): string {
    const apiUrl = this.configService.get('API_URL', { infer: true }) || 'http://localhost:3001';
    return `${apiUrl}/uploads/${filename}`;
  }

  deleteFile(filename: string): void {
    if (!filename) return;

    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  extractFilename(fileUrl: string): string | null {
    if (!fileUrl) return null;
    
    const parts = fileUrl.split('/');
    return parts[parts.length - 1];
  }

  validateImageFile(file: Express.Multer.File): void {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Format file tidak valid. Hanya jpg, jpeg, png, gif, dan webp yang diperbolehkan.');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('Ukuran file terlalu besar. Maksimal 5MB.');
    }
  }
}