import { Injectable } from '@nestjs/common';
import { parse, unparse } from 'papaparse';

export interface EmployeeCSVRow {
  employeeNumber: string;
  fullName: string;
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
      isActive: employee.isActive ? 'Aktif' : 'Tidak Aktif',
    }));

    const csv = unparse(csvData, {
      columns: ['employeeNumber', 'fullName', 'isActive'],
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
        isActive: 'Aktif',
      },
      {
        employeeNumber: '987654321',
        fullName: 'Jane Smith',
        isActive: 'Tidak Aktif',
      },
    ];

    const csv = unparse(template, {
      columns: ['employeeNumber', 'fullName', 'isActive'],
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
        // Normalize header names
        const headerMap: Record<string, string> = {
          'employeenumber': 'employeeNumber',
          'employee_number': 'employeeNumber',
          'nomor karyawan': 'employeeNumber',
          'fullname': 'fullName',
          'full_name': 'fullName',
          'nama lengkap': 'fullName',
          'isactive': 'isActive',
          'is_active': 'isActive',
          'status': 'isActive',
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
  validateCSVData(data: EmployeeCSVRow[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because index starts at 0 and we skip header

      // Validate employee number
      if (!row.employeeNumber || row.employeeNumber.trim() === '') {
        errors.push(`Baris ${rowNumber}: Nomor karyawan tidak boleh kosong`);
      } else if (!/^\d{9}$/.test(row.employeeNumber.trim())) {
        errors.push(`Baris ${rowNumber}: Nomor karyawan harus 9 digit angka`);
      }

      // Validate full name
      if (!row.fullName || row.fullName.trim() === '') {
        errors.push(`Baris ${rowNumber}: Nama lengkap tidak boleh kosong`);
      }

      // Validate isActive
      if (row.isActive) {
        const normalizedStatus = row.isActive.toLowerCase().trim();
        if (!['aktif', 'tidak aktif', 'true', 'false', '1', '0'].includes(normalizedStatus)) {
          errors.push(`Baris ${rowNumber}: Status harus "Aktif" atau "Tidak Aktif"`);
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

    return {
      employeeNumber: row.employeeNumber.trim(),
      fullName: row.fullName.trim(),
      isActive,
    };
  }
}