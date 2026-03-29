import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { QuerySalaryDeductionReportDto } from './dto/query-salary-deduction-report.dto';
import { Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface CashLoanData {
  angsuran: number;
  jumlahPinjaman: number;
  start: string | null;
  finish: string | null;
}

interface GoodsLoanData {
  angsuran: number;
  jumlahPinjaman: number;
  start: string | null;
  finish: string | null;
}

interface RepaymentData {
  pelunasan: number;
  sisaLamaPinjaman: string | null;
}

interface ReportRow {
  nama: string;
  dept: string;
  pendaftaran: number;
  tabunganDeposito: number;
  penarikan: number;
  cashLoan: CashLoanData;
  pelunasanPinjaman: RepaymentData;
  goodsLoan: GoodsLoanData;
}

interface ReportTotals {
  pendaftaran: number;
  tabunganDeposito: number;
  penarikan: number;
  cashLoanAngsuran: number;
  cashLoanJumlahPinjaman: number;
  pelunasan: number;
  goodsLoanAngsuran: number;
  goodsLoanJumlahPinjaman: number;
}

export interface SalaryDeductionReport {
  period: { month: number; year: number; name: string };
  rows: ReportRow[];
  totals: ReportTotals;
}

@Injectable()
export class SalaryDeductionReportService {
  private readonly logger = new Logger(SalaryDeductionReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getReport(
    query: QuerySalaryDeductionReportDto,
  ): Promise<SalaryDeductionReport> {
    const month = query.month || new Date().getMonth() + 1;
    const year = query.year || new Date().getFullYear();

    const monthNames = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    const periodName = `Potong Gaji ${monthNames[month - 1]} ${year}`;

    // Find payroll period
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { month_year: { month, year } },
    });

    if (!period) {
      return {
        period: { month, year, name: periodName },
        rows: [],
        totals: this.emptyTotals(),
      };
    }

    // Run all queries in parallel
    const [savingsTransactions, loanInstallments, loanRepayments] =
      await Promise.all([
        this.querySavingsTransactions(period.id),
        this.queryLoanInstallments(period.id),
        this.queryLoanRepayments(month, year),
      ]);

    // Build a map: userId -> ReportRow
    const rowMap = new Map<string, ReportRow>();

    // 1) Savings transactions (pendaftaran, tabunganDeposito, penarikan)
    for (const tx of savingsTransactions) {
      const user = tx.account.user;
      const userId = user.id;

      if (!rowMap.has(userId)) {
        rowMap.set(userId, this.emptyRow(user));
      }
      const row = rowMap.get(userId)!;
      row.pendaftaran += this.toNumber(tx.iuranPendaftaran);
      row.tabunganDeposito += this.toNumber(tx.tabunganDeposito);
      row.penarikan += this.toNumber(tx.penarikan);
    }

    // 2) Loan installments (cash loan vs goods loan)
    for (const installment of loanInstallments) {
      const loan = installment.loanApplication;
      const user = loan.user;
      const userId = user.id;

      if (!rowMap.has(userId)) {
        rowMap.set(userId, this.emptyRow(user));
      }
      const row = rowMap.get(userId)!;

      const angsuran = this.toNumber(installment.amount);
      const jumlahPinjaman = this.toNumber(loan.loanAmount);
      const start = loan.disbursedAt
        ? this.formatMonthYear(loan.disbursedAt)
        : null;
      const finish = this.calculateFinishDate(loan.disbursedAt, loan.loanTenor);

      if (loan.loanType === 'CASH_LOAN') {
        row.cashLoan.angsuran += angsuran;
        row.cashLoan.jumlahPinjaman = jumlahPinjaman;
        row.cashLoan.start = row.cashLoan.start || start;
        row.cashLoan.finish = row.cashLoan.finish || finish;
      } else {
        // GOODS_REIMBURSE, GOODS_ONLINE, GOODS_PHONE
        row.goodsLoan.angsuran += angsuran;
        row.goodsLoan.jumlahPinjaman = jumlahPinjaman;
        row.goodsLoan.start = row.goodsLoan.start || start;
        row.goodsLoan.finish = row.goodsLoan.finish || finish;
      }
    }

    // 3) Loan repayments (pelunasan pinjaman for CASH_LOAN)
    for (const repayment of loanRepayments) {
      const loan = repayment.loanApplication;
      const user = repayment.user;
      const userId = user.id;

      if (!rowMap.has(userId)) {
        rowMap.set(userId, this.emptyRow(user));
      }
      const row = rowMap.get(userId)!;

      const pelunasan = this.toNumber(repayment.totalAmount);
      const sisaLama = this.calculateRemainingTenor(loan);

      row.pelunasanPinjaman.pelunasan += pelunasan;
      row.pelunasanPinjaman.sisaLamaPinjaman =
        row.pelunasanPinjaman.sisaLamaPinjaman || sisaLama;
    }

    // Sort rows by name
    const rows = Array.from(rowMap.values()).sort((a, b) =>
      a.nama.localeCompare(b.nama),
    );

    // Calculate totals
    const totals = this.calculateTotals(rows);

    return {
      period: { month, year, name: periodName },
      rows,
      totals,
    };
  }

  async generateExcel(
    query: QuerySalaryDeductionReportDto,
  ): Promise<ExcelJS.Workbook> {
    const report = await this.getReport(query);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Pemotongan Gaji');

    // Column widths
    sheet.columns = [
      { width: 30 }, // A: NAMA
      { width: 8 }, // B: DEPT
      { width: 16 }, // C: PENDAFTARAN
      { width: 20 }, // D: TABUNGAN DEPOSITO
      { width: 16 }, // E: PENARIKAN
      { width: 16 }, // F: ANGSURAN (cash)
      { width: 18 }, // G: JUMLAH PINJAMAN (cash)
      { width: 12 }, // H: START (cash)
      { width: 12 }, // I: FINISH (cash)
      { width: 16 }, // J: PELUNASAN
      { width: 20 }, // K: SISA LAMA PINJAMAN
      { width: 16 }, // L: ANGSURAN (goods)
      { width: 18 }, // M: JUMLAH PINJAMAN (goods)
      { width: 12 }, // N: START (goods)
      { width: 12 }, // O: FINISH (goods)
    ];

    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    const headerFont: Partial<ExcelJS.Font> = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 10,
    };
    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    // Row 1: Title
    const titleRow = sheet.getRow(1);
    titleRow.getCell(1).value = report.period.name;
    titleRow.getCell(1).font = { bold: true, size: 14 };
    sheet.mergeCells('A1:O1');

    // Row 2: Group headers
    const groupRow = sheet.getRow(2);
    // PEMINJAMAN UANG group (F-I)
    sheet.mergeCells('F2:I2');
    groupRow.getCell(6).value = 'PEMINJAMAN UANG';
    groupRow.getCell(6).fill = headerFill;
    groupRow.getCell(6).font = headerFont;
    groupRow.getCell(6).alignment = { horizontal: 'center' };
    groupRow.getCell(6).border = borderStyle;
    groupRow.getCell(7).border = borderStyle;
    groupRow.getCell(8).border = borderStyle;
    groupRow.getCell(9).border = borderStyle;

    // PELUNASAN PINJAMAN group (J-K)
    sheet.mergeCells('J2:K2');
    groupRow.getCell(10).value = 'PELUNASAN PINJAMAN';
    groupRow.getCell(10).fill = headerFill;
    groupRow.getCell(10).font = headerFont;
    groupRow.getCell(10).alignment = { horizontal: 'center' };
    groupRow.getCell(10).border = borderStyle;
    groupRow.getCell(11).border = borderStyle;

    // PEMINJAMAN BARANG group (L-O)
    sheet.mergeCells('L2:O2');
    groupRow.getCell(12).value = 'PEMINJAMAN BARANG';
    groupRow.getCell(12).fill = headerFill;
    groupRow.getCell(12).font = headerFont;
    groupRow.getCell(12).alignment = { horizontal: 'center' };
    groupRow.getCell(12).border = borderStyle;
    groupRow.getCell(13).border = borderStyle;
    groupRow.getCell(14).border = borderStyle;
    groupRow.getCell(15).border = borderStyle;

    // Row 3: Column headers
    const headerRow = sheet.getRow(3);
    const headers = [
      'NAMA',
      'DEPT',
      'PENDAFTARAN',
      'TABUNGAN DEPOSITO',
      'PENARIKAN',
      'ANGSURAN',
      'JUMLAH PINJAMAN',
      'START',
      'FINISH',
      'PELUNASAN',
      'SISA LAMA PINJAMAN',
      'ANGSURAN',
      'JUMLAH PINJAMAN',
      'START',
      'FINISH',
    ];

    // Merge rows 2-3 for non-grouped headers (A-E)
    for (let col = 1; col <= 5; col++) {
      sheet.mergeCells(2, col, 3, col);
      const cell = sheet.getCell(2, col);
      cell.value = headers[col - 1];
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = borderStyle;
    }

    // Sub-headers for grouped columns (F-O)
    for (let col = 6; col <= 15; col++) {
      const cell = headerRow.getCell(col);
      cell.value = headers[col - 1];
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E2F3' },
      };
      cell.font = { bold: true, size: 10 };
      cell.alignment = { horizontal: 'center' };
      cell.border = borderStyle;
    }

    // Data rows
    const numberFormat = '#,##0';
    report.rows.forEach((row, index) => {
      const dataRow = sheet.getRow(index + 4);
      dataRow.getCell(1).value = row.nama;
      dataRow.getCell(2).value = row.dept;
      dataRow.getCell(3).value = row.pendaftaran || null;
      dataRow.getCell(4).value = row.tabunganDeposito || null;
      dataRow.getCell(5).value = row.penarikan || null;
      dataRow.getCell(6).value = row.cashLoan.angsuran || null;
      dataRow.getCell(7).value = row.cashLoan.jumlahPinjaman || null;
      dataRow.getCell(8).value = row.cashLoan.start;
      dataRow.getCell(9).value = row.cashLoan.finish;
      dataRow.getCell(10).value = row.pelunasanPinjaman.pelunasan || null;
      dataRow.getCell(11).value = row.pelunasanPinjaman.sisaLamaPinjaman;
      dataRow.getCell(12).value = row.goodsLoan.angsuran || null;
      dataRow.getCell(13).value = row.goodsLoan.jumlahPinjaman || null;
      dataRow.getCell(14).value = row.goodsLoan.start;
      dataRow.getCell(15).value = row.goodsLoan.finish;

      // Apply number format to numeric cells
      for (const col of [3, 4, 5, 6, 7, 10, 12, 13]) {
        dataRow.getCell(col).numFmt = numberFormat;
      }

      // Apply borders
      for (let col = 1; col <= 15; col++) {
        dataRow.getCell(col).border = borderStyle;
      }

      // Alternate row coloring
      if (index % 2 === 0) {
        for (let col = 1; col <= 15; col++) {
          dataRow.getCell(col).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' },
          };
        }
      }
    });

    // Totals row
    const totalRowIndex = report.rows.length + 4;
    const totalRow = sheet.getRow(totalRowIndex);
    totalRow.getCell(1).value = 'TOTAL';
    totalRow.getCell(1).font = { bold: true };
    totalRow.getCell(3).value = report.totals.pendaftaran || null;
    totalRow.getCell(4).value = report.totals.tabunganDeposito || null;
    totalRow.getCell(5).value = report.totals.penarikan || null;
    totalRow.getCell(6).value = report.totals.cashLoanAngsuran || null;
    totalRow.getCell(7).value = report.totals.cashLoanJumlahPinjaman || null;
    totalRow.getCell(10).value = report.totals.pelunasan || null;
    totalRow.getCell(12).value = report.totals.goodsLoanAngsuran || null;
    totalRow.getCell(13).value = report.totals.goodsLoanJumlahPinjaman || null;

    for (const col of [3, 4, 5, 6, 7, 10, 12, 13]) {
      totalRow.getCell(col).numFmt = numberFormat;
    }

    // Style totals row
    for (let col = 1; col <= 15; col++) {
      totalRow.getCell(col).font = { bold: true };
      totalRow.getCell(col).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF2CC' },
      };
      totalRow.getCell(col).border = borderStyle;
    }

    return workbook;
  }

  // ---- Private Query Methods ----

  private async querySavingsTransactions(periodId: string) {
    return this.prisma.savingsTransaction.findMany({
      where: { payrollPeriodId: periodId },
      include: {
        account: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                employee: {
                  select: {
                    fullName: true,
                    department: { select: { departmentName: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  private async queryLoanInstallments(periodId: string) {
    return this.prisma.loanInstallment.findMany({
      where: {
        payrollPeriodId: periodId,
        isPaid: true,
      },
      include: {
        loanApplication: {
          select: {
            loanType: true,
            loanAmount: true,
            loanTenor: true,
            disbursedAt: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                employee: {
                  select: {
                    fullName: true,
                    department: { select: { departmentName: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  private async queryLoanRepayments(month: number, year: number) {
    // Repayments completed in this period (cutoff: 15th)
    const cutoffEnd = new Date(year, month - 1, 15, 23, 59, 59);
    const cutoffStart = new Date(year, month - 2, 16, 0, 0, 0);

    return this.prisma.loanRepayment.findMany({
      where: {
        status: 'COMPLETED',
        approvedAt: {
          gte: cutoffStart,
          lte: cutoffEnd,
        },
        loanApplication: {
          loanType: 'CASH_LOAN',
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            employee: {
              select: {
                fullName: true,
                department: { select: { departmentName: true } },
              },
            },
          },
        },
        loanApplication: {
          select: {
            loanType: true,
            loanAmount: true,
            loanTenor: true,
            disbursedAt: true,
            loanInstallments: {
              select: { isPaid: true },
            },
          },
        },
      },
    });
  }

  // ---- Helper Methods ----

  private emptyRow(user: {
    id: string;
    name: string;
    employee?: {
      fullName: string;
      department?: { departmentName: string } | null;
    } | null;
  }): ReportRow {
    return {
      nama: user.employee?.fullName || user.name,
      dept: user.employee?.department?.departmentName || '-',
      pendaftaran: 0,
      tabunganDeposito: 0,
      penarikan: 0,
      cashLoan: { angsuran: 0, jumlahPinjaman: 0, start: null, finish: null },
      pelunasanPinjaman: { pelunasan: 0, sisaLamaPinjaman: null },
      goodsLoan: { angsuran: 0, jumlahPinjaman: 0, start: null, finish: null },
    };
  }

  private emptyTotals(): ReportTotals {
    return {
      pendaftaran: 0,
      tabunganDeposito: 0,
      penarikan: 0,
      cashLoanAngsuran: 0,
      cashLoanJumlahPinjaman: 0,
      pelunasan: 0,
      goodsLoanAngsuran: 0,
      goodsLoanJumlahPinjaman: 0,
    };
  }

  private calculateTotals(rows: ReportRow[]): ReportTotals {
    return rows.reduce(
      (acc, row) => ({
        pendaftaran: acc.pendaftaran + row.pendaftaran,
        tabunganDeposito: acc.tabunganDeposito + row.tabunganDeposito,
        penarikan: acc.penarikan + row.penarikan,
        cashLoanAngsuran: acc.cashLoanAngsuran + row.cashLoan.angsuran,
        cashLoanJumlahPinjaman:
          acc.cashLoanJumlahPinjaman + row.cashLoan.jumlahPinjaman,
        pelunasan: acc.pelunasan + row.pelunasanPinjaman.pelunasan,
        goodsLoanAngsuran: acc.goodsLoanAngsuran + row.goodsLoan.angsuran,
        goodsLoanJumlahPinjaman:
          acc.goodsLoanJumlahPinjaman + row.goodsLoan.jumlahPinjaman,
      }),
      this.emptyTotals(),
    );
  }

  private toNumber(value: Prisma.Decimal | number | string): number {
    if (value instanceof Prisma.Decimal) return value.toNumber();
    if (typeof value === 'string') return parseFloat(value) || 0;
    return value || 0;
  }

  private formatMonthYear(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'MMM-yy', { locale: idLocale });
  }

  private calculateFinishDate(
    disbursedAt: Date | string | null,
    tenor: number,
  ): string | null {
    if (!disbursedAt) return null;
    const d = typeof disbursedAt === 'string' ? new Date(disbursedAt) : disbursedAt;
    const finishDate = new Date(d);
    finishDate.setMonth(finishDate.getMonth() + tenor);
    return format(finishDate, 'MMM-yy', { locale: idLocale });
  }

  private calculateRemainingTenor(loan: {
    loanTenor: number;
    loanInstallments: { isPaid: boolean }[];
  }): string | null {
    const paidCount = loan.loanInstallments.filter((i) => i.isPaid).length;
    const remaining = loan.loanTenor - paidCount;
    if (remaining <= 0) return null;
    return `${remaining}bln`;
  }
}
