import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

@Injectable()
export class BukuTabunganExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportToExcel(userId: string): Promise<Buffer> {
    // Fetch account data
    const account = await this.prisma.savingsAccount.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            employee: {
              select: {
                employeeNumber: true,
                fullName: true,
                department: {
                  select: {
                    departmentName: true,
                  },
                },
                golongan: {
                  select: {
                    golonganName: true,
                  },
                },
              },
            },
          },
        },
        transactions: {
          include: {
            payrollPeriod: true,
          },
          orderBy: {
            transactionDate: 'asc',
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Buku tabungan tidak ditemukan');
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Buku Tabungan');

    // Set column widths
    worksheet.columns = [
      { width: 12 }, // TANGGAL (was col 2)
      { width: 15 }, // IURAN PENDAFTARAN (was col 3)
      { width: 15 }, // IURAN TETAP (was col 4)
      { width: 15 }, // TABUNGAN DEPOSITO (was col 5)
      { width: 12 }, // SHU (was col 6)
      { width: 12 }, // PENARIKAN (was col 7)
      { width: 15 }, // JML TAB. PASIF (was col 8)
      { width: 15 }, // SALDO (was col 10)
      { width: 12 }, // BUNGA (was col 11)
      { width: 12 }, // JML BUNGA (was col 12)
    ];

    // Add header metadata
    this.addHeaderMetadata(worksheet, account);

    // Add table header
    this.addTableHeader(worksheet);

    // Add transaction data
    this.addTransactionData(worksheet, account);

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private addHeaderMetadata(worksheet: ExcelJS.Worksheet, account: any): void {
    const userName = account.user.employee?.fullName || account.user.name || '';
    const department = account.user.employee?.department?.departmentName || '-';
    const employeeNumber = account.user.employee?.employeeNumber || '-';

    // Row 1: Title
    worksheet.mergeCells('A1:J1'); // Adjusted for 10 columns
    const titleRow = worksheet.getCell('A1');
    titleRow.value = 'BUKU TABUNGAN ANGGOTA';
    titleRow.font = { bold: true, size: 16 };
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 25;

    // Row 2: Subtitle
    worksheet.mergeCells('A2:J2'); // Adjusted for 10 columns
    const subtitleRow = worksheet.getCell('A2');
    subtitleRow.value = 'KOPERASI SURYA NIAGA KAMORINA';
    subtitleRow.font = { bold: true, size: 12 };
    subtitleRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // Row 3: Empty
    worksheet.getRow(3).height = 10;

    // Row 4: NAMA
    worksheet.getCell('A4').value = 'NAMA';
    worksheet.getCell('A4').font = { bold: true };
    // Removed colon in B4, merge B4:E4 for value
    worksheet.mergeCells('B4:E4');
    worksheet.getCell('B4').value = userName;

    // Row 5: DEPARTEMEN
    worksheet.getCell('A5').value = 'DEPARTEMEN';
    worksheet.getCell('A5').font = { bold: true };
    // Removed colon in B5, merge B5:E5
    worksheet.mergeCells('B5:E5');
    worksheet.getCell('B5').value = department;

    // Row 6: NO. ANGGOTA
    worksheet.getCell('A6').value = 'NO. ANGGOTA';
    worksheet.getCell('A6').font = { bold: true };
    // Removed colon in B6, merge B6:E6
    worksheet.mergeCells('B6:E6');
    worksheet.getCell('B6').value = employeeNumber;

    // Row 7: BUNGA
    worksheet.getCell('A7').value = 'BUNGA';
    worksheet.getCell('A7').font = { bold: true };
    worksheet.mergeCells('B7:E7');
    const interestRate = account.transactions[0]?.interestRate || 0;
    worksheet.getCell('B7').value = `${interestRate}% Per Tahun`;

    // Row 8: Empty
    worksheet.getRow(8).height = 10;
  }

  private addTableHeader(worksheet: ExcelJS.Worksheet): void {
    const headerRow = worksheet.getRow(9);
    const headers = [
      'TANGGAL',
      'IURAN PENDAFTARAN',
      'IURAN TETAP (BULANAN)',
      'TABUNGAN DEPOSITO',
      'SHU',
      'PENARIKAN',
      'JML TAB. PASIF',
      // 'JML TABUNGAN', // Removed
      'SALDO',
      'BUNGA',
      'JML BUNGA',
    ];

    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, size: 10 };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    headerRow.height = 40;
  }

  private addTransactionData(worksheet: ExcelJS.Worksheet, account: any): void {
    let rowIndex = 10;
    let runningBalance = 0;
    let totalPassiveSavings = 0;

    account.transactions.forEach((transaction: any) => {
      const row = worksheet.getRow(rowIndex);

      // Calculate values
      const iuranPendaftaran = Number(transaction.iuranPendaftaran) || 0;
      const iuranBulanan = Number(transaction.iuranBulanan) || 0;
      const tabunganDeposito = Number(transaction.tabunganDeposito) || 0;
      const shu = Number(transaction.shu) || 0;
      const penarikan = Number(transaction.penarikan) || 0;
      const bunga = Number(transaction.bunga) || 0;
      const jumlahBunga = Number(transaction.jumlahBunga) || 0;

      // Calculate passive savings (Iuran Pendaftaran + Iuran Bulanan)
      const passiveSavings = iuranPendaftaran + iuranBulanan;
      totalPassiveSavings += passiveSavings;

      // Calculate total savings (all credits)
      const totalSavings =
        iuranPendaftaran + iuranBulanan + tabunganDeposito + shu + bunga;

      // Calculate running balance
      runningBalance += totalSavings - penarikan;

      // TANGGAL (Col 1)
      row.getCell(1).value = format(
        new Date(transaction.transactionDate),
        'dd/MM/yyyy',
        { locale: localeId },
      );
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

      // IURAN PENDAFTARAN (Col 2)
      row.getCell(2).value = iuranPendaftaran || '';
      row.getCell(2).numFmt = '#,##0';
      row.getCell(2).alignment = { horizontal: 'right', vertical: 'middle' };

      // IURAN TETAP (BULANAN) (Col 3)
      row.getCell(3).value = iuranBulanan || '';
      row.getCell(3).numFmt = '#,##0';
      row.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };

      // TABUNGAN DEPOSITO (Col 4)
      row.getCell(4).value = tabunganDeposito || '';
      row.getCell(4).numFmt = '#,##0';
      row.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };

      // SHU (Col 5)
      row.getCell(5).value = shu || '';
      row.getCell(5).numFmt = '#,##0';
      row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };

      // PENARIKAN (Col 6)
      row.getCell(6).value = penarikan || '';
      row.getCell(6).numFmt = '#,##0';
      row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };

      // JML TAB. PASIF (Col 7)
      row.getCell(7).value = totalPassiveSavings;
      row.getCell(7).numFmt = '#,##0';
      row.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };

      // JML TABUNGAN Removed

      // SALDO (Col 8)
      row.getCell(8).value = runningBalance;
      row.getCell(8).numFmt = '#,##0';
      row.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(8).font = { bold: true };

      // BUNGA (Col 9)
      row.getCell(9).value = bunga || '';
      row.getCell(9).numFmt = '#,##0';
      row.getCell(9).alignment = { horizontal: 'right', vertical: 'middle' };

      // JML BUNGA (Col 10)
      row.getCell(10).value = jumlahBunga || '';
      row.getCell(10).numFmt = '#,##0';
      row.getCell(10).alignment = { horizontal: 'right', vertical: 'middle' };

      // Add borders
      for (let i = 1; i <= 10; i++) {
        row.getCell(i).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      }

      rowIndex++;
    });
  }
}
