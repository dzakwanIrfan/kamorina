import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingDto, BulkUpdateSettingsDto } from './dto/update-setting.dto';
import { SettingCategory, SettingType, Prisma } from '@prisma/client';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const settings = await this.prisma.cooperativeSetting.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
      include: {
        updatedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Group by category
    const grouped = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {} as Record<string, any[]>);

    return grouped;
  }

  async findByCategory(category: SettingCategory) {
    const settings = await this.prisma.cooperativeSetting.findMany({
      where: {
        category,
        isActive: true,
      },
      orderBy: { key: 'asc' },
      include: {
        updatedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return settings;
  }

  async findByKey(key: string) {
    const setting = await this.prisma.cooperativeSetting.findUnique({
      where: { key },
      include: {
        updatedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }

    return setting;
  }

  async update(key: string, updateSettingDto: UpdateSettingDto, userId: string) {
    const setting = await this.prisma.cooperativeSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }

    if (!setting.isEditable) {
      throw new BadRequestException(`Setting "${key}" is not editable`);
    }

    // Validate value based on type and validation rules
    this.validateValue(setting, updateSettingDto.value);

    const updated = await this.prisma.cooperativeSetting.update({
      where: { key },
      data: {
        value: updateSettingDto.value,
        updatedBy: userId,
      },
      include: {
        updatedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updated;
  }

  async bulkUpdate(bulkUpdateDto: BulkUpdateSettingsDto, userId: string) {
    const results: Array<{
      key: string;
      success: boolean;
      data?: any;
      error?: string;
    }> = [];

    for (const { key, value } of bulkUpdateDto.settings) {
      try {
        const updated = await this.update(key, { value }, userId);
        results.push({ key, success: true, data: updated });
      } catch (error) {
        results.push({ key, success: false, error: error.message });
      }
    }

    return results;
  }

  private validateValue(setting: any, value: string) {
    const validation = setting.validation as any;

    if (!validation) return;

    // Check required
    if (validation.required && (!value || value.trim() === '')) {
      throw new BadRequestException(`${setting.label} wajib diisi`);
    }

    // Validate based on type
    switch (setting.type) {
      case SettingType.NUMBER:
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          throw new BadRequestException(`${setting.label} harus berupa angka`);
        }
        if (validation.min !== undefined && numValue < validation.min) {
          throw new BadRequestException(`${setting.label} minimal ${validation.min}`);
        }
        if (validation.max !== undefined && numValue > validation.max) {
          throw new BadRequestException(`${setting.label} maksimal ${validation.max}`);
        }
        break;

      case SettingType.BOOLEAN:
        if (value !== 'true' && value !== 'false') {
          throw new BadRequestException(`${setting.label} harus true atau false`);
        }
        break;

      case SettingType.STRING:
        if (validation.enum && !validation.enum.includes(value)) {
          throw new BadRequestException(
            `${setting.label} harus salah satu dari: ${validation.enum.join(', ')}`,
          );
        }
        if (validation.minLength && value.length < validation.minLength) {
          throw new BadRequestException(
            `${setting.label} minimal ${validation.minLength} karakter`,
          );
        }
        if (validation.maxLength && value.length > validation.maxLength) {
          throw new BadRequestException(
            `${setting.label} maksimal ${validation.maxLength} karakter`,
          );
        }
        break;

      case SettingType.JSON:
        try {
          JSON.parse(value);
        } catch {
          throw new BadRequestException(`${setting.label} harus berupa JSON yang valid`);
        }
        break;
    }
  }

  // Helper method to get parsed value
  async getValue(key: string): Promise<any> {
    const setting = await this.findByKey(key);

    switch (setting.type) {
      case SettingType.NUMBER:
        return parseFloat(setting.value);
      case SettingType.BOOLEAN:
        return setting.value === 'true';
      case SettingType.JSON:
        return JSON.parse(setting.value);
      default:
        return setting.value;
    }
  }
}