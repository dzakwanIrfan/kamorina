import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { LevelsModule } from './levels/levels.module';
import { DepartmentsModule } from './departments/departments.module';
import { MemberApplicationModule } from './member-application/member-application.module';
import { EmployeeModule } from './employees/employees.module';
import { GolonganModule } from './golongan/golongan.module';
import { SettingsModule } from './settings/settings.module';
import { UploadModule } from './upload/upload.module';
import { ProfileModule } from './profile/profile.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { LoanModule } from './loan/loan.module';
import { DepositModule } from './deposit/deposit.module';
import { PayrollModule } from './payroll/payroll.module';

@Module({
  imports: [
    ConfigModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'), // Perbaiki path ini
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false, // Disable directory index
        fallthrough: true,
      },
    }),
    PrismaModule,
    MailModule,
    AuthModule,
    LevelsModule,
    DepartmentsModule,
    MemberApplicationModule,
    EmployeeModule,
    GolonganModule,
    SettingsModule,
    UploadModule,
    ProfileModule,
    LoanModule,
    DepositModule,
    PayrollModule,
  ],
})
export class AppModule {}