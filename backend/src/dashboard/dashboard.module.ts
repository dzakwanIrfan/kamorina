import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    /**
     * Cache Module Configuration for Redis
     * Uses CACHE_MANAGER injection token for dashboard chart data caching
     * TTL is controlled per-cache-key in the service (10 minutes for chart data)
     */
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // Default to in-memory cache if Redis is not configured
        // In production, this should be replaced with redis store
        store: 'memory',
        ttl: 600, // Default 10 minutes TTL in seconds
        max: 100, // Maximum number of items in cache
      }),
    }),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
