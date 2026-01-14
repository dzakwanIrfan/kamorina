import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PayrollContext,
  ProcessorResult,
  ProcessorError,
  ProcessorDetail,
} from '../interfaces/payroll.interface';

@Injectable()
export class InterestCalculatorProcessor {
  private readonly logger = new Logger(InterestCalculatorProcessor.name);

  constructor(private prisma: PrismaService) {}

  async process(
    tx: Prisma.TransactionClient,
    context: PayrollContext,
  ): Promise<ProcessorResult> {
    const errors: ProcessorError[] = [];
    const details: ProcessorDetail[] = [];
    let totalAmount = new Prisma.Decimal(0);
    let processedCount = 0;

    this.logger.log('Calculating interest (Bunga Simpanan)...');

    // Ambil semua savings account yang ada transaction di periode ini
    const savingsAccounts = await tx.savingsAccount.findMany({
      where: {
        user: {
          memberVerified: true,
        },
      },
      include: {
        user: true,
        transactions: {
          where: {
            payrollPeriodId: context.payrollPeriodId,
          },
        },
      },
    });

    this.logger.log(
      `Calculating interest for ${savingsAccounts.length} accounts`,
    );

    const annualRate = context.settings.depositInterestRate;
    const monthlyRate = new Prisma.Decimal(annualRate).div(100).div(12);

    for (const account of savingsAccounts) {
      try {
        // Hitung total saldo untuk basis bunga
        const totalBalance = new Prisma.Decimal(account.saldoPokok)
          .add(account.saldoWajib)
          .add(account.saldoSukarela);

        if (totalBalance.lte(0)) {
          continue;
        }

        // Hitung bunga bulanan
        const monthlyInterest = totalBalance.mul(monthlyRate);

        // Check if transaction exists for this period
        const existingTransaction = account.transactions[0];

        const note = `Setoran koperasi dari potongan gaji periode ${context.cutoffStart.format(
          'DD MMMM YYYY',
        )} s/d ${context.cutoffEnd.format('DD MMMM YYYY')}`;

        if (existingTransaction) {
          // Update existing transaction dengan bunga
          const previousJumlahBunga =
            existingTransaction.jumlahBunga || new Prisma.Decimal(0);

          await tx.savingsTransaction.update({
            where: { id: existingTransaction.id },
            data: {
              bunga: monthlyInterest,
              jumlahBunga: previousJumlahBunga.add(monthlyInterest),
              note,
            },
          });
        } else {
          // Create new transaction jika belum ada
          await tx.savingsTransaction.create({
            data: {
              savingsAccountId: account.id,
              payrollPeriodId: context.payrollPeriodId,
              interestRate: annualRate,
              bunga: monthlyInterest,
              jumlahBunga: monthlyInterest,
              note,
            },
          });
        }

        // Update savings account bunga deposito
        await tx.savingsAccount.update({
          where: { id: account.id },
          data: {
            bungaDeposito: { increment: monthlyInterest },
          },
        });

        totalAmount = totalAmount.add(monthlyInterest);
        processedCount++;

        details.push({
          userId: account.userId,
          userName: account.user.name,
          type: 'BUNGA_SIMPANAN',
          amount: monthlyInterest,
          description: `Bunga ${annualRate}% p.a. dari saldo ${totalBalance}`,
        });

        this.logger.debug(
          `Interest for ${account.user.name}: ${monthlyInterest} (base: ${totalBalance})`,
        );
      } catch (error) {
        errors.push({
          userId: account.userId,
          entityId: account.id,
          entityType: 'SavingsAccount',
          message: error.message,
          stack: error.stack,
        });
      }
    }

    this.logger.log(
      `Interest calculation complete. Processed: ${processedCount}, Total: ${totalAmount}`,
    );

    return { processedCount, totalAmount, errors, details };
  }
}
