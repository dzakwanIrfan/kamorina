import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    Delete,
} from '@nestjs/common';
import { DepositWithdrawalService } from './deposit-withdrawal.service';
import { CreateDepositWithdrawalDto } from './dto/withdrawal/create-withdrawal.dto';
import { ApproveWithdrawalDto } from './dto/withdrawal/approve-withdrawal.dto';
import { ConfirmDisbursementDto } from './dto/withdrawal/confirm-disbursement.dto';
import { ConfirmAuthorizationDto } from './dto/withdrawal/confirm-authorization.dto';
import { QueryWithdrawalDto } from './dto/withdrawal/query-withdrawal.dto';
import { BulkApproveWithdrawalDto } from './dto/withdrawal/bulk-approve-withdrawal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { ICurrentUser } from 'src/auth/interfaces/current-user.interface';

@Controller('deposit-withdrawals')
@UseGuards(JwtAuthGuard)
export class DepositWithdrawalController {
    constructor(
        private readonly depositWithdrawalService: DepositWithdrawalService,
    ) { }

    // MEMBER ENDPOINTS

    /**
     * Create withdrawal request
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createWithdrawal(
        @CurrentUser() user: ICurrentUser,
        @Body() dto: CreateDepositWithdrawalDto,
    ) {
        return this.depositWithdrawalService.createWithdrawal(user.id, dto);
    }

    /**
     * Get my withdrawals
     */
    @Get('my-withdrawals')
    @HttpCode(HttpStatus.OK)
    async getMyWithdrawals(
        @CurrentUser() user: ICurrentUser,
        @Query() query: QueryWithdrawalDto,
    ) {
        return this.depositWithdrawalService.getMyWithdrawals(user.id, query);
    }

    /**
     * Get my withdrawal by ID
     */
    @Get('my-withdrawals/:id')
    @HttpCode(HttpStatus.OK)
    async getMyWithdrawalById(
        @CurrentUser() user: ICurrentUser,
        @Param('id') id: string,
    ) {
        return this.depositWithdrawalService.getWithdrawalById(id, user.id);
    }

    /**
     * Cancel withdrawal
     */
    @Delete('my-withdrawals/:id')
    @HttpCode(HttpStatus.OK)
    async cancelWithdrawal(
        @CurrentUser() user: ICurrentUser,
        @Param('id') id: string,
    ) {
        return this.depositWithdrawalService.cancelWithdrawal(user.id, id);
    }

    // APPROVER ENDPOINTS (DSP, Ketua)

    /**
     * Get all withdrawals (for approvers)
     */
    @Get()
    @UseGuards(RolesGuard)
    @Roles('ketua', 'divisi_simpan_pinjam')
    @HttpCode(HttpStatus.OK)
    async getAllWithdrawals(@Query() query: QueryWithdrawalDto) {
        return this.depositWithdrawalService.getAllWithdrawals(query);
    }

    /**
     * Get withdrawal by ID (for approvers)
     */
    @Get(':id')
    @UseGuards(RolesGuard)
    @Roles('ketua', 'divisi_simpan_pinjam', 'shopkeeper')
    @HttpCode(HttpStatus.OK)
    async getWithdrawalById(@Param('id') id: string) {
        return this.depositWithdrawalService.getWithdrawalById(id);
    }

    /**
     * Process approval (single)
     */
    @Post(':id/approve')
    @UseGuards(RolesGuard)
    @Roles('ketua', 'divisi_simpan_pinjam')
    @HttpCode(HttpStatus.OK)
    async processApproval(
        @Param('id') id: string,
        @CurrentUser() user: ICurrentUser,
        @Body() dto: ApproveWithdrawalDto,
    ) {
        return this.depositWithdrawalService.processApproval(
            id,
            user.id,
            user.roles,
            dto,
        );
    }

    /**
     * Bulk approve/reject
     */
    @Post('bulk-approve')
    @UseGuards(RolesGuard)
    @Roles('ketua', 'divisi_simpan_pinjam')
    @HttpCode(HttpStatus.OK)
    async bulkProcessApproval(
        @CurrentUser() user: ICurrentUser,
        @Body() dto: BulkApproveWithdrawalDto,
    ) {
        return this.depositWithdrawalService.bulkProcessApproval(
            user.id,
            user.roles,
            dto,
        );
    }

    // SHOPKEEPER ENDPOINTS

    /**
     * Confirm disbursement
     */
    @Post(':id/confirm-disbursement')
    @UseGuards(RolesGuard)
    @Roles('shopkeeper')
    @HttpCode(HttpStatus.OK)
    async confirmDisbursement(
        @Param('id') id: string,
        @CurrentUser() user: ICurrentUser,
        @Body() dto: ConfirmDisbursementDto,
    ) {
        return this.depositWithdrawalService.confirmDisbursement(
            id,
            user.id,
            dto,
        );
    }

    // KETUA AUTHORIZATION ENDPOINTS

    /**
     * Confirm authorization (final step)
     */
    @Post(':id/confirm-authorization')
    @UseGuards(RolesGuard)
    @Roles('ketua')
    @HttpCode(HttpStatus.OK)
    async confirmAuthorization(
        @Param('id') id: string,
        @CurrentUser() user: ICurrentUser,
        @Body() dto: ConfirmAuthorizationDto,
    ) {
        return this.depositWithdrawalService.confirmAuthorization(
            id,
            user.id,
            dto,
        );
    }
}