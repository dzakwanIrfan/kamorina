import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto, BulkUpdateSettingsDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SettingCategory } from '@prisma/client';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles('ketua', 'divisi_simpan_pinjam')
  async findAll() {
    return this.settingsService.findAll();
  }

  @Get('category/:category')
  @Roles('ketua', 'divisi_simpan_pinjam')
  async findByCategory(@Param('category') category: SettingCategory) {
    return this.settingsService.findByCategory(category);
  }

  @Get(':key')
  async findByKey(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }

  @Put(':key')
  @Roles('ketua', 'divisi_simpan_pinjam')
  async update(
    @Param('key') key: string,
    @Body() updateSettingDto: UpdateSettingDto,
    @Request() req,
  ) {
    return this.settingsService.update(key, updateSettingDto, req.user.userId);
  }

  @Put()
  @Roles('ketua', 'divisi_simpan_pinjam')
  async bulkUpdate(@Body() bulkUpdateDto: BulkUpdateSettingsDto, @Request() req) {
    return this.settingsService.bulkUpdate(bulkUpdateDto, req.user.userId);
  }
}