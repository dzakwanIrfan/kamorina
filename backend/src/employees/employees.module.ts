import { Module } from '@nestjs/common';
import { EmployeeService } from './employees.service';
import { EmployeeController } from './employees.controller';

@Module({
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeeModule {}