import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { EmployeeService } from './employees.service';
import { EmployeeController } from './employees.controller';
import { EmployeeCsvService } from './employees-csv.service';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService, EmployeeCsvService],
  exports: [EmployeeService],
})
export class EmployeeModule {}