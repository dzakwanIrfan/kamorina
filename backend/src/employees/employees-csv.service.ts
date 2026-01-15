import { Injectable } from '@nestjs/common';
import { parse, unparse } from 'papaparse';

export interface EmployeeCSVRow {
  employeeNumber: string;
  fullName: string;
  departmentName: string;
  golonganName: string;
  employeeType: string;
  permanentEmployeeDate?: string;
  bankAccountNumber: string;
  bankAccountName: string;
  isActive: string;
}

@Injectable()
export class EmployeeCsvService {
  /**
   * Convert employees data to CSV string
   */
  exportToCSV(employees: any[]): string {
    const csvData: EmployeeCSVRow[] = employees.map((employee) => ({
      employeeNumber: employee.employeeNumber,
      fullName: employee.fullName,
      departmentName: employee.department?.departmentName || '',
      golonganName: employee.golongan?.golonganName || '',
      employeeType: this.getEmployeeTypeLabel(employee.employeeType),
      permanentEmployeeDate: employee.permanentEmployeeDate
        ? new Date(employee.permanentEmployeeDate).toISOString().split('T')[0]
        : '',
      bankAccountNumber: employee.bankAccountNumber,
      bankAccountName: employee.bankAccountName,
      isActive: employee.isActive ? 'Aktif' : 'Tidak Aktif',
    }));

    const csv = unparse(csvData, {
      columns: [
        'employeeNumber',
        'fullName',
        'departmentName',
        'golonganName',
        'employeeType',
        'bankAccountNumber',
        'isActive',
      ],
      header: true,
    });

    return csv;
  }

  /**
   * Generate CSV template for import
   */
  generateTemplate(): string {
    const template: EmployeeCSVRow[] = [
      {
        employeeNumber: '123456789',
        fullName: 'John Doe',
        departmentName: 'MDP',
        golonganName: 'I',
        employeeType: 'Tetap',
        permanentEmployeeDate: '2021-01-01',
        bankAccountNumber: '1234567890',
        bankAccountName: 'BCA',
        isActive: 'Aktif',
      },
      {
        employeeNumber: 'K987654321',
        fullName: 'Jane Smith',
        departmentName: 'Finance',
        golonganName: 'II',
        employeeType: 'Kontrak',
        permanentEmployeeDate: '',
        bankAccountNumber: '0987654321',
        bankAccountName: 'BNI',
        isActive: 'Aktif',
      },
    ];

    const csv = unparse(template, {
      columns: [
        'employeeNumber',
        'fullName',
        'departmentName',
        'golonganName',
        'permanentEmployeeDate',
        'bankAccountNumber',
        'bankAccountName',
        'employeeType',
        'isActive',
      ],
      header: true,
    });

    return csv;
  }

  /**
   * Parse CSV file content to employee data
   */
  parseCSV(csvContent: string): EmployeeCSVRow[] {
    const result = parse<EmployeeCSVRow>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        const headerMap: Record<string, string> = {
          employeenumber: 'employeeNumber',
          employee_number: 'employeeNumber',
          'Nomor Induk Karyawan': 'employeeNumber',
          fullname: 'fullName',
          full_name: 'fullName',
          'nama lengkap': 'fullName',
          departmentname: 'departmentName',
          department_name: 'departmentName',
          department: 'departmentName',
          dept: 'departmentName',
          golonganname: 'golonganName',
          golongan_name: 'golonganName',
          golongan: 'golonganName',
          employeetype: 'employeeType',
          employee_type: 'employeeType',
          'tipe karyawan': 'employeeType',
          tipe: 'employeeType',
          'tanggal permanen': 'permanentEmployeeDate',
          permanentemployeedate: 'permanentEmployeeDate',
          permanent_employee_date: 'permanentEmployeeDate',
          isactive: 'isActive',
          is_active: 'isActive',
          status: 'isActive',
          nomor_rekening_bank: 'bankAccountNumber',
          bankaccountnumber: 'bankAccountNumber',
          bank_account_number: 'bankAccountNumber',
          'nomor rekening bank': 'bankAccountNumber',
        };

        const normalizedHeader = header.toLowerCase().trim();
        return headerMap[normalizedHeader] || header;
      },
    });

    if (result.errors.length > 0) {
      throw new Error(`CSV parsing error: ${result.errors[0].message}`);
    }

    return result.data;
  }

  /**
   * Validate CSV data
   */
  validateCSVData(data: EmployeeCSVRow[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because index starts at 0 and we skip header

      // Validate employee number
      if (!row.employeeNumber || row.employeeNumber.trim() === '') {
        errors.push(
          `Baris ${rowNumber}: Nomor Induk Karyawan tidak boleh kosong`,
        );
      } else if (!/^[K]?[0-9]+$/.test(row.employeeNumber.trim())) {
        errors.push(
          `Baris ${rowNumber}: Nomor Induk Karyawan maksimal 10 digit angka`,
        );
      }

      // Validate full name
      if (!row.fullName || row.fullName.trim() === '') {
        errors.push(`Baris ${rowNumber}: Nama lengkap tidak boleh kosong`);
      }

      // Validate department name
      if (!row.departmentName || row.departmentName.trim() === '') {
        errors.push(`Baris ${rowNumber}: Department tidak boleh kosong`);
      }

      // Validate golongan name
      if (!row.golonganName || row.golonganName.trim() === '') {
        errors.push(`Baris ${rowNumber}: Golongan tidak boleh kosong`);
      }

      // Validate employee type
      if (!row.employeeType || row.employeeType.trim() === '') {
        errors.push(`Baris ${rowNumber}: Tipe karyawan tidak boleh kosong`);
      } else {
        const normalizedType = row.employeeType.toLowerCase().trim();
        if (
          ![
            'pegawai tetap',
            'tetap',
            'kontrak',
            'probation',
            'permanent',
            'contract',
            'probation',
          ].includes(normalizedType)
        ) {
          errors.push(
            `Baris ${rowNumber}: Tipe karyawan harus "Tetap" atau "Kontrak"`,
          );
        }
      }

      // Validate permanent employee date
      if (row.permanentEmployeeDate) {
        const date = new Date(row.permanentEmployeeDate);
        if (isNaN(date.getTime())) {
          errors.push(`Baris ${rowNumber}: Tanggal permanen harus valid`);
        }
      }

      // Validate bank account number
      if (!row.bankAccountNumber || row.bankAccountNumber.trim() === '') {
        errors.push(
          `Baris ${rowNumber}: Nomor Rekening Bank tidak boleh kosong`,
        );
      }

      // Validate bank account name
      if (!row.bankAccountName || row.bankAccountName.trim() === '') {
        errors.push(
          `Baris ${rowNumber}: Nama Rekening Bank tidak boleh kosong`,
        );
      }

      // Validate isActive
      if (row.isActive) {
        const normalizedStatus = row.isActive.toLowerCase().trim();
        if (
          !['aktif', 'tidak aktif', 'true', 'false', '1', '0'].includes(
            normalizedStatus,
          )
        ) {
          errors.push(
            `Baris ${rowNumber}: Status harus "Aktif" atau "Tidak Aktif"`,
          );
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convert CSV row to CreateEmployeeDto format
   */
  convertToEmployeeDto(row: EmployeeCSVRow) {
    const normalizedStatus = row.isActive?.toLowerCase().trim();
    const isActive = ['aktif', 'true', '1'].includes(normalizedStatus);

    // Parse permanentEmployeeDate if present
    let permanentEmployeeDate: string | undefined;
    if (row.permanentEmployeeDate && row.permanentEmployeeDate.trim() !== '') {
      const date = new Date(row.permanentEmployeeDate);
      if (!isNaN(date.getTime())) {
        permanentEmployeeDate = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      }
    }

    return {
      employeeNumber: row.employeeNumber.trim(),
      fullName: row.fullName.trim(),
      departmentName: row.departmentName.trim(),
      golonganName: row.golonganName.trim(),
      employeeType: this.parseEmployeeType(row.employeeType),
      permanentEmployeeDate,
      bankAccountNumber: row.bankAccountNumber?.trim(),
      bankAccountName: row.bankAccountName?.trim(),
      isActive,
    };
  }

  /**
   * Parse employee type from CSV
   */
  private parseEmployeeType(type: string): string {
    const normalized = type.toLowerCase().trim();
    const typeMap: Record<string, string> = {
      'pegawai tetap': 'TETAP',
      permanent: 'TETAP',
      tetap: 'TETAP',
      kontrak: 'KONTRAK',
      contract: 'KONTRAK',
    };

    return typeMap[normalized] || 'TETAP';
  }

  /**
   * Get employee type label for export
   */
  private getEmployeeTypeLabel(type: string): string {
    const labelMap: Record<string, string> = {
      TETAP: 'Pegawai Tetap',
      KONTRAK: 'Kontrak',
    };

    return labelMap[type] || type;
  }
}
