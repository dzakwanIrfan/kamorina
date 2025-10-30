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
} from '@nestjs/common';
import { EmployeeService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

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
  findAll(@Query() query: QueryEmployeeDto) {
    return this.employeeService.findAll(query);
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