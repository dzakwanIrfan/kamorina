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
import { SavingsWithdrawalService } from './savings-withdrawal.service';
import { CreateSavingsWithdrawalDto } from './dto/withdrawal/create-savings-withdrawal.dto';
import { ApproveSavingsWithdrawalDto } from './dto/withdrawal/approve-savings-withdrawal.dto';
import { ConfirmDisbursementDto } from './dto/withdrawal/confirm-disbursement.dto';
import { ConfirmAuthorizationDto } from './dto/withdrawal/confirm-authorization.dto';
import { QuerySavingsWithdrawalDto } from './dto/withdrawal/query-savings-withdrawal.dto';
import { BulkApproveSavingsWithdrawalDto } from './dto/withdrawal/bulk-approve-savings-withdrawal.dto';
import { BulkConfirmDisbursementDto } from './dto/withdrawal/bulk-confirm-disbursement.dto';
import { BulkConfirmAuthorizationDto } from './dto/withdrawal/bulk-confirm-authorization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { ICurrentUser } from 'src/auth/interfaces/current-user.interface';

@Controller('savings-withdrawals')
@UseGuards(JwtAuthGuard)
export class SavingsWithdrawalController {
    constructor(
        private readonly savingsWithdrawalService: SavingsWithdrawalService,
    ) { }

    // MEMBER ENDPOINTS

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createWithdrawal(
        @CurrentUser() user: ICurrentUser,
        @Body() dto: CreateSavingsWithdrawalDto,
    ) {
        return this.savingsWithdrawalService.createWithdrawal(user.id, dto);
    }

    @Get('my-withdrawals')
    @HttpCode(HttpStatus.OK)
    async getMyWithdrawals(
        @CurrentUser() user: ICurrentUser,
        @Query() query: QuerySavingsWithdrawalDto,
    ) {
        return this.savingsWithdrawalService.getMyWithdrawals(user.id, query);
    }

    @Get('my-withdrawals/:id')
    @HttpCode(HttpStatus.OK)
    async getMyWithdrawalById(
        @CurrentUser() user: ICurrentUser,
        @Param('id') id: string,
    ) {
        return this.savingsWithdrawalService.getWithdrawalById(id, user.id);
    }

    @Delete('my-withdrawals/:id')
    @HttpCode(HttpStatus.OK)
    async cancelWithdrawal(
        @CurrentUser() user: ICurrentUser,
        @Param('id') id: string,
    ) {
        return this.savingsWithdrawalService.cancelWithdrawal(user.id, id);
    }

    // APPROVER ENDPOINTS (DSP, Ketua)

    @Get()
    @UseGuards(RolesGuard)
    @Roles('ketua', 'divisi_simpan_pinjam', 'shopkeeper')
    @HttpCode(HttpStatus.OK)
    async getAllWithdrawals(@Query() query: QuerySavingsWithdrawalDto) {
        return this.savingsWithdrawalService.getAllWithdrawals(query);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async getWithdrawalById(@Param('id') id: string) {
        return this.savingsWithdrawalService.getWithdrawalById(id);
    }

    @Post(':id/approve')
    @UseGuards(RolesGuard)
    @Roles('ketua', 'divisi_simpan_pinjam')
    @HttpCode(HttpStatus.OK)
    async processApproval(
        @Param('id') id: string,
        @CurrentUser() user: ICurrentUser,
        @Body() dto: ApproveSavingsWithdrawalDto,
    ) {
        return this.savingsWithdrawalService.processApproval(
            id,
            user.id,
            user.roles,
            dto,
        );
    }

    @Post('bulk-approve')
    @UseGuards(RolesGuard)
    @Roles('ketua', 'divisi_simpan_pinjam')
    @HttpCode(HttpStatus.OK)
    async bulkProcessApproval(
        @CurrentUser() user: ICurrentUser,
        @Body() dto: BulkApproveSavingsWithdrawalDto,
    ) {
        return this.savingsWithdrawalService.bulkProcessApproval(
            user.id,
            user.roles,
            dto,
        );
    }

    // SHOPKEEPER ENDPOINTS

    @Post(':id/confirm-disbursement')
    @UseGuards(RolesGuard)
    @Roles('shopkeeper')
    @HttpCode(HttpStatus.OK)
    async confirmDisbursement(
        @Param('id') id: string,
        @CurrentUser() user: ICurrentUser,
        @Body() dto: ConfirmDisbursementDto,
    ) {
        return this.savingsWithdrawalService.confirmDisbursement(
            id,
            user.id,
            dto,
        );
    }


    @Post('bulk-confirm-disbursement')
    @UseGuards(RolesGuard)
    @Roles('shopkeeper')
    @HttpCode(HttpStatus.OK)
    async bulkConfirmDisbursement(
        @CurrentUser() user: ICurrentUser,
        @Body() dto: BulkConfirmDisbursementDto,
    ) {
        return this.savingsWithdrawalService.bulkConfirmDisbursement(
            user.id,
            dto,
        );
    }

    // KETUA AUTHORIZATION ENDPOINTS


    @Post(':id/confirm-authorization')
    @UseGuards(RolesGuard)
    @Roles('ketua')
    @HttpCode(HttpStatus.OK)
    async confirmAuthorization(
        @Param('id') id: string,
        @CurrentUser() user: ICurrentUser,
        @Body() dto: ConfirmAuthorizationDto,
    ) {
        return this.savingsWithdrawalService.confirmAuthorization(
            id,
            user.id,
            dto,
        );
    }

    @Post('bulk-confirm-authorization')
    @UseGuards(RolesGuard)
    @Roles('ketua')
    @HttpCode(HttpStatus.OK)
    async bulkConfirmAuthorization(
        @CurrentUser() user: ICurrentUser,
        @Body() dto: BulkConfirmAuthorizationDto,
    ) {
        return this.savingsWithdrawalService.bulkConfirmAuthorization(
            user.id,
            dto,
        );
    }
}