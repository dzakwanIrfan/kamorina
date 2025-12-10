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
import { MemberApplicationService } from './member-application.service';
import { SubmitApplicationDto } from './dto/submit-application.dto';
import { ApproveRejectDto } from './dto/approve-reject.dto';
import { BulkApproveRejectDto } from './dto/bulk-approve-reject.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { ICurrentUser } from 'src/auth/interfaces/current-user.interface';

@Controller('member-applications')
@UseGuards(JwtAuthGuard)
export class MemberApplicationController {
  constructor(
    private readonly memberApplicationService: MemberApplicationService,
  ) { }

  /**
   * Submit member application (for regular users)
   */
  @Post('submit')
  @HttpCode(HttpStatus.CREATED)
  async submitApplication(
    @CurrentUser() user: ICurrentUser,
    @Body() submitDto: SubmitApplicationDto,
  ) {
    return this.memberApplicationService.submitApplication(user.id, submitDto);
  }

  /**
   * Get my own application
   */
  @Get('my-application')
  @HttpCode(HttpStatus.OK)
  async getMyApplication(@CurrentUser() user: ICurrentUser) {
    return this.memberApplicationService.getMyApplication(user.id);
  }

  /**
   * Get my application history
   */
  @Get('my-application/history')
  @HttpCode(HttpStatus.OK)
  async getMyApplicationHistory(@CurrentUser() user: ICurrentUser) {
    return this.memberApplicationService.getApplicationHistory(user.id);
  }

  /**
   * Get all applications (for approvers)
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam', 'pengawas', 'payroll')
  @HttpCode(HttpStatus.OK)
  async getApplications(@Query() query: QueryApplicationDto) {
    return this.memberApplicationService.getApplications(query);
  }

  /**
   * Get application by ID (for approvers)
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam', 'pengawas', 'payroll')
  @HttpCode(HttpStatus.OK)
  async getApplicationById(@Param('id') id: string) {
    return this.memberApplicationService.getApplicationById(id);
  }

  /**
   * Approve or reject application (single)
   */
  @Post(':id/process')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam')
  @HttpCode(HttpStatus.OK)
  async processApproval(
    @Param('id') id: string,
    @CurrentUser() user: ICurrentUser,
    @Body() dto: ApproveRejectDto,
  ) {
    return this.memberApplicationService.processApproval(
      id,
      user.id,
      user.roles,
      dto,
    );
  }

  /**
   * Bulk approve or reject applications
   */
  @Post('bulk-process')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam')
  @HttpCode(HttpStatus.OK)
  async bulkProcessApproval(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: BulkApproveRejectDto,
  ) {
    return this.memberApplicationService.bulkProcessApproval(
      user.id,
      user.roles,
      dto,
    );
  }
}