import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
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
import { 
  LoanStatus, 
  LoanApprovalStep, 
  LoanApprovalDecision,
  EmployeeType,
} from '@prisma/client';
import { PaginatedResult } from '../common/interfaces/pagination.interface';

@Injectable()
export class LoanService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  /**
   * Generate loan number: LOAN-YYYYMMDD-XXXX
   */
  private async generateLoanNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    const lastLoan = await this.prisma.loanApplication.findFirst({
      where: {
        loanNumber: {
          startsWith: `LOAN-${dateStr}`,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let sequence = 1;
    if (lastLoan) {
      const lastSequence = parseInt(lastLoan.loanNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `LOAN-${dateStr}-${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Calculate years of service from employee number
   * Format: K159000111 = Karyawan Tetap 2015 bulan 9
   */
  private calculateYearsOfService(employeeNumber: string): number {
    if (!employeeNumber || employeeNumber.length < 4) {
      return 0;
    }

    // Extract year and month from first 3 digits (159 = 2015 bulan 9)
    const yearMonth = employeeNumber.substring(1, 4); // "159"
    const year = parseInt('20' + yearMonth.substring(0, 2)); // "15" -> 2015
    const month = parseInt(yearMonth.substring(2, 3)); // "9"

    // Create hire date
    const hireDate = new Date(year, month - 1, 1); // Month is 0-indexed
    const now = new Date();

    // Calculate difference in years
    let years = now.getFullYear() - hireDate.getFullYear();
    const monthDiff = now.getMonth() - hireDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < hireDate.getDate())) {
      years--;
    }

    return Math.max(0, years);
  }

  /**
   * Get loan eligibility for user (including min/max loan amount)
   */
  async getLoanEligibility(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          include: {
            golongan: {
              include: {
                loanLimits: {
                  orderBy: {
                    minYearsOfService: 'asc',
                  },
                },
              },
            },
            department: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    if (!user.employee) {
      throw new ForbiddenException('Data karyawan tidak ditemukan');
    }

    // Check if employee is TETAP
    if (user.employee.employeeType !== EmployeeType.TETAP) {
      throw new ForbiddenException('Hanya karyawan tetap yang dapat mengajukan pinjaman');
    }

    // Check if member is verified
    if (!user.memberVerified) {
      throw new ForbiddenException('Anda harus menjadi anggota terverifikasi untuk mengajukan pinjaman');
    }

    // Calculate years of service from employee number
    const yearsOfService = this.calculateYearsOfService(user.employee.employeeNumber);

    // Find matching loan limit based on golongan and years of service
    const loanLimit = await this.prisma.loanLimitMatrix.findFirst({
      where: {
        golonganId: user.employee.golonganId,
        minYearsOfService: {
          lte: yearsOfService,
        },
        OR: [
          {
            maxYearsOfService: {
              gte: yearsOfService,
            },
          },
          {
            maxYearsOfService: null, // For > 9 years
          },
        ],
      },
      include: {
        golongan: true,
      },
    });

    if (!loanLimit) {
      throw new BadRequestException(
        `Tidak ada plafond pinjaman yang tersedia untuk golongan ${user.employee.golongan.golonganName} dengan masa kerja ${yearsOfService} tahun. Silakan hubungi admin.`,
      );
    }

    const maxLoanAmount = Number(loanLimit.maxLoanAmount);

    if (maxLoanAmount === 0) {
      throw new BadRequestException(
        `Plafond pinjaman untuk masa kerja ${yearsOfService} tahun adalah 0. Anda belum memenuhi syarat untuk mengajukan pinjaman.`,
      );
    }

    // Get min loan from settings
    const minLoanSetting = await this.prisma.cooperativeSetting.findUnique({
      where: { key: 'min_loan_amount' },
    });
    const minLoanAmount = minLoanSetting ? parseFloat(minLoanSetting.value) : 1000000;

    // Get max tenor from settings
    const maxTenorSetting = await this.prisma.cooperativeSetting.findUnique({
      where: { key: 'max_loan_tenor' },
    });
    const maxTenor = maxTenorSetting ? parseInt(maxTenorSetting.value) : 36;

    // Get interest rate
    const interestSetting = await this.prisma.cooperativeSetting.findUnique({
      where: { key: 'loan_interest_rate' },
    });
    const interestRate = interestSetting ? parseFloat(interestSetting.value) : 12;

    return {
      isEligible: true,
      employee: {
        employeeNumber: user.employee.employeeNumber,
        fullName: user.employee.fullName,
        employeeType: user.employee.employeeType,
        department: user.employee.department.departmentName,
        golongan: user.employee.golongan.golonganName,
      },
      yearsOfService,
      loanLimit: {
        minLoanAmount,
        maxLoanAmount,
        maxTenor,
        interestRate,
      },
      loanLimitMatrix: {
        id: loanLimit.id,
        minYearsOfService: loanLimit.minYearsOfService,
        maxYearsOfService: loanLimit.maxYearsOfService,
        maxLoanAmount: loanLimit.maxLoanAmount,
      },
    };
  }

  /**
   * Check if user is verified member and eligible for loan
   */
  private async checkMemberStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    if (!user.employee) {
      throw new ForbiddenException('Data karyawan tidak ditemukan');
    }

    // Check employee type
    if (user.employee.employeeType !== EmployeeType.TETAP) {
      throw new ForbiddenException('Hanya karyawan tetap yang dapat mengajukan pinjaman');
    }

    if (!user.memberVerified) {
      throw new ForbiddenException('Anda harus menjadi anggota terverifikasi untuk mengajukan pinjaman');
    }

    return user;
  }

  /**
   * Validate loan amount against user's loan limit matrix
   */
  private async validateLoanAmount(userId: string, amount: number) {
    const eligibility = await this.getLoanEligibility(userId);

    if (amount < eligibility.loanLimit.minLoanAmount) {
      throw new BadRequestException(
        `Jumlah pinjaman minimal Rp ${eligibility.loanLimit.minLoanAmount.toLocaleString('id-ID')}`,
      );
    }

    if (amount > eligibility.loanLimit.maxLoanAmount) {
      throw new BadRequestException(
        `Jumlah pinjaman maksimal untuk golongan ${eligibility.employee.golongan} dengan masa kerja ${eligibility.yearsOfService} tahun adalah Rp ${eligibility.loanLimit.maxLoanAmount.toLocaleString('id-ID')}`,
      );
    }
  }

  /**
   * Validate loan tenor against settings
   */
  private async validateLoanTenor(tenor: number) {
    const maxTenor = await this.prisma.cooperativeSetting.findUnique({
      where: { key: 'max_loan_tenor' },
    });

    const maxTenorValue = maxTenor ? parseInt(maxTenor.value) : 36;

    if (tenor < 1) {
      throw new BadRequestException('Tenor minimal 1 bulan');
    }

    if (tenor > maxTenorValue) {
      throw new BadRequestException(`Tenor maksimal ${maxTenorValue} bulan`);
    }
  }

  /**
   * Calculate loan details (interest, installment, total)
   */
  private async calculateLoanDetails(amount: number, tenor: number) {
    const interestSetting = await this.prisma.cooperativeSetting.findUnique({
      where: { key: 'loan_interest_rate' },
    });

    const annualRate = interestSetting ? parseFloat(interestSetting.value) : 12;
    const monthlyRate = annualRate / 12 / 100;

    // Simple flat rate calculation
    const totalInterest = amount * (annualRate / 100) * (tenor / 12);
    const totalRepayment = amount + totalInterest;
    const monthlyInstallment = totalRepayment / tenor;

    return {
      interestRate: annualRate,
      monthlyInstallment: Math.round(monthlyInstallment),
      totalRepayment: Math.round(totalRepayment),
    };
  }

  /**
   * Create draft loan application
   */
  async createDraft(userId: string, dto: CreateLoanDto) {
    const user = await this.checkMemberStatus(userId);
    
    // Validate loan amount against user's limit
    await this.validateLoanAmount(userId, dto.loanAmount);
    
    // Validate tenor
    await this.validateLoanTenor(dto.loanTenor);

    const bankAccount = dto.bankAccountNumber || user.bankAccountNumber;
    if (!bankAccount) {
      throw new BadRequestException('Nomor rekening wajib diisi');
    }

    const loanNumber = await this.generateLoanNumber();
    const calculations = await this.calculateLoanDetails(dto.loanAmount, dto.loanTenor);

    const loan = await this.prisma.loanApplication.create({
      data: {
        loanNumber,
        userId,
        bankAccountNumber: bankAccount,
        loanAmount: dto.loanAmount,
        loanTenor: dto.loanTenor,
        loanPurpose: dto.loanPurpose,
        attachments: dto.attachments || [],
        status: LoanStatus.DRAFT,
        ...calculations,
      },
      include: {
        user: {
          include: {
            employee: {
              include: {
                department: true,
                golongan: true,
              },
            },
          },
        },
      },
    });

    // Update user bank account if provided and different
    if (dto.bankAccountNumber && dto.bankAccountNumber !== user.bankAccountNumber) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { bankAccountNumber: dto.bankAccountNumber },
      });
    }

    return {
      message: 'Draft pinjaman berhasil dibuat',
      loan,
    };
  }

  /**
   * Update draft loan
   */
  async updateDraft(userId: string, loanId: string, dto: UpdateLoanDto) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new NotFoundException('Pinjaman tidak ditemukan');
    }

    if (loan.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke pinjaman ini');
    }

    if (loan.status !== LoanStatus.DRAFT) {
      throw new BadRequestException('Hanya draft yang bisa diupdate');
    }

    if (dto.loanAmount) {
      await this.validateLoanAmount(userId, dto.loanAmount);
    }

    if (dto.loanTenor) {
      await this.validateLoanTenor(dto.loanTenor);
    }

    const updateData: any = {};

    if (dto.bankAccountNumber) updateData.bankAccountNumber = dto.bankAccountNumber;
    if (dto.loanAmount) updateData.loanAmount = dto.loanAmount;
    if (dto.loanTenor) updateData.loanTenor = dto.loanTenor;
    if (dto.loanPurpose) updateData.loanPurpose = dto.loanPurpose;
    if (dto.attachments) updateData.attachments = dto.attachments;

    // Recalculate if amount or tenor changed
    if (dto.loanAmount || dto.loanTenor) {
      const amount = dto.loanAmount || loan.loanAmount.toNumber();
      const tenor = dto.loanTenor || loan.loanTenor;
      const calculations = await this.calculateLoanDetails(amount, tenor);
      Object.assign(updateData, calculations);
    }

    const updated = await this.prisma.loanApplication.update({
      where: { id: loanId },
      data: updateData,
      include: {
        user: {
          include: {
            employee: {
              include: {
                department: true,
                golongan: true,
              },
            },
          },
        },
      },
    });

    return {
      message: 'Draft pinjaman berhasil diupdate',
      loan: updated,
    };
  }

  /**
   * Submit loan application
   */
  async submitLoan(userId: string, loanId: string) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
      include: {
        user: true,
      },
    });

    if (!loan) {
      throw new NotFoundException('Pinjaman tidak ditemukan');
    }

    if (loan.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke pinjaman ini');
    }

    if (loan.status !== LoanStatus.DRAFT) {
      throw new BadRequestException('Hanya draft yang bisa disubmit');
    }

    // Re-validate before submit
    await this.validateLoanAmount(userId, loan.loanAmount.toNumber());
    await this.validateLoanTenor(loan.loanTenor);

    const result = await this.prisma.$transaction(async (tx) => {
      // Update loan status
      const updated = await tx.loanApplication.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.SUBMITTED,
          currentStep: LoanApprovalStep.DIVISI_SIMPAN_PINJAM,
          submittedAt: new Date(),
        },
      });

      // Create approval records
      await tx.loanApproval.createMany({
        data: [
          { loanApplicationId: loanId, step: LoanApprovalStep.DIVISI_SIMPAN_PINJAM },
          { loanApplicationId: loanId, step: LoanApprovalStep.KETUA },
          { loanApplicationId: loanId, step: LoanApprovalStep.PENGAWAS },
        ],
      });

      // Save history
      await tx.loanHistory.create({
        data: {
          loanApplicationId: loanId,
          status: LoanStatus.SUBMITTED,
          loanAmount: updated.loanAmount,
          loanTenor: updated.loanTenor,
          loanPurpose: updated.loanPurpose,
          bankAccountNumber: updated.bankAccountNumber,
          interestRate: updated.interestRate,
          monthlyInstallment: updated.monthlyInstallment,
          action: 'SUBMITTED',
          actionAt: new Date(),
          actionBy: userId,
        },
      });

      return updated;
    });

    // Notify DSP
    try {
      await this.notifyApprovers(loanId, LoanApprovalStep.DIVISI_SIMPAN_PINJAM, 'NEW_LOAN');
    } catch (error) {
      console.error('Failed to send notification:', error);
    }

    return {
      message: 'Pengajuan pinjaman berhasil disubmit. Menunggu review dari Divisi Simpan Pinjam.',
      loan: result,
    };
  }

  /**
   * Get my loan applications
   */
  async getMyLoans(userId: string, query: QueryLoanDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (status) where.status = status;

    if (search) {
      where.OR = [
        { loanNumber: { contains: search, mode: 'insensitive' } },
        { loanPurpose: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [loans, total] = await Promise.all([
      this.prisma.loanApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            include: {
              employee: {
                include: {
                  department: true,
                  golongan: true,
                },
              },
            },
          },
          approvals: {
            include: {
              approver: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          disbursement: {
            include: {
              processedByUser: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          authorization: {
            include: {
              authorizedByUser: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.loanApplication.count({ where }),
    ]);

    return {
      data: loans,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get loan by ID
   */
  async getLoanById(loanId: string, userId?: string) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
      include: {
        user: {
          include: {
            employee: {
              include: {
                department: true,
                golongan: true,
              },
            },
          },
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        history: {
          include: {
            actionByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        disbursement: {
          include: {
            processedByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        authorization: {
          include: {
            authorizedByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!loan) {
      throw new NotFoundException('Pinjaman tidak ditemukan');
    }

    // If userId provided, check access
    if (userId && loan.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke pinjaman ini');
    }

    return loan;
  }

  /**
   * Get all loans (for approvers/admins)
   */
  async getAllLoans(query: QueryLoanDto): Promise<PaginatedResult<any>> {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      step,
      userId,
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      startDate,
      endDate,
    } = query;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) where.status = status;
    if (step) where.currentStep = step;
    if (userId) where.userId = userId;

    if (search) {
      where.OR = [
        { loanNumber: { contains: search, mode: 'insensitive' } },
        { loanPurpose: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { employee: { employeeNumber: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    if (startDate || endDate) {
      where.submittedAt = {};
      if (startDate) where.submittedAt.gte = new Date(startDate);
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.submittedAt.lte = endDateTime;
      }
    }

    const [loans, total] = await Promise.all([
      this.prisma.loanApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            include: {
              employee: {
                include: {
                  department: true,
                  golongan: true,
                },
              },
            },
          },
          approvals: {
            include: {
              approver: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          disbursement: {
            include: {
              processedByUser: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          authorization: {
            include: {
              authorizedByUser: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.loanApplication.count({ where }),
    ]);

    return {
      data: loans,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Revise loan (DSP only)
   */
  async reviseLoan(loanId: string, approverId: string, dto: ReviseLoanDto) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
      include: {
        user: true,
        approvals: true,
      },
    });

    if (!loan) {
      throw new NotFoundException('Pinjaman tidak ditemukan');
    }

    if (loan.currentStep !== LoanApprovalStep.DIVISI_SIMPAN_PINJAM) {
      throw new BadRequestException('Hanya bisa direvisi pada step DSP');
    }

    await this.validateLoanAmount(loan.userId, dto.loanAmount);
    await this.validateLoanTenor(dto.loanTenor);
    const calculations = await this.calculateLoanDetails(dto.loanAmount, dto.loanTenor);

    const result = await this.prisma.$transaction(async (tx) => {
      // Update loan
      const updated = await tx.loanApplication.update({
        where: { id: loanId },
        data: {
          loanAmount: dto.loanAmount,
          loanTenor: dto.loanTenor,
          ...calculations,
          revisionCount: { increment: 1 },
          lastRevisedAt: new Date(),
          lastRevisedBy: approverId,
          revisionNotes: dto.revisionNotes,
        },
      });

      // Save revision in approval record
      const approvalRecord = loan.approvals.find(
        (a) => a.step === LoanApprovalStep.DIVISI_SIMPAN_PINJAM,
      );

      if (approvalRecord) {
        await tx.loanApproval.update({
          where: { id: approvalRecord.id },
          data: {
            decision: LoanApprovalDecision.REVISED,
            decidedAt: new Date(),
            approverId,
            notes: dto.revisionNotes,
            revisedData: {
              loanAmount: dto.loanAmount,
              loanTenor: dto.loanTenor,
              ...calculations,
            },
          },
        });
      }

      // Save history
      await tx.loanHistory.create({
        data: {
          loanApplicationId: loanId,
          status: loan.status,
          loanAmount: dto.loanAmount,
          loanTenor: dto.loanTenor,
          loanPurpose: loan.loanPurpose,
          bankAccountNumber: loan.bankAccountNumber,
          interestRate: calculations.interestRate,
          monthlyInstallment: calculations.monthlyInstallment,
          action: 'REVISED',
          actionAt: new Date(),
          actionBy: approverId,
          notes: dto.revisionNotes,
        },
      });

      return updated;
    });

    // Notify applicant about revision
    try {
      await this.mailService.sendLoanRevised(
        loan.user.email,
        loan.user.name,
        loan.loanNumber,
        dto.revisionNotes,
      );
    } catch (error) {
      console.error('Failed to send revision notification:', error);
    }

    return {
      message: 'Pinjaman berhasil direvisi',
      loan: result,
    };
  }

  /**
   * Process approval (DSP, Ketua, Pengawas)
   */
  async processApproval(
    loanId: string,
    approverId: string,
    approverRoles: string[],
    dto: ApproveLoanDto,
  ) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
      include: {
        user: true,
        approvals: true,
      },
    });

    if (!loan) {
      throw new NotFoundException('Pinjaman tidak ditemukan');
    }

    if (!loan.currentStep) {
      throw new BadRequestException('Pinjaman tidak dalam status review');
    }

    // Map role to step
    const roleStepMap: { [key: string]: LoanApprovalStep } = {
      divisi_simpan_pinjam: LoanApprovalStep.DIVISI_SIMPAN_PINJAM,
      ketua: LoanApprovalStep.KETUA,
      pengawas: LoanApprovalStep.PENGAWAS,
    };

    const approverStep = approverRoles
      .map((role) => roleStepMap[role])
      .find((step) => step === loan.currentStep);

    if (!approverStep) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk approve di step ini');
    }

    const approvalRecord = loan.approvals.find((a) => a.step === loan.currentStep);
    if (!approvalRecord) {
      throw new BadRequestException('Record approval tidak ditemukan');
    }

    if (approvalRecord.decision && approvalRecord.decision !== LoanApprovalDecision.REVISED) {
      throw new BadRequestException('Step ini sudah diproses sebelumnya');
    }

    if (dto.decision === LoanApprovalDecision.REJECTED) {
      // REJECT
      await this.prisma.$transaction(async (tx) => {
        await tx.loanApproval.update({
          where: { id: approvalRecord.id },
          data: {
            decision: LoanApprovalDecision.REJECTED,
            decidedAt: new Date(),
            approverId,
            notes: dto.notes,
          },
        });

        await tx.loanApplication.update({
          where: { id: loanId },
          data: {
            status: LoanStatus.REJECTED,
            rejectedAt: new Date(),
            rejectionReason: dto.notes,
            currentStep: null,
          },
        });

        await tx.loanHistory.create({
          data: {
            loanApplicationId: loanId,
            status: LoanStatus.REJECTED,
            loanAmount: loan.loanAmount,
            loanTenor: loan.loanTenor,
            loanPurpose: loan.loanPurpose,
            bankAccountNumber: loan.bankAccountNumber,
            interestRate: loan.interestRate,
            monthlyInstallment: loan.monthlyInstallment,
            action: 'REJECTED',
            actionAt: new Date(),
            actionBy: approverId,
            notes: dto.notes,
          },
        });
      });

      // Notify applicant
      try {
        await this.mailService.sendLoanRejected(
          loan.user.email,
          loan.user.name,
          loan.loanNumber,
          dto.notes || 'Tidak ada catatan',
        );
      } catch (error) {
        console.error('Failed to send rejection email:', error);
      }

      return { message: 'Pinjaman berhasil ditolak' };
    } else {
      // APPROVE
      const stepOrder = [
        LoanApprovalStep.DIVISI_SIMPAN_PINJAM,
        LoanApprovalStep.KETUA,
        LoanApprovalStep.PENGAWAS,
      ];

      const currentIndex = stepOrder.indexOf(loan.currentStep);
      const isLastStep = currentIndex === stepOrder.length - 1;
      const nextStep = isLastStep ? null : stepOrder[currentIndex + 1];

      await this.prisma.$transaction(async (tx) => {
        await tx.loanApproval.update({
          where: { id: approvalRecord.id },
          data: {
            decision: LoanApprovalDecision.APPROVED,
            decidedAt: new Date(),
            approverId,
            notes: dto.notes,
          },
        });

        const newStatus = isLastStep
          ? LoanStatus.APPROVED_PENDING_DISBURSEMENT
          : loan.status;

        await tx.loanApplication.update({
          where: { id: loanId },
          data: {
            status: newStatus,
            currentStep: nextStep,
            ...(isLastStep && { approvedAt: new Date() }),
          },
        });

        await tx.loanHistory.create({
          data: {
            loanApplicationId: loanId,
            status: newStatus,
            loanAmount: loan.loanAmount,
            loanTenor: loan.loanTenor,
            loanPurpose: loan.loanPurpose,
            bankAccountNumber: loan.bankAccountNumber,
            interestRate: loan.interestRate,
            monthlyInstallment: loan.monthlyInstallment,
            action: 'APPROVED',
            actionAt: new Date(),
            actionBy: approverId,
            notes: dto.notes,
          },
        });
      });

      if (isLastStep) {
        // Notify shopkeeper for disbursement
        try {
          await this.notifyShopkeepers(loanId);
        } catch (error) {
          console.error('Failed to notify shopkeepers:', error);
        }

        return {
          message: 'Pinjaman berhasil disetujui. Menunggu proses pencairan oleh Shopkeeper.',
        };
      } else {
        // Notify next approver
        try {
          await this.notifyApprovers(loanId, nextStep!, 'APPROVAL_REQUEST');
        } catch (error) {
          console.error('Failed to notify next approver:', error);
        }

        const nextStepName = nextStep === LoanApprovalStep.KETUA ? 'Ketua' : 'Pengawas';
        return {
          message: `Pinjaman berhasil disetujui. Menunggu approval dari ${nextStepName}.`,
        };
      }
    }
  }

  /**
   * Bulk approve/reject
   */
  async bulkProcessApproval(
    approverId: string,
    approverRoles: string[],
    dto: BulkApproveLoanDto,
  ) {
    const results = {
      success: [] as string[],
      failed: [] as { id: string; reason: string }[],
    };

    for (const loanId of dto.loanIds) {
      try {
        await this.processApproval(loanId, approverId, approverRoles, {
          decision: dto.decision,
          notes: dto.notes,
        });
        results.success.push(loanId);
      } catch (error) {
        results.failed.push({
          id: loanId,
          reason: error.message || 'Unknown error',
        });
      }
    }

    return {
      message: `Berhasil memproses ${results.success.length} pinjaman, ${results.failed.length} gagal`,
      results,
    };
  }

  /**
   * Process disbursement (Shopkeeper)
   */
  async processDisbursement(
    loanId: string,
    shopkeeperId: string,
    dto: ProcessDisbursementDto,
  ) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
      include: {
        user: true,
      },
    });

    if (!loan) {
      throw new NotFoundException('Pinjaman tidak ditemukan');
    }

    if (loan.status !== LoanStatus.APPROVED_PENDING_DISBURSEMENT) {
      throw new BadRequestException('Pinjaman tidak dalam status menunggu pencairan');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.loanDisbursement.create({
        data: {
          loanApplicationId: loanId,
          processedBy: shopkeeperId,
          disbursementDate: new Date(dto.disbursementDate),
          disbursementTime: dto.disbursementTime,
          notes: dto.notes,
        },
      });

      const updated = await tx.loanApplication.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.DISBURSEMENT_IN_PROGRESS,
        },
      });

      await tx.loanHistory.create({
        data: {
          loanApplicationId: loanId,
          status: LoanStatus.DISBURSEMENT_IN_PROGRESS,
          loanAmount: loan.loanAmount,
          loanTenor: loan.loanTenor,
          loanPurpose: loan.loanPurpose,
          bankAccountNumber: loan.bankAccountNumber,
          interestRate: loan.interestRate,
          monthlyInstallment: loan.monthlyInstallment,
          action: 'DISBURSEMENT_CREATED',
          actionAt: new Date(),
          actionBy: shopkeeperId,
          notes: `Transaksi BCA dibuat pada ${dto.disbursementDate} jam ${dto.disbursementTime}`,
        },
      });

      return updated;
    });

    // Notify Ketua for authorization
    try {
      await this.notifyKetuaForAuthorization(loanId);
    } catch (error) {
      console.error('Failed to notify ketua:', error);
    }

    return {
      message: 'Transaksi pencairan berhasil dicatat. Menunggu otorisasi dari Ketua.',
      loan: result,
    };
  }

  /**
   * Bulk process disbursement
   */
  async bulkProcessDisbursement(shopkeeperId: string, dto: BulkProcessDisbursementDto) {
    const results = {
      success: [] as string[],
      failed: [] as { id: string; reason: string }[],
    };

    for (const loanId of dto.loanIds) {
      try {
        await this.processDisbursement(loanId, shopkeeperId, {
          disbursementDate: dto.disbursementDate,
          disbursementTime: dto.disbursementTime,
          notes: dto.notes,
        });
        results.success.push(loanId);
      } catch (error) {
        results.failed.push({
          id: loanId,
          reason: error.message || 'Unknown error',
        });
      }
    }

    return {
      message: `Berhasil memproses ${results.success.length} pencairan, ${results.failed.length} gagal`,
      results,
    };
  }

  /**
   * Process authorization (Ketua)
   */
  async processAuthorization(
    loanId: string,
    ketuaId: string,
    dto: ProcessAuthorizationDto,
  ) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
      include: {
        user: true,
        disbursement: true,
      },
    });

    if (!loan) {
      throw new NotFoundException('Pinjaman tidak ditemukan');
    }

    if (loan.status !== LoanStatus.DISBURSEMENT_IN_PROGRESS && 
        loan.status !== LoanStatus.PENDING_AUTHORIZATION) {
      throw new BadRequestException('Pinjaman tidak dalam status menunggu otorisasi');
    }

    if (!loan.disbursement) {
      throw new BadRequestException('Belum ada data pencairan');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.loanAuthorization.create({
        data: {
          loanApplicationId: loanId,
          authorizedBy: ketuaId,
          authorizationDate: new Date(dto.authorizationDate),
          authorizationTime: dto.authorizationTime,
          notes: dto.notes,
        },
      });

      const updated = await tx.loanApplication.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.DISBURSED,
          disbursedAt: new Date(),
        },
      });

      await tx.loanHistory.create({
        data: {
          loanApplicationId: loanId,
          status: LoanStatus.DISBURSED,
          loanAmount: loan.loanAmount,
          loanTenor: loan.loanTenor,
          loanPurpose: loan.loanPurpose,
          bankAccountNumber: loan.bankAccountNumber,
          interestRate: loan.interestRate,
          monthlyInstallment: loan.monthlyInstallment,
          action: 'DISBURSED',
          actionAt: new Date(),
          actionBy: ketuaId,
          notes: `Otorisasi dilakukan pada ${dto.authorizationDate} jam ${dto.authorizationTime}`,
        },
      });

      return updated;
    });

    // Notify all relevant parties
    try {
      await this.notifyLoanCompleted(loanId);
    } catch (error) {
      console.error('Failed to send completion notifications:', error);
    }

    return {
      message: 'Pinjaman berhasil diotorisasi dan dicairkan.',
      loan: result,
    };
  }

  /**
   * Bulk process authorization
   */
  async bulkProcessAuthorization(ketuaId: string, dto: BulkProcessAuthorizationDto) {
    const results = {
      success: [] as string[],
      failed: [] as { id: string; reason: string }[],
    };

    for (const loanId of dto.loanIds) {
      try {
        await this.processAuthorization(loanId, ketuaId, {
          authorizationDate: dto.authorizationDate,
          authorizationTime: dto.authorizationTime,
          notes: dto.notes,
        });
        results.success.push(loanId);
      } catch (error) {
        results.failed.push({
          id: loanId,
          reason: error.message || 'Unknown error',
        });
      }
    }

    return {
      message: `Berhasil memproses ${results.success.length} otorisasi, ${results.failed.length} gagal`,
      results,
    };
  }

  /**
   * Delete draft loan
   */
  async deleteDraft(userId: string, loanId: string) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
    });

    if (!loan) {
      throw new NotFoundException('Pinjaman tidak ditemukan');
    }

    if (loan.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke pinjaman ini');
    }

    if (loan.status !== LoanStatus.DRAFT) {
      throw new BadRequestException('Hanya draft yang bisa dihapus');
    }

    await this.prisma.loanApplication.delete({
      where: { id: loanId },
    });

    return { message: 'Draft pinjaman berhasil dihapus' };
  }

  // ============ NOTIFICATION HELPERS ============

  private async notifyApprovers(loanId: string, step: LoanApprovalStep, type: string) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
      include: {
        user: {
          include: {
            employee: true,
          },
        },
      },
    });

    if (!loan) return;

    const roleName = step === LoanApprovalStep.DIVISI_SIMPAN_PINJAM
      ? 'divisi_simpan_pinjam'
      : step === LoanApprovalStep.KETUA
      ? 'ketua'
      : 'pengawas';

    const approvers = await this.prisma.user.findMany({
      where: {
        roles: {
          some: {
            level: {
              levelName: roleName,
            },
          },
        },
      },
    });

    for (const approver of approvers) {
      try {
        await this.mailService.sendLoanApprovalRequest(
          approver.email,
          approver.name,
          loan.user.name,
          loan.loanNumber,
          loan.loanAmount.toNumber(),
          roleName,
        );
      } catch (error) {
        console.error(`Failed to send approval request to ${approver.email}:`, error);
      }
    }
  }

  private async notifyShopkeepers(loanId: string) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
      include: {
        user: true,
      },
    });

    if (!loan) return;

    const shopkeepers = await this.prisma.user.findMany({
      where: {
        roles: {
          some: {
            level: {
              levelName: 'shopkeeper',
            },
          },
        },
      },
    });

    for (const shopkeeper of shopkeepers) {
      try {
        await this.mailService.sendLoanDisbursementRequest(
          shopkeeper.email,
          shopkeeper.name,
          loan.user.name,
          loan.loanNumber,
          loan.loanAmount.toNumber(),
          loan.bankAccountNumber,
        );
      } catch (error) {
        console.error(`Failed to send disbursement request to ${shopkeeper.email}:`, error);
      }
    }
  }

  private async notifyKetuaForAuthorization(loanId: string) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
      include: {
        user: true,
        disbursement: true,
      },
    });

    if (!loan) return;

    const ketuas = await this.prisma.user.findMany({
      where: {
        roles: {
          some: {
            level: {
              levelName: 'ketua',
            },
          },
        },
      },
    });

    for (const ketua of ketuas) {
      try {
        await this.mailService.sendLoanAuthorizationRequest(
          ketua.email,
          ketua.name,
          loan.user.name,
          loan.loanNumber,
          loan.loanAmount.toNumber(),
        );
      } catch (error) {
        console.error(`Failed to send authorization request to ${ketua.email}:`, error);
      }
    }
  }

  private async notifyLoanCompleted(loanId: string) {
    const loan = await this.prisma.loanApplication.findUnique({
      where: { id: loanId },
      include: {
        user: true,
        approvals: {
          include: {
            approver: true,
          },
        },
        disbursement: {
          include: {
            processedByUser: true,
          },
        },
        authorization: {
          include: {
            authorizedByUser: true,
          },
        },
      },
    });

    if (!loan) return;

    // Notify applicant
    try {
      await this.mailService.sendLoanDisbursed(
        loan.user.email,
        loan.user.name,
        loan.loanNumber,
        loan.loanAmount.toNumber(),
        loan.bankAccountNumber,
      );
    } catch (error) {
      console.error('Failed to notify applicant:', error);
    }

    // Notify all approvers and processors
    const notifyUsers = new Set<string>();

    loan.approvals.forEach((a) => {
      if (a.approver) notifyUsers.add(a.approver.email);
    });

    if (loan.disbursement?.processedByUser) {
      notifyUsers.add(loan.disbursement.processedByUser.email);
    }

    for (const email of notifyUsers) {
      try {
        await this.mailService.sendLoanCompletionNotification(
          email,
          loan.user.name,
          loan.loanNumber,
          loan.loanAmount.toNumber(),
        );
      } catch (error) {
        console.error(`Failed to send completion notification to ${email}:`, error);
      }
    }
  }
}