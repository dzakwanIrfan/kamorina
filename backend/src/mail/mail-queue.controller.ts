import {
    Controller,
    Get,
    Post,
    UseGuards,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MailQueueService } from './mail-queue.service';

/**
 * Admin controller untuk monitoring email queue
 * Hanya bisa diakses oleh admin
 */
@ApiTags('Email Queue Admin')
@Controller('admin/mail-queue')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MailQueueController {
    constructor(private readonly mailQueueService: MailQueueService) { }

    /**
     * Get status queue (jumlah email yang menunggu, aktif, dll)
     */
    @Get('status')
    @Roles('admin')
    @ApiOperation({ summary: 'Get email queue status' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Queue status retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                waiting: { type: 'number', description: 'Jobs waiting to be processed' },
                active: { type: 'number', description: 'Jobs currently being processed' },
                completed: { type: 'number', description: 'Jobs completed successfully' },
                failed: { type: 'number', description: 'Jobs that failed all retries' },
                delayed: { type: 'number', description: 'Jobs scheduled for later' },
                total: { type: 'number', description: 'Total pending jobs' },
            },
        },
    })
    async getStatus() {
        return this.mailQueueService.getQueueStatus();
    }

    /**
     * Pause queue (untuk maintenance)
     */
    @Post('pause')
    @Roles('admin')
    @ApiOperation({ summary: 'Pause email queue' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Queue paused successfully',
    })
    async pauseQueue() {
        await this.mailQueueService.pauseQueue();
        return { message: 'Email queue paused' };
    }

    /**
     * Resume queue
     */
    @Post('resume')
    @Roles('admin')
    @ApiOperation({ summary: 'Resume email queue' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Queue resumed successfully',
    })
    async resumeQueue() {
        await this.mailQueueService.resumeQueue();
        return { message: 'Email queue resumed' };
    }

    /**
     * Clean old jobs
     */
    @Post('clean')
    @Roles('admin')
    @ApiOperation({ summary: 'Clean old completed and failed jobs' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Old jobs cleaned successfully',
    })
    async cleanJobs() {
        await this.mailQueueService.cleanOldJobs();
        return { message: 'Old jobs cleaned successfully' };
    }
}
