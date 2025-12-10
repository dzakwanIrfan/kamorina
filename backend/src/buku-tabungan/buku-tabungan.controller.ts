import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { BukuTabunganService } from './buku-tabungan.service';
import { QueryBukuTabunganDto } from './dto/query-buku-tabungan.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import type { ICurrentUser } from 'src/auth/interfaces/current-user.interface';

@Controller('buku-tabungan')
@UseGuards(JwtAuthGuard)
export class BukuTabunganController {
  constructor(private readonly bukuTabunganService: BukuTabunganService) { }

  /**
   * GET /buku-tabungan
   * Get current user's savings account summary
   */
  @Get()
  async getMyTabungan(
    @CurrentUser() user: ICurrentUser,
    @Query() query: QueryBukuTabunganDto,
  ) {
    console.log(user);
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
}
