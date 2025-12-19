import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { MailQueueService } from './mail-queue.service';
import { MailProcessor } from './mail.processor';
import { MailQueueController } from './mail-queue.controller';
import { EMAIL_QUEUE_NAME } from './mail.types';
import { EnvironmentVariables } from '../config/env.config';

@Module({
  imports: [
    // Register BullMQ dengan Redis connection
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentVariables>) => ({
        connection: {
          host: configService.get('REDIS_HOST', { infer: true }) || 'localhost',
          port: configService.get('REDIS_PORT', { infer: true }) || 6379,
          password: configService.get('REDIS_PASSWORD', { infer: true }) || undefined,
        },
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: {
            age: 24 * 3600,
            count: 1000,
          },
          removeOnFail: {
            age: 7 * 24 * 3600,
          },
        },
      }),
    }),
    // Register email queue
    BullModule.registerQueue({
      name: EMAIL_QUEUE_NAME,
    }),
  ],
  controllers: [MailQueueController],
  providers: [
    MailService,
    MailQueueService,
    MailProcessor,
  ],
  exports: [
    MailService,
    MailQueueService,
    BullModule,
  ],
})
export class MailModule { }