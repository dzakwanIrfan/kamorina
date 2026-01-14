import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DepositService } from './deposit.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { UpdateDepositDto } from './dto/update-deposit.dto';
import { ApproveDepositDto } from './dto/approve-deposit.dto';
import { BulkApproveDepositDto } from './dto/bulk-approve-deposit.dto';
import { QueryDepositDto } from './dto/query-deposit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { ICurrentUser } from 'src/auth/interfaces/current-user.interface';

@Controller('deposits')
@UseGuards(JwtAuthGuard)
export class DepositController {
  constructor(private readonly depositService: DepositService) { }

  /**
   * MEMBER ENDPOINTS
   */

  /**
   * Create draft deposit application
   */
  @Post('draft')
  @HttpCode(HttpStatus.CREATED)
  async createDraft(
    @CurrentUser() user: ICurrentUser,
    @Body() createDepositDto: CreateDepositDto,
  ) {
    return this.depositService.createDraft(user.id, createDepositDto);
  }

  /**
   * Update draft deposit
   */
  @Put('draft/:id')
  @HttpCode(HttpStatus.OK)
  async updateDraft(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
    @Body() updateDepositDto: UpdateDepositDto,
  ) {
    return this.depositService.updateDraft(user.id, id, updateDepositDto);
  }

  /**
   * Submit deposit application
   */
  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  async submitDeposit(@CurrentUser() user: ICurrentUser, @Param('id') id: string) {
    return this.depositService.submitDeposit(user.id, id);
  }

  /**
   * Delete draft deposit
   */
  @Delete('draft/:id')
  @HttpCode(HttpStatus.OK)
  async deleteDraft(@CurrentUser() user: ICurrentUser, @Param('id') id: string) {
    return this.depositService.deleteDraft(user.id, id);
  }

  /**
   * Get my deposits
   */
  @Get('my-deposits')
  @HttpCode(HttpStatus.OK)
  async getMyDeposits(
    @CurrentUser() user: ICurrentUser,
    @Query() query: QueryDepositDto,
  ) {
    return this.depositService.getMyDeposits(user.id, query);
  }

  /**
   * Get my deposit by ID
   */
  @Get('my-deposits/:id')
  @HttpCode(HttpStatus.OK)
  async getMyDepositById(@CurrentUser() user: ICurrentUser, @Param('id') id: string) {
    return this.depositService.getDepositById(id, user.id);
  }

  /**
   * APPROVER ENDPOINTS (DSP, Ketua)
   */

  /**
   * Get all deposit applications (for approvers)
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam')
  @HttpCode(HttpStatus.OK)
  async getAllDeposits(@Query() query: QueryDepositDto) {
    return this.depositService.getAllDeposits(query);
  }

  /**
   * Get deposit by ID (for approvers)
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam')
  @HttpCode(HttpStatus.OK)
  async getDepositById(@Param('id') id: string) {
    return this.depositService.getDepositById(id);
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
    @Body() dto: ApproveDepositDto,
  ) {
    return this.depositService.processApproval(id, user.id, user.roles, dto);
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
    @Body() dto: BulkApproveDepositDto,
  ) {
    return this.depositService.bulkProcessApproval(user.id, user.roles, dto);
  }
}