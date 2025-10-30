import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response, Express } from 'express';
import { EmployeeService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { EmployeeCsvService } from './employees-csv.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeeController {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly csvService: EmployeeCsvService,
  ) {}

  /**
   * Create a new employee
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam', 'pengawas')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeeService.create(createEmployeeDto);
  }

  /**
   * Get all employees with pagination and filters
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam', 'pengawas', 'bendahara', 'payroll')
  @HttpCode(HttpStatus.OK)
  findAll(@Query(new ValidationPipe({ transform: true })) query: QueryEmployeeDto) {
    return this.employeeService.findAll(query);
  }

  /**
   * Export employees to CSV
   */
  @Get('export/csv')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam', 'pengawas', 'bendahara', 'payroll')
  @HttpCode(HttpStatus.OK)
  async exportCSV(@Query() query: QueryEmployeeDto, @Res() res: Response) {
    // Get all employees without pagination
    const result = await this.employeeService.findAll({
      ...query,
      page: 1,
      limit: 999999, // Get all records
    });

    const csv = this.csvService.exportToCSV(result.data);
    const filename = `employees-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  /**
   * Download CSV template
   */
  @Get('template/csv')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam', 'pengawas')
  @HttpCode(HttpStatus.OK)
  downloadTemplate(@Res() res: Response) {
    const csv = this.csvService.generateTemplate();
    const filename = 'employee-template.csv';

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  /**
   * Import employees from CSV
   */
  @Post('import/csv')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam', 'pengawas')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async importCSV(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File CSV tidak ditemukan');
    }

    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      throw new BadRequestException('File harus berformat CSV');
    }

    try {
      const csvContent = file.buffer.toString('utf-8');
      const parsedData = this.csvService.parseCSV(csvContent);

      // Validate data
      const validation = this.csvService.validateCSVData(parsedData);
      if (!validation.valid) {
        return {
          success: false,
          message: 'Validasi CSV gagal',
          errors: validation.errors,
        };
      }

      // Import data
      const results = await this.employeeService.importFromCSV(parsedData, this.csvService);

      return {
        success: true,
        message: 'Import berhasil',
        data: results,
      };
    } catch (error) {
      throw new BadRequestException(`Gagal memproses file CSV: ${error.message}`);
    }
  }

  /**
   * Get employee by ID
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam', 'pengawas', 'bendahara', 'payroll')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.employeeService.findOne(id);
  }

  /**
   * Update employee
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam', 'pengawas')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    return this.employeeService.update(id, updateEmployeeDto);
  }

  /**
   * Toggle employee active status
   */
  @Patch(':id/toggle-active')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam', 'pengawas')
  @HttpCode(HttpStatus.OK)
  toggleActive(@Param('id') id: string) {
    return this.employeeService.toggleActive(id);
  }

  /**
   * Delete employee
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.employeeService.remove(id);
  }
}