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
} from '@nestjs/common';
import { LoanRepaymentService } from './loan-repayment.service';
import { CreateRepaymentDto } from './dto/create-repayment.dto';
import { ApproveRepaymentDto } from './dto/approve-repayment.dto';
import { BulkApproveRepaymentDto } from './dto/bulk-approve-repayment.dto';
import { QueryRepaymentDto } from './dto/query-repayment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { ICurrentUser } from '../auth/interfaces/current-user.interface';

@Controller('loan-repayments')
@UseGuards(JwtAuthGuard)
export class LoanRepaymentController {
  constructor(private readonly repaymentService: LoanRepaymentService) {}

  /**
   * MEMBER ENDPOINTS
   */

  /**
   * Get repayment calculation for a loan
   */
  @Get('calculate/:loanApplicationId')
  @HttpCode(HttpStatus.OK)
  async getRepaymentCalculation(
    @Param('loanApplicationId') loanApplicationId: string,
  ) {
    return this.repaymentService.getRepaymentCalculation(loanApplicationId);
  }

  /**
   * Create repayment request
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRepayment(
    @CurrentUser() user: ICurrentUser,
    @Body() createRepaymentDto: CreateRepaymentDto,
  ) {
    return this.repaymentService.createRepayment(user.id, createRepaymentDto);
  }

  /**
   * Get my repayments
   */
  @Get('my-repayments')
  @HttpCode(HttpStatus.OK)
  async getMyRepayments(
    @CurrentUser() user: ICurrentUser,
    @Query() query: QueryRepaymentDto,
  ) {
    return this.repaymentService.getMyRepayments(user.id, query);
  }

  /**
   * Get my repayment by ID
   */
  @Get('my-repayments/:id')
  @HttpCode(HttpStatus.OK)
  async getMyRepaymentById(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
  ) {
    return this.repaymentService.getRepaymentById(id, user.id);
  }

  /**
   * APPROVER ENDPOINTS (DSP, Ketua)
   */

  /**
   * Get all repayment requests (for approvers)
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam')
  @HttpCode(HttpStatus.OK)
  async getAllRepayments(@Query() query: QueryRepaymentDto) {
    return this.repaymentService.getAllRepayments(query);
  }

  /**
   * Get repayment by ID (for approvers)
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getRepaymentById(@Param('id') id: string) {
    return this.repaymentService.getRepaymentById(id);
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
    @Body() dto: ApproveRepaymentDto,
  ) {
    return this.repaymentService.processApproval(id, user.id, user.roles, dto);
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
    @Body() dto: BulkApproveRepaymentDto,
  ) {
    return this.repaymentService.bulkProcessApproval(user.id, user.roles, dto);
  }
}
