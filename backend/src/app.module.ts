// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { LevelsModule } from './levels/levels.module';
import { DepartmentsModule } from './departments/departments.module';
import { MemberApplicationModule } from './member-application/member-application.module';
import { EmployeeModule } from './employees/employees.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    MailModule,
    AuthModule,
    LevelsModule,
    DepartmentsModule,
    MemberApplicationModule,
    EmployeeModule,
  ],
})
export class AppModule {}