import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GolonganService } from './golongan.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('golongan')
@UseGuards(JwtAuthGuard)
export class GolonganController {
  constructor(private readonly golonganService: GolonganService) {}

  /**
   * Get all golongan with pagination
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: any) {
    return this.golonganService.findAll(query);
  }

  /**
   * Get golongan by ID
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.golonganService.findOne(id);
  }
}