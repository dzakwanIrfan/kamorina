// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LevelsModule } from './levels/levels.module';
import { DepartmentsModule } from './departments/departments.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    MailModule,
    AuthModule,
    UsersModule,
    LevelsModule,
    DepartmentsModule,
  ],
})
export class AppModule {}