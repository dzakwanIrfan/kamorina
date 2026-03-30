import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryLoanBalanceReportDto } from './dto/query-loan-balance-report.dto';
import { Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';

interface MonthlyLoanData {
  sisaPinjaman: number;
  bunga: number;
  angsuran: number;
}

interface MonthMeta {
  key: string; // "2024-01"
  label: string; // "2024 JANUARY"
}

interface ReportRow {
  noAnggota: string;
  nama: string;
  totalBungaPrevYear: number;
  monthlyData: Record<string, MonthlyLoanData>;
  totalBungaCurrentYear: number;
}

interface ReportTotals {
  totalBungaPrevYear: number;
  monthlyTotals: Record<string, MonthlyLoanData>;
  totalBungaCurrentYear: number;
}

export interface LoanBalanceReport {
  year: number;
  prevYear: number;
  months: MonthMeta[];
  rows: ReportRow[];
  totals: ReportTotals;
}

const MONTH_NAMES = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
];

@Injectable()
export class LoanBalanceReportService {
  private readonly logger = new Logger(LoanBalanceReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getReport(
    query: QueryLoanBalanceReportDto,
  ): Promise<LoanBalanceReport> {
    const year = query.year || new Date().getFullYear();
    const prevYear = year - 1;

    // Find the latest processed payroll period for the selected year
    // to determine how many months to show (Jan -> latest payroll)
    const latestPayroll = await this.prisma.payrollPeriod.findFirst({
      where: { year, isProcessed: true },
      orderBy: { month: 'desc' },
    });
    const lastMonth = latestPayroll ? latestPayroll.month : 0;

    // Run both queries in parallel
    const [currentYearInstallments, prevYearInstallments] = await Promise.all([
      this.queryInstallmentsForYear(year),
      this.queryInstallmentsForYear(prevYear),
    ]);

    // Build rows map: userId -> ReportRow
    const rowMap = new Map<string, ReportRow>();

    // 1) Process current year installments
    for (const installment of currentYearInstallments) {
      const loan = installment.loanApplication;
      const user = loan.user;
      const userId = user.id;

      if (!rowMap.has(userId)) {
        rowMap.set(userId, {
          noAnggota: user.employee?.employeeNumber || '-',
          nama: user.employee?.fullName || user.name,
          totalBungaPrevYear: 0,
          monthlyData: {},
          totalBungaCurrentYear: 0,
        });
      }

      const row = rowMap.get(userId)!;
      const dueDate = new Date(installment.dueDate);
      const monthIndex = dueDate.getMonth(); // 0-based
      const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

      // Only include months up to the latest processed payroll
      if (monthIndex + 1 > lastMonth) continue;

      // Calculate per-installment values
      const { bunga, angsuran, sisaPinjaman } =
        this.calculateInstallmentBreakdown(loan, installment);

      // Aggregate into monthly data (user may have multiple loans)
      if (!row.monthlyData[monthKey]) {
        row.monthlyData[monthKey] = { sisaPinjaman: 0, bunga: 0, angsuran: 0 };
      }
      row.monthlyData[monthKey].sisaPinjaman += sisaPinjaman;
      row.monthlyData[monthKey].bunga += bunga;
      row.monthlyData[monthKey].angsuran += angsuran;

      // Accumulate total bunga (interest) for current year
      row.totalBungaCurrentYear += bunga;
    }

    // 2) Process previous year installments for totalBungaPrevYear
    for (const installment of prevYearInstallments) {
      const loan = installment.loanApplication;
      const user = loan.user;
      const userId = user.id;

      if (!rowMap.has(userId)) {
        rowMap.set(userId, {
          noAnggota: user.employee?.employeeNumber || '-',
          nama: user.employee?.fullName || user.name,
          totalBungaPrevYear: 0,
          monthlyData: {},
          totalBungaCurrentYear: 0,
        });
      }

      const row = rowMap.get(userId)!;
      const { bunga } = this.calculateInstallmentBreakdown(loan, installment);
      row.totalBungaPrevYear += bunga;
    }

    // Build months array: January through the latest processed payroll month
    const months: MonthMeta[] = [];
    for (let m = 1; m <= lastMonth; m++) {
      months.push({
        key: `${year}-${String(m).padStart(2, '0')}`,
        label: `${year} ${MONTH_NAMES[m - 1]}`,
      });
    }

    // Sort rows by name
    const rows = Array.from(rowMap.values()).sort((a, b) =>
      a.nama.localeCompare(b.nama),
    );

    // Calculate totals
    const totals = this.calculateTotals(rows, months);

    return { year, prevYear, months, rows, totals };
  }

  async generateExcel(
    query: QueryLoanBalanceReportDto,
  ): Promise<ExcelJS.Workbook> {
    const report = await this.getReport(query);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Pinjaman');

    const monthCount = report.months.length;
    // Columns: NO.ANGGOTA, NAMA, TOTAL_BUNGA_PREV, [3 per month...], TOTAL_BUNGA_CURRENT
    const totalCols = 3 + monthCount * 3 + 1;

    // Set column widths
    const columns: Partial<ExcelJS.Column>[] = [
      { width: 16 }, // A: NO.ANGGOTA
      { width: 28 }, // B: NAMA
      { width: 22 }, // C: TOTAL BUNGA prev year
    ];
    for (let i = 0; i < monthCount; i++) {
      columns.push({ width: 18 }); // SISA PINJAMAN
      columns.push({ width: 14 }); // BUNGA
      columns.push({ width: 14 }); // ANGSURAN
    }
    columns.push({ width: 22 }); // TOTAL BUNGA current year
    sheet.columns = columns;

    // Styles
    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF548235' }, // Green from screenshot
    };
    const subHeaderFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFA9D18E' }, // Lighter green
    };
    const headerFont: Partial<ExcelJS.Font> = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 8,
    };
    const subHeaderFont: Partial<ExcelJS.Font> = {
      bold: true,
      color: { argb: 'FF000000' },
      size: 8,
    };
    const border: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    // --- Row 1: Group headers ---
    const row1 = sheet.getRow(1);
    // NO.ANGGOTA (merge rows 1-2)
    sheet.mergeCells(1, 1, 2, 1);
    const cellA1 = sheet.getCell(1, 1);
    cellA1.value = 'NO. ANGGOTA';
    cellA1.fill = headerFill;
    cellA1.font = headerFont;
    cellA1.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cellA1.border = border;

    // NAMA (merge rows 1-2)
    sheet.mergeCells(1, 2, 2, 2);
    const cellB1 = sheet.getCell(1, 2);
    cellB1.value = 'NAMA';
    cellB1.fill = headerFill;
    cellB1.font = headerFont;
    cellB1.alignment = { horizontal: 'center', vertical: 'middle' };
    cellB1.border = border;

    // TOTAL BUNGA PINJAMAN [prevYear] (merge rows 1-2)
    sheet.mergeCells(1, 3, 2, 3);
    const cellC1 = sheet.getCell(1, 3);
    cellC1.value = `TOTAL BUNGA PINJAMAN ${report.prevYear}`;
    cellC1.fill = headerFill;
    cellC1.font = headerFont;
    cellC1.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cellC1.border = border;

    // Monthly group headers (colspan 3 each)
    let colOffset = 4;
    for (const month of report.months) {
      sheet.mergeCells(1, colOffset, 1, colOffset + 2);
      const cell = sheet.getCell(1, colOffset);
      cell.value = month.label;
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { horizontal: 'center' };
      cell.border = border;
      // Apply border to merged cells
      for (let c = colOffset; c <= colOffset + 2; c++) {
        sheet.getCell(1, c).border = border;
      }
      colOffset += 3;
    }

    // TOTAL BUNGA PINJAMAN [year] (merge rows 1-2)
    const lastCol = totalCols;
    sheet.mergeCells(1, lastCol, 2, lastCol);
    const cellLast = sheet.getCell(1, lastCol);
    cellLast.value = `TOTAL BUNGA PINJAMAN ${report.year}`;
    cellLast.fill = headerFill;
    cellLast.font = headerFont;
    cellLast.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cellLast.border = border;

    // --- Row 2: Sub-headers for each month ---
    const row2 = sheet.getRow(2);
    colOffset = 4;
    for (let i = 0; i < monthCount; i++) {
      const subHeaders = ['SISA PINJAMAN', 'BUNGA', 'ANGSURAN'];
      for (let j = 0; j < 3; j++) {
        const cell = row2.getCell(colOffset + j);
        cell.value = subHeaders[j];
        cell.fill = subHeaderFill;
        cell.font = subHeaderFont;
        cell.alignment = { horizontal: 'center', wrapText: true };
        cell.border = border;
      }
      colOffset += 3;
    }

    // Apply border to row2 cells that are part of merged rowspan (A, B, C, last)
    for (const col of [1, 2, 3, lastCol]) {
      sheet.getCell(2, col).border = border;
    }

    // --- Data rows ---
    const numFmt = '#,##0';
    report.rows.forEach((row, index) => {
      const dataRow = sheet.getRow(index + 3);
      dataRow.getCell(1).value = row.noAnggota;
      dataRow.getCell(2).value = row.nama;
      dataRow.getCell(3).value = row.totalBungaPrevYear || null;
      dataRow.getCell(3).numFmt = numFmt;

      let col = 4;
      for (const month of report.months) {
        const md = row.monthlyData[month.key];
        dataRow.getCell(col).value = md?.sisaPinjaman || null;
        dataRow.getCell(col).numFmt = numFmt;
        dataRow.getCell(col + 1).value = md?.bunga || null;
        dataRow.getCell(col + 1).numFmt = numFmt;
        dataRow.getCell(col + 2).value = md?.angsuran || null;
        dataRow.getCell(col + 2).numFmt = numFmt;
        col += 3;
      }

      dataRow.getCell(lastCol).value = row.totalBungaCurrentYear || null;
      dataRow.getCell(lastCol).numFmt = numFmt;

      // Apply borders and alternating colors
      for (let c = 1; c <= totalCols; c++) {
        dataRow.getCell(c).border = border;
        if (index % 2 === 0) {
          dataRow.getCell(c).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' },
          };
        }
      }
    });

    // --- Totals row ---
    const totalRowIndex = report.rows.length + 3;
    const totalRow = sheet.getRow(totalRowIndex);
    totalRow.getCell(1).value = '';
    totalRow.getCell(2).value = 'TOTAL';
    totalRow.getCell(2).font = { bold: true };
    totalRow.getCell(3).value = report.totals.totalBungaPrevYear || null;
    totalRow.getCell(3).numFmt = numFmt;

    let col = 4;
    for (const month of report.months) {
      const mt = report.totals.monthlyTotals[month.key];
      totalRow.getCell(col).value = mt?.sisaPinjaman || null;
      totalRow.getCell(col).numFmt = numFmt;
      totalRow.getCell(col + 1).value = mt?.bunga || null;
      totalRow.getCell(col + 1).numFmt = numFmt;
      totalRow.getCell(col + 2).value = mt?.angsuran || null;
      totalRow.getCell(col + 2).numFmt = numFmt;
      col += 3;
    }

    totalRow.getCell(lastCol).value =
      report.totals.totalBungaCurrentYear || null;
    totalRow.getCell(lastCol).numFmt = numFmt;

    // Style totals row
    for (let c = 1; c <= totalCols; c++) {
      totalRow.getCell(c).font = { bold: true };
      totalRow.getCell(c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF2CC' },
      };
      totalRow.getCell(c).border = border;
    }

    return workbook;
  }

  // ---- Private Query Methods ----

  private async queryInstallmentsForYear(year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    return this.prisma.loanInstallment.findMany({
      where: {
        dueDate: { gte: startDate, lte: endDate },
        loanApplication: {
          status: { in: ['DISBURSED', 'COMPLETED'] },
        },
      },
      include: {
        loanApplication: {
          select: {
            id: true,
            loanType: true,
            loanAmount: true,
            loanTenor: true,
            interestRate: true,
            monthlyInstallment: true,
            totalRepayment: true,
            disbursedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                employee: {
                  select: {
                    employeeNumber: true,
                    fullName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ dueDate: 'asc' }],
    });
  }

  // ---- Calculation Helpers ----

  /**
   * Calculate per-installment breakdown using the flat-rate interest model
   * (matching loan-calculation.service.ts formula)
   */
  private calculateInstallmentBreakdown(
    loan: {
      loanAmount: Prisma.Decimal;
      loanTenor: number;
      interestRate: Prisma.Decimal | null;
      monthlyInstallment: Prisma.Decimal | null;
      totalRepayment: Prisma.Decimal | null;
    },
    installment: {
      installmentNumber: number;
      amount: Prisma.Decimal;
    },
  ): { bunga: number; angsuran: number; sisaPinjaman: number } {
    const loanAmount = this.toNumber(loan.loanAmount);
    const annualRate = this.toNumber(loan.interestRate || 0);
    const tenor = loan.loanTenor;
    const angsuran = this.toNumber(installment.amount);

    // Flat-rate interest: totalInterest = loanAmount × rate% × (tenor/12)
    const totalInterest = loanAmount * (annualRate / 100) * (tenor / 12);
    const monthlyBunga =
      tenor > 0 ? Math.round((totalInterest / tenor) * 100) / 100 : 0;

    // Principal per month = monthlyInstallment - monthlyBunga
    const monthlyPrincipal = angsuran - monthlyBunga;

    // Remaining balance after this installment
    const sisaPinjaman = Math.max(
      0,
      Math.round(
        (loanAmount - installment.installmentNumber * monthlyPrincipal) * 100,
      ) / 100,
    );

    return {
      bunga: Math.round(monthlyBunga * 100) / 100,
      angsuran: Math.round(angsuran * 100) / 100,
      sisaPinjaman,
    };
  }

  private calculateTotals(
    rows: ReportRow[],
    months: MonthMeta[],
  ): ReportTotals {
    const monthlyTotals: Record<string, MonthlyLoanData> = {};
    for (const month of months) {
      monthlyTotals[month.key] = { sisaPinjaman: 0, bunga: 0, angsuran: 0 };
    }

    let totalBungaPrevYear = 0;
    let totalBungaCurrentYear = 0;

    for (const row of rows) {
      totalBungaPrevYear += row.totalBungaPrevYear;
      totalBungaCurrentYear += row.totalBungaCurrentYear;

      for (const month of months) {
        const md = row.monthlyData[month.key];
        if (md) {
          monthlyTotals[month.key].sisaPinjaman += md.sisaPinjaman;
          monthlyTotals[month.key].bunga += md.bunga;
          monthlyTotals[month.key].angsuran += md.angsuran;
        }
      }
    }

    return { totalBungaPrevYear, monthlyTotals, totalBungaCurrentYear };
  }

  private toNumber(value: Prisma.Decimal | number | string | null): number {
    if (value === null || value === undefined) return 0;
    if (value instanceof Prisma.Decimal) return value.toNumber();
    if (typeof value === 'string') return parseFloat(value) || 0;
    return value || 0;
  }
}
