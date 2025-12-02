import { Injectable } from '@nestjs/common';
import { LoanCrudService } from './services/loan-crud.service';
import { LoanSubmissionService } from './services/loan-submission.service';
import { LoanApprovalService } from './services/loan-approval.service';
import { LoanDisbursementService } from './services/loan-disbursement.service';
import { LoanAuthorizationService } from './services/loan-authorization.service';
import { LoanQueryService } from './services/loan-query.service';
import { LoanValidationService } from './services/loan-validation.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { ReviseLoanDto } from './dto/revise-loan.dto';
import { ApproveLoanDto } from './dto/approve-loan.dto';
import { BulkApproveLoanDto } from './dto/bulk-approve-loan.dto';
import { ProcessDisbursementDto } from './dto/process-disbursement.dto';
import { BulkProcessDisbursementDto } from './dto/bulk-process-disbursement.dto';
import { ProcessAuthorizationDto } from './dto/process-authorization.dto';
import { BulkProcessAuthorizationDto } from './dto/bulk-process-authorization.dto';
import { QueryLoanDto } from './dto/query-loan.dto';
import { LoanType } from '@prisma/client';

@Injectable()
export class LoanService {
  constructor(
    private crudService: LoanCrudService,
    private submissionService: LoanSubmissionService,
    private approvalService: LoanApprovalService,
    private disbursementService: LoanDisbursementService,
    private authorizationService: LoanAuthorizationService,
    private queryService: LoanQueryService,
    private validationService: LoanValidationService,
  ) {}

  // ELIGIBILITY
  async getLoanEligibility(userId: string, loanType: LoanType) {
    return this.validationService.getLoanEligibility(userId, loanType);
  }

  // CRUD OPERATIONS
  async createDraft(userId: string, dto: CreateLoanDto) {
    return this.crudService.createDraft(userId, dto);
  }

  async updateDraft(userId: string, loanId: string, dto: UpdateLoanDto) {
    return this.crudService.updateDraft(userId, loanId, dto);
  }

  async deleteDraft(userId: string, loanId: string) {
    return this.crudService.deleteDraft(userId, loanId);
  }

  // SUBMISSION
  async submitLoan(userId: string, loanId: string) {
    return this.submissionService.submitLoan(userId, loanId);
  }

  // APPROVAL PROCESS
  async reviseLoan(loanId: string, approverId: string, dto: ReviseLoanDto) {
    return this.approvalService.reviseLoan(loanId, approverId, dto);
  }

  async processApproval(
    loanId: string,
    approverId: string,
    approverRoles: string[],
    dto: ApproveLoanDto,
  ) {
    return this.approvalService.processApproval(loanId, approverId, approverRoles, dto);
  }

  async bulkProcessApproval(
    approverId: string,
    approverRoles: string[],
    dto: BulkApproveLoanDto,
  ) {
    return this.approvalService.bulkProcessApproval(approverId, approverRoles, dto);
  }

  // DISBURSEMENT
  async processDisbursement(
    loanId: string,
    shopkeeperId: string,
    dto: ProcessDisbursementDto,
  ) {
    return this.disbursementService.processDisbursement(loanId, shopkeeperId, dto);
  }

  async bulkProcessDisbursement(shopkeeperId: string, dto: BulkProcessDisbursementDto) {
    return this.disbursementService.bulkProcessDisbursement(shopkeeperId, dto);
  }

  // AUTHORIZATION
  async processAuthorization(
    loanId: string,
    ketuaId: string,
    dto: ProcessAuthorizationDto,
  ) {
    return this.authorizationService.processAuthorization(loanId, ketuaId, dto);
  }

  async bulkProcessAuthorization(ketuaId: string, dto: BulkProcessAuthorizationDto) {
    return this.authorizationService.bulkProcessAuthorization(ketuaId, dto);
  }

  // QUERY OPERATIONS
  async getMyLoans(userId: string, query: QueryLoanDto) {
    return this.queryService.getMyLoans(userId, query);
  }

  async getAllLoans(query: QueryLoanDto) {
    return this.queryService.getAllLoans(query);
  }

  async getLoanById(loanId: string, userId?: string) {
    const loan = await this.queryService.getLoanById(loanId);
    
    if (!loan) {
      throw new Error('Pinjaman tidak ditemukan');
    }

    // If userId provided, check access
    if (userId && loan.userId !== userId) {
      throw new Error('Anda tidak memiliki akses ke pinjaman ini');
    }

    return loan;
  }
}