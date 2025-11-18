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
import { CreateLoanLimitDto } from './dto/create-loan-limit.dto';
import { UpdateLoanLimitDto } from './dto/update-loan-limit.dto';
import { BulkUpdateLoanLimitsDto } from './dto/bulk-update-loan-limits.dto';
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

  // LOAN LIMIT ENDPOINTS

  @Post('loan-limits')
  @Roles('ketua', 'divisi_simpan_pinjam')
  @HttpCode(HttpStatus.CREATED)
  createLoanLimit(@Body() createLoanLimitDto: CreateLoanLimitDto) {
    return this.golonganService.createLoanLimit(createLoanLimitDto);
  }

  @Post('loan-limits/bulk')
  @Roles('ketua', 'divisi_simpan_pinjam')
  @HttpCode(HttpStatus.OK)
  bulkUpdateLoanLimits(@Body() bulkUpdateDto: BulkUpdateLoanLimitsDto) {
    return this.golonganService.bulkUpdateLoanLimits(bulkUpdateDto);
  }

  @Get(':id/loan-limits')
  @Roles('ketua', 'divisi_simpan_pinjam', 'pengawas', 'payroll')
  getLoanLimitsByGolongan(@Param('id') id: string) {
    return this.golonganService.getLoanLimitsByGolongan(id);
  }

  @Patch('loan-limits/:id')
  @Roles('ketua', 'divisi_simpan_pinjam')
  updateLoanLimit(
    @Param('id') id: string,
    @Body() updateLoanLimitDto: UpdateLoanLimitDto,
  ) {
    return this.golonganService.updateLoanLimit(id, updateLoanLimitDto);
  }

  @Delete('loan-limits/:id')
  @Roles('ketua', 'divisi_simpan_pinjam')
  deleteLoanLimit(@Param('id') id: string) {
    return this.golonganService.deleteLoanLimit(id);
  }

  @Get('users/:userId/max-loan-amount')
  @Roles('ketua', 'divisi_simpan_pinjam', 'pengawas')
  getMaxLoanAmountForUser(@Param('userId') userId: string) {
    return this.golonganService.getMaxLoanAmountForUser(userId);
  }
}