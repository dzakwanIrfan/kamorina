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
import { DepositChangeService } from './deposit-change.service';
import { CreateDepositChangeDto } from './dto/deposit-change/create-deposit-change.dto';
import { UpdateDepositChangeDto } from './dto/deposit-change/update-deposit-change.dto';
import { ApproveDepositChangeDto } from './dto/deposit-change/approve-deposit-change.dto';
import { BulkApproveDepositChangeDto } from './dto/deposit-change/bulk-approve-deposit-change.dto';
import { QueryDepositChangeDto } from './dto/deposit-change/query-deposit-change.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('deposit-changes')
@UseGuards(JwtAuthGuard)
export class DepositChangeController {
  constructor(private readonly depositChangeService: DepositChangeService) {}

  // MEMBER ENDPOINTS

  /**
   * Create draft change request
   */
  @Post('draft')
  @HttpCode(HttpStatus.CREATED)
  async createDraft(
    @CurrentUser() user: any,
    @Body() dto: CreateDepositChangeDto,
  ) {
    return this. depositChangeService.createDraft(user.userId, dto);
  }

  /**
   * Update draft change request
   */
  @Put('draft/:id')
  @HttpCode(HttpStatus.OK)
  async updateDraft(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateDepositChangeDto,
  ) {
    return this.depositChangeService. updateDraft(user.userId, id, dto);
  }

  /**
   * Submit change request
   */
  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  async submitChangeRequest(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.depositChangeService.submitChangeRequest(user.userId, id);
  }

  /**
   * Cancel draft change request
   */
  @Delete('draft/:id')
  @HttpCode(HttpStatus.OK)
  async cancelChangeRequest(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.depositChangeService.cancelChangeRequest(user.userId, id);
  }

  /**
   * Get my change requests
   */
  @Get('my-requests')
  @HttpCode(HttpStatus.OK)
  async getMyChangeRequests(
    @CurrentUser() user: any,
    @Query() query: QueryDepositChangeDto,
  ) {
    return this.depositChangeService.getMyChangeRequests(user.userId, query);
  }

  /**
   * Get my change request by ID
   */
  @Get('my-requests/:id')
  @HttpCode(HttpStatus.OK)
  async getMyChangeRequestById(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.depositChangeService.getChangeRequestById(id, user.userId);
  }

  // APPROVER ENDPOINTS

  /**
   * Get all change requests (for approvers)
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam')
  @HttpCode(HttpStatus.OK)
  async getAllChangeRequests(@Query() query: QueryDepositChangeDto) {
    return this. depositChangeService.getAllChangeRequests(query);
  }

  /**
   * Get change request by ID (for approvers)
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam')
  @HttpCode(HttpStatus.OK)
  async getChangeRequestById(@Param('id') id: string) {
    return this.depositChangeService.getChangeRequestById(id);
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
    @CurrentUser() user: any,
    @Body() dto: ApproveDepositChangeDto,
  ) {
    return this.depositChangeService.processApproval(
      id,
      user.userId,
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
    @CurrentUser() user: any,
    @Body() dto: BulkApproveDepositChangeDto,
  ) {
    return this.depositChangeService.bulkProcessApproval(
      user.userId,
      user.roles,
      dto,
    );
  }
}