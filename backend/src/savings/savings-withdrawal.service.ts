import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateSavingsWithdrawalDto } from './dto/withdrawal/create-savings-withdrawal.dto';
import { ApproveSavingsWithdrawalDto } from './dto/withdrawal/approve-savings-withdrawal.dto';
import { ConfirmDisbursementDto } from './dto/withdrawal/confirm-disbursement.dto';
import { ConfirmAuthorizationDto } from './dto/withdrawal/confirm-authorization.dto';
import { QuerySavingsWithdrawalDto } from './dto/withdrawal/query-savings-withdrawal.dto';
import { BulkApproveSavingsWithdrawalDto } from './dto/withdrawal/bulk-approve-savings-withdrawal.dto';
import { BulkConfirmDisbursementDto } from './dto/withdrawal/bulk-confirm-disbursement.dto';
import { BulkConfirmAuthorizationDto } from './dto/withdrawal/bulk-confirm-authorization.dto';
import {
    SavingsWithdrawalStatus,
    SavingsWithdrawalStep,
    ApprovalDecision,
    DepositStatus,
    Prisma,
} from '@prisma/client';
import { PaginatedResult } from '../common/interfaces/pagination.interface';

@Injectable()
export class SavingsWithdrawalService {
    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
    ) { }

    private async generateWithdrawalNumber(): Promise<string> {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

        const lastWithdrawal = await this.prisma.savingsWithdrawal.findFirst({
            where: {
                withdrawalNumber: {
                    startsWith: `SW-${dateStr}`,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        let sequence = 1;
        if (lastWithdrawal) {
            const lastSequence = parseInt(lastWithdrawal.withdrawalNumber.split('-')[2]);
            sequence = lastSequence + 1;
        }

        return `SW-${dateStr}-${sequence.toString().padStart(4, '0')}`;
    }

    private async getPenaltyRate(): Promise<number> {
        const setting = await this.prisma.cooperativeSetting.findUnique({
            where: { key: 'deposit_early_withdrawal_penalty_rate' },
        });
        return setting ? parseFloat(setting.value) : 3;
    }

    private async checkEarlyDepositPenalty(userId: string, withdrawalAmount: number) {
        const now = new Date();
        const penaltyRate = await this.getPenaltyRate();

        // Check if user has active deposits that haven't matured
        const activeDeposits = await this.prisma.depositApplication.findMany({
            where: {
                userId,
                status: {
                    in: [DepositStatus.ACTIVE, DepositStatus.APPROVED],
                },
                maturityDate: {
                    gt: now,
                },
            },
        });

        if (activeDeposits.length > 0) {
            // Has early deposits - apply penalty
            const penaltyAmount = (withdrawalAmount * penaltyRate) / 100;
            return {
                hasEarlyDepositPenalty: true,
                penaltyRate,
                penaltyAmount,
                netAmount: withdrawalAmount - penaltyAmount,
            };
        }

        return {
            hasEarlyDepositPenalty: false,
            penaltyRate: 0,
            penaltyAmount: 0,
            netAmount: withdrawalAmount,
        };
    }

    async createWithdrawal(userId: string, dto: CreateSavingsWithdrawalDto) {
        // 1. Check savings account
        const savingsAccount = await this.prisma.savingsAccount.findUnique({
            where: { userId },
            include: {
                user: {
                    include: {
                        employee: true,
                    },
                },
            },
        });

        if (!savingsAccount) {
            throw new NotFoundException('Akun tabungan tidak ditemukan');
        }

        // 2. Check available balance (saldoSukarela)
        const availableBalance = savingsAccount.saldoSukarela.toNumber();

        if (dto.withdrawalAmount > availableBalance) {
            throw new BadRequestException(
                `Saldo tidak mencukupi. Saldo tersedia: Rp ${availableBalance.toLocaleString('id-ID')}`,
            );
        }

        // 3. Check for pending withdrawal
        const pendingWithdrawal = await this.prisma.savingsWithdrawal.findFirst({
            where: {
                userId,
                status: {
                    notIn: [
                        SavingsWithdrawalStatus.COMPLETED,
                        SavingsWithdrawalStatus.REJECTED,
                        SavingsWithdrawalStatus.CANCELLED,
                    ],
                },
            },
        });

        if (pendingWithdrawal) {
            throw new BadRequestException(
                'Anda masih memiliki pengajuan penarikan yang sedang diproses',
            );
        }

        // 4. Check for early deposit penalty
        const penaltyCalc = await this.checkEarlyDepositPenalty(userId, dto.withdrawalAmount);

        // 5. Check if net amount is still valid after penalty
        if (penaltyCalc.netAmount > availableBalance) {
            throw new BadRequestException(
                `Saldo tidak mencukupi setelah pinalti. Saldo tersedia: Rp ${availableBalance.toLocaleString('id-ID')}`,
            );
        }

        // 6. Generate withdrawal number
        const withdrawalNumber = await this.generateWithdrawalNumber();

        // 7. Create withdrawal
        const withdrawal = await this.prisma.savingsWithdrawal.create({
            data: {
                withdrawalNumber,
                userId,
                withdrawalAmount: dto.withdrawalAmount,
                hasEarlyDepositPenalty: penaltyCalc.hasEarlyDepositPenalty,
                penaltyRate: penaltyCalc.penaltyRate,
                penaltyAmount: penaltyCalc.penaltyAmount,
                netAmount: penaltyCalc.netAmount,
                bankAccountNumber: dto.bankAccountNumber || savingsAccount.user.bankAccountNumber,
                notes: dto.notes,
                status: SavingsWithdrawalStatus.SUBMITTED,
                currentStep: SavingsWithdrawalStep.DIVISI_SIMPAN_PINJAM,
                submittedAt: new Date(),
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

        // 8. Notify DSP
        try {
            await this.notifyApprovers(
                withdrawal.id,
                SavingsWithdrawalStep.DIVISI_SIMPAN_PINJAM,
            );
        } catch (error) {
            console.error('Failed to send notification:', error);
        }

        return {
            message: 'Pengajuan penarikan tabungan berhasil disubmit',
            withdrawal,
            calculation: {
                withdrawalAmount: dto.withdrawalAmount,
                hasEarlyDepositPenalty: penaltyCalc.hasEarlyDepositPenalty,
                penaltyRate: penaltyCalc.penaltyRate,
                penaltyAmount: penaltyCalc.penaltyAmount,
                netAmount: penaltyCalc.netAmount,
                availableBalance,
            },
        };
    }

    async getMyWithdrawals(
        userId: string,
        query: QuerySavingsWithdrawalDto,
    ): Promise<PaginatedResult<any>> {
        const {
            page = 1,
            limit = 10,
            status,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = query;

        const skip = (page - 1) * limit;
        const where: Prisma.SavingsWithdrawalWhereInput = { userId };

        if (status) where.status = status;

        if (search) {
            where.OR = [
                { withdrawalNumber: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.savingsWithdrawal.findMany({
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
                            processedByUser: true,
                        },
                    },
                    authorization: {
                        include: {
                            authorizedByUser: true,
                        },
                    },
                },
            }),
            this.prisma.savingsWithdrawal.count({ where }),
        ]);

        return {
            data,
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

    async getWithdrawalById(withdrawalId: string, userId?: string) {
        const withdrawal = await this.prisma.savingsWithdrawal.findUnique({
            where: { id: withdrawalId },
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
        });

        if (!withdrawal) {
            throw new NotFoundException('Penarikan tidak ditemukan');
        }

        if (userId && withdrawal.userId !== userId) {
            throw new ForbiddenException('Anda tidak memiliki akses ke penarikan ini');
        }

        return withdrawal;
    }

    async getAllWithdrawals(query: QuerySavingsWithdrawalDto): Promise<PaginatedResult<any>> {
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
        const where: Prisma.SavingsWithdrawalWhereInput = {};

        if (status) where.status = status;
        if (step) where.currentStep = step;
        if (userId) where.userId = userId;

        if (search) {
            where.OR = [
                { withdrawalNumber: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
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

        const [data, total] = await Promise.all([
            this.prisma.savingsWithdrawal.findMany({
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
                            processedByUser: true,
                        },
                    },
                    authorization: {
                        include: {
                            authorizedByUser: true,
                        },
                    },
                },
            }),
            this.prisma.savingsWithdrawal.count({ where }),
        ]);

        return {
            data,
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

    async processApproval(
        withdrawalId: string,
        approverId: string,
        approverRoles: string[],
        dto: ApproveSavingsWithdrawalDto,
    ) {
        const withdrawal = await this.prisma.savingsWithdrawal.findUnique({
            where: { id: withdrawalId },
            include: {
                user: true,
                approvals: true,
            },
        });

        if (!withdrawal) {
            throw new NotFoundException('Penarikan tidak ditemukan');
        }

        if (!withdrawal.currentStep) {
            throw new BadRequestException('Penarikan tidak dalam status review');
        }

        const roleStepMap: { [key: string]: SavingsWithdrawalStep } = {
            divisi_simpan_pinjam: SavingsWithdrawalStep.DIVISI_SIMPAN_PINJAM,
            ketua: SavingsWithdrawalStep.KETUA,
        };

        const approverStep = approverRoles
            .map((role) => roleStepMap[role])
            .find((step) => step === withdrawal.currentStep);

        if (!approverStep) {
            throw new ForbiddenException(
                'Anda tidak memiliki akses untuk approve di step ini',
            );
        }

        const existingApproval = withdrawal.approvals.find(
            (a) => a.step === withdrawal.currentStep && a.decision,
        );

        if (existingApproval) {
            throw new BadRequestException('Step ini sudah diproses sebelumnya');
        }

        if (dto.decision === ApprovalDecision.REJECTED) {
            return this.handleRejection(withdrawal, approverId, dto);
        } else {
            return this.handleApproval(withdrawal, approverId, dto);
        }
    }

    private async handleRejection(
        withdrawal: any,
        approverId: string,
        dto: ApproveSavingsWithdrawalDto,
    ) {
        await this.prisma.$transaction(async (tx) => {
            await tx.savingsWithdrawalApproval.create({
                data: {
                    savingsWithdrawalId: withdrawal.id,
                    step: withdrawal.currentStep,
                    decision: ApprovalDecision.REJECTED,
                    approverId,
                    notes: dto.notes,
                    decidedAt: new Date(),
                },
            });

            await tx.savingsWithdrawal.update({
                where: { id: withdrawal.id },
                data: {
                    status: SavingsWithdrawalStatus.REJECTED,
                    rejectedAt: new Date(),
                    rejectionReason: dto.notes,
                    currentStep: null,
                },
            });
        });

        try {
            await this.mailService.sendSavingsWithdrawalRejected(
                withdrawal.user.email,
                withdrawal.user.name,
                withdrawal.withdrawalNumber,
                dto.notes || 'Tidak ada catatan',
            );
        } catch (error) {
            console.error('Failed to send rejection email:', error);
        }

        return { message: 'Penarikan tabungan berhasil ditolak' };
    }

    private async handleApproval(
        withdrawal: any,
        approverId: string,
        dto: ApproveSavingsWithdrawalDto,
    ) {
        const stepOrder = [
            SavingsWithdrawalStep.DIVISI_SIMPAN_PINJAM,
            SavingsWithdrawalStep.KETUA,
            SavingsWithdrawalStep.SHOPKEEPER,
            SavingsWithdrawalStep.KETUA_AUTH,
        ];

        const currentIndex = stepOrder.indexOf(withdrawal.currentStep);
        const nextStep = stepOrder[currentIndex + 1];

        let newStatus = withdrawal.status;
        if (nextStep === SavingsWithdrawalStep.KETUA) {
            newStatus = SavingsWithdrawalStatus.UNDER_REVIEW_KETUA;
        } else if (nextStep === SavingsWithdrawalStep.SHOPKEEPER) {
            newStatus = SavingsWithdrawalStatus.APPROVED_WAITING_DISBURSEMENT;
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.savingsWithdrawalApproval.create({
                data: {
                    savingsWithdrawalId: withdrawal.id,
                    step: withdrawal.currentStep,
                    decision: ApprovalDecision.APPROVED,
                    approverId,
                    notes: dto.notes,
                    decidedAt: new Date(),
                },
            });

            await tx.savingsWithdrawal.update({
                where: { id: withdrawal.id },
                data: {
                    status: newStatus,
                    currentStep: nextStep,
                },
            });
        });

        try {
            if (nextStep) {
                await this.notifyApprovers(withdrawal.id, nextStep);
            }
        } catch (error) {
            console.error('Failed to notify next step:', error);
        }

        return {
            message: `Penarikan berhasil disetujui. ${nextStep ? 'Menunggu approval tahap selanjutnya.' : ''}`,
        };
    }

    async bulkProcessApproval(
        approverId: string,
        approverRoles: string[],
        dto: BulkApproveSavingsWithdrawalDto,
    ) {
        const results = {
            success: [] as string[],
            failed: [] as { id: string; reason: string }[],
        };

        for (const withdrawalId of dto.withdrawalIds) {
            try {
                await this.processApproval(withdrawalId, approverId, approverRoles, {
                    decision: dto.decision,
                    notes: dto.notes,
                });
                results.success.push(withdrawalId);
            } catch (error) {
                results.failed.push({
                    id: withdrawalId,
                    reason: error.message || 'Unknown error',
                });
            }
        }


        return {
            message: `Berhasil memproses ${results.success.length} penarikan, ${results.failed.length} gagal`,
            results,
        };
    }

    async bulkConfirmDisbursement(
        processedBy: string,
        dto: BulkConfirmDisbursementDto,
    ) {
        const results = {
            success: [] as string[],
            failed: [] as { id: string; reason: string }[],
        };

        for (const withdrawalId of dto.withdrawalIds) {
            try {
                await this.confirmDisbursement(withdrawalId, processedBy, {
                    transactionDate: dto.transactionDate,
                    notes: dto.notes,
                });
                results.success.push(withdrawalId);
            } catch (error) {
                results.failed.push({
                    id: withdrawalId,
                    reason: error.message || 'Unknown error',
                });
            }
        }

        return {
            message: `Berhasil memproses ${results.success.length} pencairan, ${results.failed.length} gagal`,
            results,
        };
    }

    async bulkConfirmAuthorization(
        authorizedBy: string,
        dto: BulkConfirmAuthorizationDto,
    ) {
        const results = {
            success: [] as string[],
            failed: [] as { id: string; reason: string }[],
        };

        for (const withdrawalId of dto.withdrawalIds) {
            try {
                await this.confirmAuthorization(withdrawalId, authorizedBy, {
                    authorizationDate: dto.authorizationDate,
                    notes: dto.notes,
                });
                results.success.push(withdrawalId);
            } catch (error) {
                results.failed.push({
                    id: withdrawalId,
                    reason: error.message || 'Unknown error',
                });
            }
        }

        return {
            message: `Berhasil memproses ${results.success.length} otorisasi, ${results.failed.length} gagal`,
            results,
        };
    }


    async confirmDisbursement(
        withdrawalId: string,
        processedBy: string,
        dto: ConfirmDisbursementDto,
    ) {
        const withdrawal = await this.prisma.savingsWithdrawal.findUnique({
            where: { id: withdrawalId },
            include: {
                user: true,
            },
        });

        if (!withdrawal) {
            throw new NotFoundException('Penarikan tidak ditemukan');
        }

        if (withdrawal.currentStep !== SavingsWithdrawalStep.SHOPKEEPER) {
            throw new BadRequestException(
                'Penarikan tidak dalam tahap konfirmasi shopkeeper',
            );
        }

        if (withdrawal.status !== SavingsWithdrawalStatus.APPROVED_WAITING_DISBURSEMENT) {
            throw new BadRequestException('Status penarikan tidak valid untuk disbursement');
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.savingsWithdrawalDisbursement.create({
                data: {
                    savingsWithdrawalId: withdrawalId,
                    processedBy,
                    transactionDate: dto.transactionDate
                        ? new Date(dto.transactionDate)
                        : new Date(),
                    notes: dto.notes,
                },
            });

            await tx.savingsWithdrawal.update({
                where: { id: withdrawalId },
                data: {
                    status: SavingsWithdrawalStatus.DISBURSEMENT_IN_PROGRESS,
                    currentStep: SavingsWithdrawalStep.KETUA_AUTH,
                },
            });
        });

        try {
            await this.notifyApprovers(withdrawalId, SavingsWithdrawalStep.KETUA_AUTH);
        } catch (error) {
            console.error('Failed to notify ketua for authorization:', error);
        }

        return {
            message: 'Transaksi berhasil dikonfirmasi. Menunggu otorisasi dari Ketua.',
        };
    }

    async confirmAuthorization(
        withdrawalId: string,
        authorizedBy: string,
        dto: ConfirmAuthorizationDto,
    ) {
        const withdrawal = await this.prisma.savingsWithdrawal.findUnique({
            where: { id: withdrawalId },
            include: {
                user: true,
            },
        });

        if (!withdrawal) {
            throw new NotFoundException('Penarikan tidak ditemukan');
        }

        if (withdrawal.currentStep !== SavingsWithdrawalStep.KETUA_AUTH) {
            throw new BadRequestException('Penarikan tidak dalam tahap otorisasi ketua');
        }

        if (withdrawal.status !== SavingsWithdrawalStatus.DISBURSEMENT_IN_PROGRESS) {
            throw new BadRequestException('Status penarikan tidak valid untuk otorisasi');
        }

        await this.prisma.$transaction(async (tx) => {
            // Create authorization record
            await tx.savingsWithdrawalAuthorization.create({
                data: {
                    savingsWithdrawalId: withdrawalId,
                    authorizedBy,
                    authorizationDate: dto.authorizationDate
                        ? new Date(dto.authorizationDate)
                        : new Date(),
                    notes: dto.notes,
                },
            });

            // Update withdrawal status to COMPLETED
            await tx.savingsWithdrawal.update({
                where: { id: withdrawalId },
                data: {
                    status: SavingsWithdrawalStatus.COMPLETED,
                    completedAt: new Date(),
                    currentStep: null,
                },
            });

            // Update savings account - deduct from saldoSukarela
            const savingsAccount = await tx.savingsAccount.findUnique({
                where: { userId: withdrawal.userId },
            });

            if (savingsAccount) {
                await tx.savingsAccount.update({
                    where: { userId: withdrawal.userId },
                    data: {
                        saldoSukarela: {
                            decrement: withdrawal.netAmount.toNumber(),
                        },
                    },
                });

                // Create savings transaction record (penarikan)
                await tx.savingsTransaction.create({
                    data: {
                        savingsAccountId: savingsAccount.id,
                        penarikan: withdrawal.netAmount.toNumber(),
                        transactionDate: new Date(),
                        createdBy: authorizedBy,
                        interestRate: 0,
                    },
                });
            }
        });

        // Notify user
        try {
            await this.mailService.sendSavingsWithdrawalCompleted(
                withdrawal.user.email,
                withdrawal.user.name,
                withdrawal.withdrawalNumber,
                withdrawal.netAmount.toNumber(),
            );
        } catch (error) {
            console.error('Failed to send completion email:', error);
        }

        return {
            message: 'Penarikan tabungan berhasil diselesaikan dan dana telah ditransfer.',
        };
    }

    async cancelWithdrawal(userId: string, withdrawalId: string) {
        const withdrawal = await this.prisma.savingsWithdrawal.findUnique({
            where: { id: withdrawalId },
        });

        if (!withdrawal) {
            throw new NotFoundException('Penarikan tidak ditemukan');
        }

        if (withdrawal.userId !== userId) {
            throw new ForbiddenException('Anda tidak memiliki akses ke penarikan ini');
        }

        if (
            withdrawal.status !== SavingsWithdrawalStatus.SUBMITTED &&
            withdrawal.status !== SavingsWithdrawalStatus.UNDER_REVIEW_DSP &&
            withdrawal.status !== SavingsWithdrawalStatus.UNDER_REVIEW_KETUA
        ) {
            throw new BadRequestException(
                'Hanya penarikan yang belum diproses yang dapat dibatalkan',
            );
        }

        await this.prisma.savingsWithdrawal.update({
            where: { id: withdrawalId },
            data: {
                status: SavingsWithdrawalStatus.CANCELLED,
                currentStep: null,
            },
        });

        return { message: 'Penarikan tabungan berhasil dibatalkan' };
    }

    private async notifyApprovers(
        withdrawalId: string,
        step: SavingsWithdrawalStep,
    ) {
        const withdrawal = await this.prisma.savingsWithdrawal.findUnique({
            where: { id: withdrawalId },
            include: {
                user: {
                    include: {
                        employee: true,
                    },
                },
            },
        });

        if (!withdrawal) return;

        let roleName: string;
        let recipients: any[] = [];

        switch (step) {
            case SavingsWithdrawalStep.DIVISI_SIMPAN_PINJAM:
                roleName = 'divisi_simpan_pinjam';
                break;
            case SavingsWithdrawalStep.KETUA:
            case SavingsWithdrawalStep.KETUA_AUTH:
                roleName = 'ketua';
                break;
            case SavingsWithdrawalStep.SHOPKEEPER:
                roleName = 'shopkeeper';
                break;
        }

        recipients = await this.prisma.user.findMany({
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

        for (const recipient of recipients) {
            try {
                if (step === SavingsWithdrawalStep.SHOPKEEPER) {
                    await this.mailService.sendSavingsWithdrawalDisbursementRequest(
                        recipient.email,
                        recipient.name,
                        withdrawal.user.name,
                        withdrawal.withdrawalNumber,
                        withdrawal.netAmount.toNumber(),
                        withdrawal.bankAccountNumber || '',
                    );
                } else if (step === SavingsWithdrawalStep.KETUA_AUTH) {
                    await this.mailService.sendSavingsWithdrawalAuthorizationRequest(
                        recipient.email,
                        recipient.name,
                        withdrawal.user.name,
                        withdrawal.withdrawalNumber,
                        withdrawal.netAmount.toNumber(),
                    );
                } else {
                    await this.mailService.sendSavingsWithdrawalApprovalRequest(
                        recipient.email,
                        recipient.name,
                        withdrawal.user.name,
                        withdrawal.withdrawalNumber,
                        withdrawal.withdrawalAmount.toNumber(),
                        roleName,
                    );
                }
            } catch (error) {
                console.error(`Failed to send notification to ${recipient.email}:`, error);
            }
        }
    }
}