import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DepositOptionService } from './deposit-option.service';
import { CreateDepositAmountDto } from './dto/create-deposit-amount.dto';
import { UpdateDepositAmountDto } from './dto/update-deposit-amount.dto';
import { CreateDepositTenorDto } from './dto/create-deposit-tenor.dto';
import { UpdateDepositTenorDto } from './dto/update-deposit-tenor.dto';
import { QueryDepositOptionDto } from './dto/query-deposit-option.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('deposit-options')
@UseGuards(JwtAuthGuard)
export class DepositOptionController {
  constructor(private readonly depositOptionService: DepositOptionService) {}

  // PUBLIC ENDPOINTS

  /**
   * Get deposit configuration (active options + interest rate)
   * Used by deposit form
   */
  @Get('config')
  @HttpCode(HttpStatus.OK)
  async getDepositConfig() {
    return this.depositOptionService.getDepositConfig();
  }

  /**
   * Preview calculation before submitting
   */
  @Get('preview-calculation')
  @HttpCode(HttpStatus.OK)
  async previewCalculation(
    @Query('amountCode') amountCode: string,
    @Query('tenorCode') tenorCode: string,
  ) {
    return this.depositOptionService.previewCalculation(amountCode, tenorCode);
  }

  // AMOUNT OPTIONS

  /**
   * Get all amount options (paginated, for admin)
   */
  @Get('amounts')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam')
  @HttpCode(HttpStatus.OK)
  async findAllAmountOptions(@Query() query: QueryDepositOptionDto) {
    return this.depositOptionService.findAllAmountOptions(query);
  }

  /**
   * Get single amount option by ID
   */
  @Get('amounts/:id')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam')
  @HttpCode(HttpStatus.OK)
  async findAmountOptionById(@Param('id') id: string) {
    return this.depositOptionService.findAmountOptionById(id);
  }

  /**
   * Create amount option
   */
  @Post('amounts')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam')
  @HttpCode(HttpStatus.CREATED)
  async createAmountOption(@Body() dto: CreateDepositAmountDto) {
    return this.depositOptionService.createAmountOption(dto);
  }

  /**
   * Update amount option
   */
  @Put('amounts/:id')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam')
  @HttpCode(HttpStatus.OK)
  async updateAmountOption(
    @Param('id') id: string,
    @Body() dto: UpdateDepositAmountDto,
  ) {
    return this.depositOptionService.updateAmountOption(id, dto);
  }

  /**
   * Delete amount option
   */
  @Delete('amounts/:id')
  @UseGuards(RolesGuard)
  @Roles('ketua')
  @HttpCode(HttpStatus.OK)
  async deleteAmountOption(@Param('id') id: string) {
    return this.depositOptionService.deleteAmountOption(id);
  }

  // TENOR OPTIONS

  /**
   * Get all tenor options (paginated, for admin)
   */
  @Get('tenors')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam')
  @HttpCode(HttpStatus.OK)
  async findAllTenorOptions(@Query() query: QueryDepositOptionDto) {
    return this.depositOptionService.findAllTenorOptions(query);
  }

  /**
   * Get single tenor option by ID
   */
  @Get('tenors/:id')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam')
  @HttpCode(HttpStatus.OK)
  async findTenorOptionById(@Param('id') id: string) {
    return this.depositOptionService.findTenorOptionById(id);
  }

  /**
   * Create tenor option
   */
  @Post('tenors')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam')
  @HttpCode(HttpStatus.CREATED)
  async createTenorOption(@Body() dto: CreateDepositTenorDto) {
    return this.depositOptionService.createTenorOption(dto);
  }

  /**
   * Update tenor option
   */
  @Put('tenors/:id')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam')
  @HttpCode(HttpStatus.OK)
  async updateTenorOption(
    @Param('id') id: string,
    @Body() dto: UpdateDepositTenorDto,
  ) {
    return this.depositOptionService.updateTenorOption(id, dto);
  }

  /**
   * Delete tenor option
   */
  @Delete('tenors/:id')
  @UseGuards(RolesGuard)
  @Roles('ketua')
  @HttpCode(HttpStatus.OK)
  async deleteTenorOption(@Param('id') id: string) {
    return this.depositOptionService.deleteTenorOption(id);
  }
}