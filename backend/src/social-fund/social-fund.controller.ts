import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SocialFundService } from './social-fund.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { ICurrentUser } from '../auth/interfaces/current-user.interface';
import {
  CreateInitialBalanceDto,
  UpdateInitialBalanceDto,
  CreateSantunanDto,
  QuerySocialFundDto,
} from './dto';

@Controller('social-fund')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SocialFundController {
  constructor(private readonly socialFundService: SocialFundService) {}

  // Balance

  @Get('balance')
  @Roles('ketua', 'divisi_simpan_pinjam')
  async getBalance() {
    return this.socialFundService.getBalance();
  }

  // Initial Balance CRUD

  @Get('initial-balance')
  @Roles('ketua', 'divisi_simpan_pinjam')
  async getInitialBalances(@Query() query: QuerySocialFundDto) {
    return this.socialFundService.getInitialBalances(query);
  }

  @Post('initial-balance')
  @Roles('ketua', 'divisi_simpan_pinjam')
  @HttpCode(HttpStatus.CREATED)
  async createInitialBalance(
    @Body() dto: CreateInitialBalanceDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.socialFundService.createInitialBalance(dto, user.id);
  }

  @Put('initial-balance/:id')
  @Roles('ketua', 'divisi_simpan_pinjam')
  async updateInitialBalance(
    @Param('id') id: string,
    @Body() dto: UpdateInitialBalanceDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.socialFundService.updateInitialBalance(id, dto, user.id);
  }

  @Delete('initial-balance/:id')
  @Roles('ketua')
  @HttpCode(HttpStatus.OK)
  async deleteInitialBalance(
    @Param('id') id: string,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.socialFundService.deleteInitialBalance(id, user.id);
  }

  // Santunan

  @Get('santunan')
  @Roles('ketua', 'divisi_simpan_pinjam')
  async getSantunanList(@Query() query: QuerySocialFundDto) {
    return this.socialFundService.getSantunanList(query);
  }

  @Post('santunan')
  @Roles('ketua', 'divisi_simpan_pinjam')
  @HttpCode(HttpStatus.CREATED)
  async createSantunan(
    @Body() dto: CreateSantunanDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.socialFundService.createSantunan(dto, user.id);
  }

  @Delete('santunan/:id')
  @Roles('ketua')
  @HttpCode(HttpStatus.OK)
  async deleteSantunan(
    @Param('id') id: string,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.socialFundService.deleteSantunan(id, user.id);
  }

  // Eligible Members

  @Get('eligible-members')
  @Roles('ketua', 'divisi_simpan_pinjam')
  async getEligibleMembers(@Query('search') search?: string) {
    return this.socialFundService.getEligibleMembers(search);
  }

  // All Transactions (Ledger)

  @Get('transactions')
  @Roles('ketua', 'divisi_simpan_pinjam')
  async getTransactions(@Query() query: QuerySocialFundDto) {
    return this.socialFundService.getTransactions(query);
  }
}
