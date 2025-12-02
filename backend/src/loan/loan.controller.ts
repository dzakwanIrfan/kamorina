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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { LoanService } from './loan.service';
import type { CreateLoanDto } from './dto/create-loan.dto';
import type { ReviseLoanDto } from './dto/revise-loan.dto';
import { ApproveLoanDto } from './dto/approve-loan.dto';
import { BulkApproveLoanDto } from './dto/bulk-approve-loan.dto';
import { ProcessDisbursementDto } from './dto/process-disbursement.dto';
import { BulkProcessDisbursementDto } from './dto/bulk-process-disbursement.dto';
import { ProcessAuthorizationDto } from './dto/process-authorization.dto';
import { BulkProcessAuthorizationDto } from './dto/bulk-process-authorization.dto';
import { QueryLoanDto } from './dto/query-loan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UploadService } from '../upload/upload.service';
import { LoanType } from '@prisma/client';
import type { UpdateLoanDto } from './dto/update-loan.dto';

@Controller('loans')
@UseGuards(JwtAuthGuard)
export class LoanController {
  constructor(
    private readonly loanService: LoanService,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * MEMBER ENDPOINTS
   */

  /**
   * Check loan eligibility by type
   */
  @Get('eligibility/:loanType')
  @HttpCode(HttpStatus.OK)
  async checkEligibility(
    @CurrentUser() user: any,
    @Param('loanType') loanType: LoanType,
  ) {
    return this.loanService.getLoanEligibility(user.userId, loanType);
  }

  /**
   * Create draft loan application
   */
  @Post('draft')
  @HttpCode(HttpStatus.CREATED)
  async createDraft(
    @CurrentUser() user: any,
    @Body() createLoanDto: CreateLoanDto,
  ) {
    return this.loanService.createDraft(user.userId, createLoanDto);
  }

  /**
   * Update draft loan
   */
  @Put('draft/:id')
  @HttpCode(HttpStatus.OK)
  async updateDraft(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateLoanDto: UpdateLoanDto,
  ) {
    return this.loanService.updateDraft(user.userId, id, updateLoanDto);
  }

  /**
   * Submit loan application
   */
  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  async submitLoan(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.loanService.submitLoan(user.userId, id);
  }

  /**
   * Delete draft loan
   */
  @Delete('draft/:id')
  @HttpCode(HttpStatus.OK)
  async deleteDraft(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.loanService.deleteDraft(user.userId, id);
  }

  /**
   * Get my loans
   */
  @Get('my-loans')
  @HttpCode(HttpStatus.OK)
  async getMyLoans(
    @CurrentUser() user: any,
    @Query() query: QueryLoanDto,
  ) {
    return this.loanService.getMyLoans(user.userId, query);
  }

  /**
   * Get my loan by ID
   */
  @Get('my-loans/:id')
  @HttpCode(HttpStatus.OK)
  async getMyLoanById(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.loanService.getLoanById(id, user.userId);
  }

  /**
   * Upload loan attachments
   */
  @Post('attachments/upload')
  @UseInterceptors(FilesInterceptor('files', 5)) // Max 5 files
  @HttpCode(HttpStatus.OK)
  async uploadAttachments(
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new Error('No files uploaded');
    }

    // Validate files
    for (const file of files) {
      // Allow documents: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
      const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/jpg',
      ];

      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, JPG, PNG allowed');
      }

