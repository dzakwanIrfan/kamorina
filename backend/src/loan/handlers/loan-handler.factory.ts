import { Injectable, BadRequestException } from '@nestjs/common';
import { LoanType } from '@prisma/client';
import { LoanTypeHandler } from './loan-type-handler.interface';
import { CashLoanHandler } from './cash-loan.handler';
import { GoodsReimburseHandler } from './goods-reimburse.handler';
import { GoodsOnlineHandler } from './goods-online.handler';
import { GoodsPhoneHandler } from './goods-phone.handler';

@Injectable()
export class LoanHandlerFactory {
  private handlers: Map<LoanType, LoanTypeHandler>;

  constructor(
    private cashLoanHandler: CashLoanHandler,
    private goodsReimburseHandler: GoodsReimburseHandler,
    private goodsOnlineHandler: GoodsOnlineHandler,
    private goodsPhoneHandler: GoodsPhoneHandler,
  ) {
    this.handlers = new Map<LoanType, LoanTypeHandler>([
      [LoanType.CASH_LOAN, this.cashLoanHandler as LoanTypeHandler],
      [LoanType.GOODS_REIMBURSE, this.goodsReimburseHandler as LoanTypeHandler],
      [LoanType.GOODS_ONLINE, this.goodsOnlineHandler as LoanTypeHandler],
      [LoanType.GOODS_PHONE, this.goodsPhoneHandler as LoanTypeHandler],
    ]);
  }

  getHandler(loanType: LoanType): LoanTypeHandler {
    const handler = this.handlers.get(loanType);
    if (!handler) {
      throw new BadRequestException(`Handler untuk tipe pinjaman ${loanType} tidak ditemukan`);
    }
    return handler;
  }
}