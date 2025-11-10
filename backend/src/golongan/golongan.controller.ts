import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GolonganService } from './golongan.service';
import { CreateGolonganDto } from './dto/create-golongan.dto';
import { UpdateGolonganDto } from './dto/update-golongan.dto';
import { QueryGolonganDto } from './dto/query-golongan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('golongan')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GolonganController {
  constructor(private readonly golonganService: GolonganService) {}

  @Post()
  @Roles('ketua', 'divisi_simpan_pinjam')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createGolonganDto: CreateGolonganDto) {
    return this.golonganService.create(createGolonganDto);
  }

  @Get()
  @Roles('ketua', 'divisi_simpan_pinjam', 'pengawas', 'payroll')
  findAll(@Query() query: QueryGolonganDto) {
    return this.golonganService.findAll(query);
  }

  @Get(':id')
  @Roles('ketua', 'divisi_simpan_pinjam', 'pengawas', 'payroll')
  findOne(@Param('id') id: string) {
    return this.golonganService.findOne(id);
  }

  @Patch(':id')
  @Roles('ketua', 'divisi_simpan_pinjam')
  update(@Param('id') id: string, @Body() updateGolonganDto: UpdateGolonganDto) {
    return this.golonganService.update(id, updateGolonganDto);
  }

  @Delete(':id')
  @Roles('ketua')
  remove(@Param('id') id: string) {
    return this.golonganService.remove(id);
  }
}