      // Max 10MB per file
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size too large. Maximum 10MB per file');
      }
    }

    const fileUrls = files.map((file) => this.uploadService.getFileUrl(file.filename));

    return {
      message: 'Files uploaded successfully',
      files: fileUrls,
    };
  }

  /**
   * APPROVER ENDPOINTS (DSP, Ketua, Pengawas)
   */

  /**
   * Get all loan applications (for approvers)
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam', 'pengawas')
  @HttpCode(HttpStatus.OK)
  async getAllLoans(@Query() query: QueryLoanDto) {
    return this.loanService.getAllLoans(query);
  }

  /**
   * Get loan by ID (for approvers)
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam', 'pengawas')
  @HttpCode(HttpStatus.OK)
  async getLoanById(@Param('id') id: string) {
    return this.loanService.getLoanById(id);
  }

  /**
   * Revise loan (DSP only)
   */
  @Put(':id/revise')
  @UseGuards(RolesGuard)
  @Roles('divisi_simpan_pinjam')
  @HttpCode(HttpStatus.OK)
  async reviseLoan(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ReviseLoanDto,
  ) {
    return this.loanService.reviseLoan(id, user.userId, dto);
  }

  /**
   * Process approval (single)
   */
  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles('ketua', 'divisi_simpan_pinjam', 'pengawas')
  @HttpCode(HttpStatus.OK)
  async processApproval(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ApproveLoanDto,
  ) {
    return this.loanService.processApproval(
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
  @Roles('ketua', 'divisi_simpan_pinjam', 'pengawas')
  @HttpCode(HttpStatus.OK)
  async bulkProcessApproval(
    @CurrentUser() user: any,
    @Body() dto: BulkApproveLoanDto,
  ) {
    return this.loanService.bulkProcessApproval(
      user.userId,
      user.roles,
      dto,
    );
  }

  /**
   * SHOPKEEPER ENDPOINTS
   */

  /**
   * Get loans pending disbursement (for shopkeeper)
   */
  @Get('disbursement/pending')
  @UseGuards(RolesGuard)
  @Roles('shopkeeper')
  @HttpCode(HttpStatus.OK)
  async getPendingDisbursement(@Query() query: QueryLoanDto) {
    return this.loanService.getAllLoans({
      ...query,
      status: 'APPROVED_PENDING_DISBURSEMENT' as any,
    });
  }

  /**
   * Process disbursement (single)
   */
  @Post(':id/disbursement')
  @UseGuards(RolesGuard)
  @Roles('shopkeeper')
  @HttpCode(HttpStatus.OK)
  async processDisbursement(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ProcessDisbursementDto,
  ) {
    return this.loanService.processDisbursement(id, user.userId, dto);
  }

  /**
   * Bulk process disbursement
   */
  @Post('disbursement/bulk')
  @UseGuards(RolesGuard)
  @Roles('shopkeeper')
  @HttpCode(HttpStatus.OK)
  async bulkProcessDisbursement(
    @CurrentUser() user: any,
    @Body() dto: BulkProcessDisbursementDto,
  ) {
    return this.loanService.bulkProcessDisbursement(user.userId, dto);
  }

  /**
   * KETUA ENDPOINTS (Authorization)
   */

  /**
   * Get loans pending authorization (for ketua)
   */
  @Get('authorization/pending')
  @UseGuards(RolesGuard)
  @Roles('ketua')
  @HttpCode(HttpStatus.OK)
  async getPendingAuthorization(@Query() query: QueryLoanDto) {
    return this.loanService.getAllLoans({
      ...query,
      status: 'DISBURSEMENT_IN_PROGRESS' as any,
    });
  }

  /**
   * Process authorization (single)
   */
  @Post(':id/authorization')
  @UseGuards(RolesGuard)
  @Roles('ketua')
  @HttpCode(HttpStatus.OK)
  async processAuthorization(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ProcessAuthorizationDto,
  ) {
    return this.loanService.processAuthorization(id, user.userId, dto);
  }

  /**
   * Bulk process authorization
   */
  @Post('authorization/bulk')
  @UseGuards(RolesGuard)
  @Roles('ketua')
  @HttpCode(HttpStatus.OK)
  async bulkProcessAuthorization(
    @CurrentUser() user: any,
    @Body() dto: BulkProcessAuthorizationDto,
  ) {
    return this.loanService.bulkProcessAuthorization(user.userId, dto);
  }
}