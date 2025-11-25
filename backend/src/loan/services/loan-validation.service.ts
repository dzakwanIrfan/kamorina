import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmployeeType, LoanType } from '@prisma/client';

@Injectable()
export class LoanValidationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if user is verified member and eligible for loan
   */
  async checkMemberStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          include: {
            department: true,
            golongan: true,
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

    if (user.employee.employeeType !== EmployeeType.TETAP) {
      throw new ForbiddenException('Hanya karyawan tetap yang dapat mengajukan pinjaman');
    }

    if (!user.memberVerified) {
      throw new ForbiddenException('Anda harus menjadi anggota terverifikasi untuk mengajukan pinjaman');
    }

    return user;
  }

  /**
   * Validate loan tenor against settings
   */
  async validateLoanTenor(tenor: number) {
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
   * Calculate years of service from employee number
   */
  calculateYearsOfService(employeeNumber: string): number {
    if (!employeeNumber || employeeNumber.length < 4) {
      return 0;
    }

    const yearMonth = employeeNumber.substring(1, 4);
    const year = parseInt('20' + yearMonth.substring(0, 2));
    const month = parseInt(yearMonth.substring(2, 3));

    const hireDate = new Date(year, month - 1, 1);
    const now = new Date();

    let years = now.getFullYear() - hireDate.getFullYear();
    const monthDiff = now.getMonth() - hireDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < hireDate.getDate())) {
      years--;
    }

    return Math.max(0, years);
  }

  /**
   * Get loan eligibility for user
   */
  async getLoanEligibility(userId: string, loanType: LoanType) {
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

    if (user.employee.employeeType !== EmployeeType.TETAP) {
      throw new ForbiddenException('Hanya karyawan tetap yang dapat mengajukan pinjaman');
    }

    if (!user.memberVerified) {
      throw new ForbiddenException('Anda harus menjadi anggota terverifikasi untuk mengajukan pinjaman');
    }

    const yearsOfService = this.calculateYearsOfService(user.employee.employeeNumber);

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

    let maxLoanAmount: number;

    if (loanType === LoanType.CASH_LOAN) {
      // For cash loan, use plafond matrix
      const loanLimit = await this.prisma.loanLimitMatrix.findFirst({
        where: {
          golonganId: user.employee.golonganId,
          minYearsOfService: { lte: yearsOfService },
          OR: [
            { maxYearsOfService: { gte: yearsOfService } },
            { maxYearsOfService: null },
          ],
        },
        include: {
          golongan: true,
        },
      });

      if (!loanLimit) {
        throw new BadRequestException(
          `Tidak ada plafond pinjaman yang tersedia untuk golongan ${user.employee.golongan.golonganName} dengan masa kerja ${yearsOfService} tahun`,
        );
      }

      maxLoanAmount = Number(loanLimit.maxLoanAmount);
    } else {
      // For goods loans, use max_goods_loan_amount setting (15 juta)
      const maxGoodsLoanSetting = await this.prisma.cooperativeSetting.findUnique({
        where: { key: 'max_goods_loan_amount' },
      });
      maxLoanAmount = maxGoodsLoanSetting ? parseFloat(maxGoodsLoanSetting.value) : 15000000;
    }

    if (maxLoanAmount === 0) {
      throw new BadRequestException(
        `Plafond pinjaman untuk masa kerja ${yearsOfService} tahun adalah 0. Anda belum memenuhi syarat untuk mengajukan pinjaman.`,
      );
    }

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
    };
  }
}