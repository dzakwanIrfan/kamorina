import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ApplicationStatus, DepositStatus, Prisma, SettingCategory } from '@prisma/client';
import dayjs from 'dayjs';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PayrollService {
    private readonly logger = new Logger(PayrollService.name);

  constructor(private prisma: PrismaService) {}

  // Cron berjalan setiap tanggal 27 jam 00:01 (Sesuai tanggal gajian default)
  @Cron('0 1 * * *') 
  async handleMonthlyPayroll() {
    this.logger.log('Running Payroll Check...');

    // 1. Ambil Setting Tanggal
    const settings = await this.prisma.cooperativeSetting.findMany({
      where: {
        category: SettingCategory.GENERAL,
        key: { in: ['cooperative_cutoff_date', 'cooperative_payroll_date', 'monthly_membership_fee'] }
      }
    });

    const cutoffDateSetting = parseInt(settings.find(s => s.key === 'cooperative_cutoff_date')?.value || '15');
    const payrollDateSetting = parseInt(settings.find(s => s.key === 'cooperative_payroll_date')?.value || '27');
    const simpananWajibAmount = new Prisma.Decimal(settings.find(s => s.key === 'monthly_membership_fee')?.value || '50000');

    const today = dayjs();
    
    // Cek apakah hari ini tanggal gajian?
    if (today.date() !== payrollDateSetting) {
      this.logger.log(`Hari ini tanggal ${today.date()}, bukan tanggal gajian (${payrollDateSetting}). Skip.`);
      return;
    }

    // 2. Tentukan Periode Cutoff (16 Bulan Lalu s/d 15 Bulan Ini)
    // Contoh: Run 27 Feb. Cutoff Start: 16 Jan, Cutoff End: 15 Feb.
    const cutoffEnd = today.set('date', cutoffDateSetting).startOf('day'); // 15 Feb
    const cutoffStart = cutoffEnd.subtract(1, 'month').add(1, 'day').startOf('day'); // 16 Jan
    
    const payrollMonth = today.month() + 1; // 1-12
    const payrollYear = today.year();

    // 3. Cek/Buat PayrollPeriod untuk mencegah double run
    let payrollPeriod = await this.prisma.payrollPeriod.findUnique({
      where: { month_year: { month: payrollMonth, year: payrollYear } }
    });

    if (payrollPeriod && payrollPeriod.isProcessed) {
      this.logger.warn(`Payroll periode ${payrollMonth}-${payrollYear} sudah diproses. Stop.`);
      return;
    }

    if (!payrollPeriod) {
      payrollPeriod = await this.prisma.payrollPeriod.create({
        data: {
          month: payrollMonth,
          year: payrollYear,
          name: `Periode ${today.format('MMMM YYYY')}`,
          isProcessed: false
        }
      });
    }

    this.logger.log(`Processing Payroll: ${cutoffStart.format('DD/MM/YYYY')} - ${cutoffEnd.format('DD/MM/YYYY')}`);

    // MULAI TRANSAKSI DATABASE (Agar data konsisten)
    await this.prisma.$transaction(async (tx) => {
      
      let totalProcessedAmount = new Prisma.Decimal(0);

      // A. PROSES MEMBER BARU (SIMPANAN POKOK)
      const newMembers = await tx.memberApplication.findMany({
        where: {
          status: ApplicationStatus.APPROVED,
          isPaidOff: false,
          approvedAt: { lte: cutoffEnd.toDate() } // Hanya yang diapprove sebelum cutoff
        },
        include: { user: { include: { savingsAccount: true } } }
      });

      for (const app of newMembers) {
        if (!app.user.savingsAccount) {
          throw new Error(`User ID ${app.userId} tidak memiliki Savings Account.`);
        }
        let deduction = new Prisma.Decimal(0);

        // Cek Logic Cicilan
        if (app.installmentPlan === 1) {
          // Lunas Langsung
          deduction = app.remainingAmount;
        } else if (app.installmentPlan === 2) {
          // Cicil 2x
          if (app.paidAmount.equals(0)) {
            // Cicilan Pertama (50% dari Entrance Fee)
            deduction = app.entranceFee.div(2);
          } else {
            // Cicilan Kedua (Sisanya)
            deduction = app.remainingAmount;
          }
        }

        if (deduction.gt(0)) {
          // 1. Insert Transaction
          await tx.savingsTransaction.create({
            data: {
              savingsAccountId: app.user.savingsAccount.id,
              payrollPeriodId: payrollPeriod.id,
              interestRate: 0,
              iuranPendaftaran: deduction, // Masuk kolom pendaftaran
              transactionDate: today.toDate(),
            }
          });

          // 2. Update Member Application
          const newPaid = app.paidAmount.add(deduction);
          const newRemaining = app.remainingAmount.sub(deduction);
          const isLunas = newRemaining.lte(0);

          await tx.memberApplication.update({
            where: { id: app.id },
            data: {
              paidAmount: newPaid,
              remainingAmount: newRemaining,
              isPaidOff: isLunas
            }
          });

          // 3. Update Savings Account (Saldo Pokok)
          await tx.savingsAccount.update({
            where: { id: app.user.savingsAccount.id },
            data: {
              saldoPokok: { increment: deduction }
            }
          });

          totalProcessedAmount = totalProcessedAmount.add(deduction);
        }
      }

      // B. PROSES SIMPANAN WAJIB (RUTIN)
      // Ambil semua user aktif yang sudah jadi member (punya savings account)
      const activeUsers = await tx.user.findMany({
        where: {
          memberVerified: true, // Pastikan sudah verified member
          savingsAccount: { isNot: null }
        },
        include: { savingsAccount: true }
      });

      for (const user of activeUsers) {
        const savingsAccountId = user.savingsAccount?.id;
        if (!savingsAccountId) {
            throw new Error(`User ID ${user.id} tidak memiliki Savings Account.`);
        }
        // 1. Insert Transaction
        await tx.savingsTransaction.create({
          data: {
            savingsAccountId: savingsAccountId,
            payrollPeriodId: payrollPeriod.id,
            interestRate: 0,
            iuranBulanan: simpananWajibAmount, // Masuk kolom bulanan
            transactionDate: today.toDate(),
          }
        });

        // 2. Update Savings Account (Saldo Wajib)
        await tx.savingsAccount.update({
          where: { id: savingsAccountId },
          data: {
            saldoWajib: { increment: simpananWajibAmount }
          }
        });

        totalProcessedAmount = totalProcessedAmount.add(simpananWajibAmount);
      }

      // C. PROSES TABUNGAN DEPOSITO (LOOPING LOGIC)
      const deposits = await tx.depositApplication.findMany({
        where: {
          OR: [
            { status: DepositStatus.APPROVED },
            { status: DepositStatus.ACTIVE }
          ],
          approvedAt: { lte: cutoffEnd.toDate() },
        },
        include: { user: { include: { savingsAccount: true } } }
      });

      for (const deposit of deposits) {
        const savingsAccountId = deposit.user.savingsAccount?.id;
        if (!savingsAccountId) {
            throw new Error(`User ID ${deposit.user.id} tidak memiliki Savings Account.`);
        }
        // Cek Logic Installment Count
        if (deposit.installmentCount < deposit.tenorMonths) {
          
          // Logic: Jika status APPROVED, ubah jadi ACTIVE dulu (Simulasi aktifasi saat potongan pertama)
          let currentStatus = deposit.status;
          let activatedAt = deposit.activatedAt;
          
          if (deposit.status === DepositStatus.APPROVED) {
            currentStatus = DepositStatus.ACTIVE;
            activatedAt = today.toDate(); // Set aktif pada saat pemotongan pertama
          }

          const deduction = deposit.amountValue;

          // 1. Insert Transaction
          await tx.savingsTransaction.create({
            data: {
              savingsAccountId: savingsAccountId,
              payrollPeriodId: payrollPeriod.id,
              interestRate: deposit.interestRate,
              tabunganDeposito: deduction, // Masuk kolom tabungan deposito
              transactionDate: today.toDate(),
            }
          });

          // 2. Update Deposit Application
          const newCollected = deposit.collectedAmount.add(deduction);
          const newCount = deposit.installmentCount + 1;
          
          // Cek Selesai
          let finalStatus = currentStatus;
          let completedAt: Date | null = null;
          
          if (newCount >= deposit.tenorMonths) {
            finalStatus = DepositStatus.COMPLETED;
            completedAt = today.toDate();
          }

          await tx.depositApplication.update({
            where: { id: deposit.id },
            data: {
              status: finalStatus,
              collectedAmount: newCollected,
              installmentCount: newCount,
              activatedAt: activatedAt,
              completedAt: completedAt
            }
          });

          await tx.savingsAccount.update({
            where: { id: savingsAccountId },
            data: { saldoSukarela: { increment: deduction } } 
          });

          totalProcessedAmount = totalProcessedAmount.add(deduction);
        }
      }

      // FINALISASI PAYROLL PERIOD
      await tx.payrollPeriod.update({
        where: { id: payrollPeriod.id },
        data: {
          isProcessed: true,
          processedAt: new Date(),
          totalAmount: totalProcessedAmount
        }
      });

    }); // End Transaction

    this.logger.log('Payroll Process Completed Successfully.');
  }
}
