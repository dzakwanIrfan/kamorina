import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { BukuTabunganService } from './buku-tabungan.service';
import { BukuTabunganExportService } from './services/buku-tabungan-export.service';
import { QueryBukuTabunganDto } from './dto/query-buku-tabungan.dto';
import { QueryAllBukuTabunganDto } from './dto/query-all-buku-tabungan.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import type { ICurrentUser } from 'src/auth/interfaces/current-user.interface';

@Controller('buku-tabungan')
@UseGuards(JwtAuthGuard)
export class BukuTabunganController {
  constructor(
    private readonly bukuTabunganService: BukuTabunganService,
    private readonly exportService: BukuTabunganExportService,
  ) {}

  /**
   * GET /buku-tabungan/all
   * Get all savings accounts with pagination (for admin roles)
   * Accessible by: KETUA, DIVISI_SIMPAN_PINJAM, PENGAWAS
   */
  @Get('all')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam', 'pengawas')
  async findAll(@Query() query: QueryAllBukuTabunganDto) {
    return this.bukuTabunganService.findAll(query);
  }

  /**
   * GET /buku-tabungan/user/:userId
   * Get specific user's savings account (for admin roles)
   * Accessible by: KETUA, DIVISI_SIMPAN_PINJAM, PENGAWAS
   */
  @Get('user/:userId')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam', 'pengawas')
  async getTabunganByUserIdAdmin(
    @Param('userId') userId: string,
    @Query() query: QueryBukuTabunganDto,
  ) {
    return this.bukuTabunganService.getTabunganByUserId(userId, query);
  }

  /**
   * GET /buku-tabungan/user/:userId/transactions
   * Get specific user's transactions (for admin roles)
   * Accessible by: KETUA, DIVISI_SIMPAN_PINJAM, PENGAWAS
   */
  @Get('user/:userId/transactions')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam', 'pengawas')
  async getTransactionsByUserIdAdmin(
    @Param('userId') userId: string,
    @Query() query: QueryTransactionDto,
  ) {
    return this.bukuTabunganService.getTransactionsByUserId(userId, query);
  }

  /**
   * GET /buku-tabungan
   * Get current user's savings account summary
   */
  @Get()
  async getMyTabungan(
    @CurrentUser() user: ICurrentUser,
    @Query() query: QueryBukuTabunganDto,
  ) {
    return this.bukuTabunganService.getTabunganByUserId(user.id, query);
  }

  /**
   * GET /buku-tabungan/transactions
   * Get current user's savings transactions with pagination
   */
  @Get('transactions')
  async getMyTransactions(
    @CurrentUser() user: ICurrentUser,
    @Query() query: QueryTransactionDto,
  ) {
    return this.bukuTabunganService.getTransactionsByUserId(user.id, query);
  }

  /**
   * GET /buku-tabungan/transactions/:id
   * Get a specific transaction by ID
   */
  @Get('transactions/:id')
  async getTransactionById(
    @CurrentUser() user: ICurrentUser,
    @Param('id') transactionId: string,
  ) {
    return this.bukuTabunganService.getTransactionById(user.id, transactionId);
  }

  /**
   * GET /buku-tabungan/summary/: month/:year
   * Get transaction summary for a specific period
   */
  @Get('summary/:month/:year')
  async getTransactionSummaryByPeriod(
    @CurrentUser() user: ICurrentUser,
    @Param('month') month: string,
    @Param('year') year: string,
  ) {
    return this.bukuTabunganService.getTransactionSummaryByPeriod(
      user.id,
      parseInt(month, 10),
      parseInt(year, 10),
    );
  }

  /**
   * GET /buku-tabungan/export
   * Export current user's savings book to Excel
   */
  @Get('export')
  async exportMyTabungan(
    @CurrentUser() user: ICurrentUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.exportService.exportToExcel(user.id);

    const filename = `Buku_Tabungan_${new Date().getTime()}.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }

  /**
   * GET /buku-tabungan/user/:userId/export
   * Export specific user's savings book to Excel (admin only)
   */
  @Get('user/:userId/export')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam', 'pengawas')
  async exportTabunganByUserId(
    @Param('userId') userId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.exportService.exportToExcel(userId);

    const filename = `Buku_Tabungan_${userId}_${new Date().getTime()}.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }
}
