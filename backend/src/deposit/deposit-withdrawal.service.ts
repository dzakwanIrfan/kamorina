import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateDepositWithdrawalDto } from './dto/withdrawal/create-withdrawal.dto';
import { ApproveWithdrawalDto } from './dto/withdrawal/approve-withdrawal.dto';
import { ConfirmDisbursementDto } from './dto/withdrawal/confirm-disbursement.dto';
import { ConfirmAuthorizationDto } from './dto/withdrawal/confirm-authorization.dto';
import { QueryWithdrawalDto } from './dto/withdrawal/query-withdrawal.dto';
import { BulkApproveWithdrawalDto } from './dto/withdrawal/bulk-approve-withdrawal.dto';
import {
    DepositWithdrawalStatus,
    DepositWithdrawalStep,
    ApprovalDecision,
    DepositStatus,
    Prisma,
} from '@prisma/client';
import { PaginatedResult } from '../common/interfaces/pagination.interface';

@Injectable()
export class DepositWithdrawalService {
    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
    ) { }

    /**
     * Generate withdrawal number: WD-YYYYMMDD-XXXX
     */
    private async generateWithdrawalNumber(): Promise<string> {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

        const lastWithdrawal = await this.prisma.depositWithdrawal.findFirst({
            where: {
                withdrawalNumber: {
                    startsWith: `WD-${dateStr}`,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        let sequence = 1;
        if (lastWithdrawal) {
            const lastSequence = parseInt(lastWithdrawal.withdrawalNumber.split('-')[2]);
            sequence = lastSequence + 1;
        }

        return `WD-${dateStr}-${sequence.toString().padStart(4, '0')}`;
    }

    /**
     * Get penalty rate from settings
     */
    private async getPenaltyRate(): Promise<number> {
        const setting = await this.prisma.cooperativeSetting.findUnique({
            where: { key: 'deposit_early_withdrawal_penalty_rate' },
        });
        return setting ? parseFloat(setting.value) : 3;
    }

    /**
     * Calculate penalty and net amount
     */
    private async calculateWithdrawal(
        depositApplication: any,
        withdrawalAmount: number,
    ) {
        const penaltyRate = await this.getPenaltyRate();
        const now = new Date();
        const maturityDate = depositApplication.maturityDate;

        let isEarlyWithdrawal = false;
        let penaltyAmount = 0;

        // Check if early withdrawal (before maturity date)
        if (maturityDate && now < maturityDate) {
            isEarlyWithdrawal = true;
            penaltyAmount = (withdrawalAmount * penaltyRate) / 100;
        }

        const netAmount = withdrawalAmount - penaltyAmount;

        return {
            isEarlyWithdrawal,
            penaltyRate,
            penaltyAmount,
            netAmount,
        };
    }

    /**
     * Create withdrawal request
     */
    async createWithdrawal(userId: string, dto: CreateDepositWithdrawalDto) {
        // 1. Validate deposit application
        const depositApplication = await this.prisma.depositApplication.findUnique({
            where: { id: dto.depositApplicationId },
            include: {
                user: {
                    include: {
                        employee: true,
                    },
                },
            },
        });

        if (!depositApplication) {
            throw new NotFoundException('Deposito tidak ditemukan');
        }

        if (depositApplication.userId !== userId) {
            throw new ForbiddenException('Anda tidak memiliki akses ke deposito ini');
        }

        // Check deposit status
        if (
            depositApplication.status !== DepositStatus.ACTIVE &&
            depositApplication.status !== DepositStatus.APPROVED
        ) {
            throw new BadRequestException(
                'Hanya deposito yang aktif atau sudah disetujui yang dapat ditarik',
            );
        }

        // 2. Check if there's pending withdrawal for this deposit
        const pendingWithdrawal = await this.prisma.depositWithdrawal.findFirst({
            where: {
                depositApplicationId: dto.depositApplicationId,
                status: {
                    notIn: [
                        DepositWithdrawalStatus.COMPLETED,
                        DepositWithdrawalStatus.REJECTED,
                        DepositWithdrawalStatus.CANCELLED,
                    ],
                },
            },
        });

        if (pendingWithdrawal) {
            throw new BadRequestException(
                'Sudah ada pengajuan penarikan yang sedang diproses untuk deposito ini',
            );
        }

        // 3. Check savings account balance (saldoSukarela)
        const savingsAccount = await this.prisma.savingsAccount.findUnique({
            where: { userId },
        });

        if (!savingsAccount) {
            throw new NotFoundException('Akun tabungan tidak ditemukan');
        }

        // Calculate available balance (collected amount from deposit)
        const collectedAmount = depositApplication.collectedAmount.toNumber();

        if (dto.withdrawalAmount > collectedAmount) {
            throw new BadRequestException(
                `Jumlah penarikan melebihi saldo deposito yang sudah terkumpul. Saldo tersedia: Rp ${collectedAmount.toLocaleString('id-ID')}`,
            );
        }

        // 4. Calculate penalty and net amount
        const calculation = await this.calculateWithdrawal(
            depositApplication,
            dto.withdrawalAmount,
        );

        // 5. Generate withdrawal number
        const withdrawalNumber = await this.generateWithdrawalNumber();

        // 6. Create withdrawal request
        const withdrawal = await this.prisma.depositWithdrawal.create({
            data: {
                withdrawalNumber,
                depositApplicationId: dto.depositApplicationId,
                userId,
                withdrawalAmount: dto.withdrawalAmount,
                isEarlyWithdrawal: calculation.isEarlyWithdrawal,
                penaltyRate: calculation.penaltyRate,
                penaltyAmount: calculation.penaltyAmount,
                netAmount: calculation.netAmount,
                bankAccountNumber: dto.bankAccountNumber || depositApplication.user.bankAccountNumber,
                notes: dto.notes,
                status: DepositWithdrawalStatus.SUBMITTED,
                currentStep: DepositWithdrawalStep.DIVISI_SIMPAN_PINJAM,
                submittedAt: new Date(),
            },
            include: {
                depositApplication: true,
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

        // 7. Notify DSP
        try {
            await this.notifyApprovers(
                withdrawal.id,
                DepositWithdrawalStep.DIVISI_SIMPAN_PINJAM,
            );
        } catch (error) {
            console.error('Failed to send notification:', error);
        }

        return {
            message: 'Pengajuan penarikan deposito berhasil disubmit',
            withdrawal,
            calculation: {
                withdrawalAmount: dto.withdrawalAmount,
                isEarlyWithdrawal: calculation.isEarlyWithdrawal,
                penaltyRate: calculation.penaltyRate,
                penaltyAmount: calculation.penaltyAmount,
                netAmount: calculation.netAmount,
                maturityDate: depositApplication.maturityDate,
            },
        };
    }

    /**
     * Get my withdrawals
     */
    async getMyWithdrawals(
        userId: string,
        query: QueryWithdrawalDto,
    ): Promise<PaginatedResult<any>> {
        const {
            page = 1,
            limit = 10,
            status,
            depositApplicationId,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = query;

        const skip = (page - 1) * limit;
        const where: Prisma.DepositWithdrawalWhereInput = { userId };

        if (status) where.status = status;
        if (depositApplicationId) where.depositApplicationId = depositApplicationId;

        if (search) {
            where.OR = [
                { withdrawalNumber: { contains: search, mode: 'insensitive' } },
                {
                    depositApplication: {
                        depositNumber: { contains: search, mode: 'insensitive' },
                    },
                },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.depositWithdrawal.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    depositApplication: true,
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
                },
            }),
            this.prisma.depositWithdrawal.count({ where }),
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

    /**
     * Get withdrawal by ID
     */
    async getWithdrawalById(withdrawalId: string, userId?: string) {
        const withdrawal = await this.prisma.depositWithdrawal.findUnique({
            where: { id: withdrawalId },
            include: {
                depositApplication: true,
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

    /**
     * Get all withdrawals (for approvers/admin)
     */
    async getAllWithdrawals(query: QueryWithdrawalDto): Promise<PaginatedResult<any>> {
        const {
            page = 1,
            limit = 10,
            status,
            step,
            userId,
            depositApplicationId,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            startDate,
            endDate,
        } = query;

        const skip = (page - 1) * limit;
        const where: Prisma.DepositWithdrawalWhereInput = {};

        if (status) where.status = status;
        if (step) where.currentStep = step;
        if (userId) where.userId = userId;
        if (depositApplicationId) where.depositApplicationId = depositApplicationId;

        if (search) {
            where.OR = [
                { withdrawalNumber: { contains: search, mode: 'insensitive' } },
                {
                    depositApplication: {
                        depositNumber: { contains: search, mode: 'insensitive' },
                    },
                },
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
            this.prisma.depositWithdrawal.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    depositApplication: true,
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
                },
            }),
            this.prisma.depositWithdrawal.count({ where }),
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

    /**
     * Process approval (DSP, Ketua)
     */
    async processApproval(
        withdrawalId: string,
        approverId: string,
        approverRoles: string[],
        dto: ApproveWithdrawalDto,
    ) {
        const withdrawal = await this.prisma.depositWithdrawal.findUnique({
            where: { id: withdrawalId },
            include: {
                user: true,
                depositApplication: true,
                approvals: true,
            },
        });

        if (!withdrawal) {
            throw new NotFoundException('Penarikan tidak ditemukan');
        }

        if (!withdrawal.currentStep) {
            throw new BadRequestException('Penarikan tidak dalam status review');
        }

        // Map role to step
        const roleStepMap: { [key: string]: DepositWithdrawalStep } = {
            divisi_simpan_pinjam: DepositWithdrawalStep.DIVISI_SIMPAN_PINJAM,
            ketua: DepositWithdrawalStep.KETUA,
        };

        const approverStep = approverRoles
            .map((role) => roleStepMap[role])
            .find((step) => step === withdrawal.currentStep);

        if (!approverStep) {
            throw new ForbiddenException(
                'Anda tidak memiliki akses untuk approve di step ini',
            );
        }

        // Check if already approved at this step
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

    /**
     * Handle rejection
     */
    private async handleRejection(
        withdrawal: any,
        approverId: string,
        dto: ApproveWithdrawalDto,
    ) {
        await this.prisma.$transaction(async (tx) => {
            // Create approval record
            await tx.depositWithdrawalApproval.create({
                data: {
                    depositWithdrawalId: withdrawal.id,
                    step: withdrawal.currentStep,
                    decision: ApprovalDecision.REJECTED,
                    approverId,
                    notes: dto.notes,
                    decidedAt: new Date(),
                },
            });

            // Update withdrawal status
            await tx.depositWithdrawal.update({
                where: { id: withdrawal.id },
                data: {
                    status: DepositWithdrawalStatus.REJECTED,
                    rejectedAt: new Date(),
                    rejectionReason: dto.notes,
                    currentStep: null,
                },
            });
        });

        // Notify user
        try {
            await this.mailService.sendDepositWithdrawalRejected(
                withdrawal.user.email,
                withdrawal.user.name,
                withdrawal.withdrawalNumber,
                withdrawal.depositApplication.depositNumber,
                dto.notes || 'Tidak ada catatan',
            );
        } catch (error) {
            console.error('Failed to send rejection email:', error);
        }

        return { message: 'Penarikan deposito berhasil ditolak' };
    }

    /**
     * Handle approval
     */
    private async handleApproval(
        withdrawal: any,
        approverId: string,
        dto: ApproveWithdrawalDto,
    ) {
        const stepOrder = [
            DepositWithdrawalStep.DIVISI_SIMPAN_PINJAM,
            DepositWithdrawalStep.KETUA,
            DepositWithdrawalStep.SHOPKEEPER,
            DepositWithdrawalStep.KETUA_AUTH,
        ];

        const currentIndex = stepOrder.indexOf(withdrawal.currentStep);
        const nextStep = stepOrder[currentIndex + 1];

        // Determine new status based on next step
        let newStatus = withdrawal.status;
        if (nextStep === DepositWithdrawalStep.KETUA) {
            newStatus = DepositWithdrawalStatus.UNDER_REVIEW_KETUA;
        } else if (nextStep === DepositWithdrawalStep.SHOPKEEPER) {
            newStatus = DepositWithdrawalStatus.APPROVED_WAITING_DISBURSEMENT;
        }

        await this.prisma.$transaction(async (tx) => {
            // Create approval record
            await tx.depositWithdrawalApproval.create({
                data: {
                    depositWithdrawalId: withdrawal.id,
                    step: withdrawal.currentStep,
                    decision: ApprovalDecision.APPROVED,
                    approverId,
                    notes: dto.notes,
                    decidedAt: new Date(),
                },
            });

            // Update withdrawal
            await tx.depositWithdrawal.update({
                where: { id: withdrawal.id },
                data: {
                    status: newStatus,
                    currentStep: nextStep,
                },
            });
        });

        // Notify next approver or shopkeeper
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

    /**
     * Bulk approve/reject
     */
    async bulkProcessApproval(
        approverId: string,
        approverRoles: string[],
        dto: BulkApproveWithdrawalDto,
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

    /**
     * Confirm disbursement (Shopkeeper)
     */
    async confirmDisbursement(
        withdrawalId: string,
        processedBy: string,
        dto: ConfirmDisbursementDto,
    ) {
        const withdrawal = await this.prisma.depositWithdrawal.findUnique({
            where: { id: withdrawalId },
            include: {
                user: true,
                depositApplication: true,
            },
        });

        if (!withdrawal) {
            throw new NotFoundException('Penarikan tidak ditemukan');
        }

        if (withdrawal.currentStep !== DepositWithdrawalStep.SHOPKEEPER) {
            throw new BadRequestException(
                'Penarikan tidak dalam tahap konfirmasi shopkeeper',
            );
        }

        if (withdrawal.status !== DepositWithdrawalStatus.APPROVED_WAITING_DISBURSEMENT) {
            throw new BadRequestException('Status penarikan tidak valid untuk disbursement');
        }

        await this.prisma.$transaction(async (tx) => {
            // Create disbursement record
            await tx.depositWithdrawalDisbursement.create({
                data: {
                    depositWithdrawalId: withdrawalId,
                    processedBy,
                    transactionDate: dto.transactionDate
                        ? new Date(dto.transactionDate)
                        : new Date(),
                    notes: dto.notes,
                },
            });

            // Update withdrawal status
            await tx.depositWithdrawal.update({
                where: { id: withdrawalId },
                data: {
                    status: DepositWithdrawalStatus.DISBURSEMENT_IN_PROGRESS,
                    currentStep: DepositWithdrawalStep.KETUA_AUTH,
                },
            });
        });

        // Notify ketua for authorization
        try {
            await this.notifyApprovers(withdrawalId, DepositWithdrawalStep.KETUA_AUTH);
        } catch (error) {
            console.error('Failed to notify ketua for authorization:', error);
        }

        return {
            message: 'Transaksi berhasil dikonfirmasi. Menunggu otorisasi dari Ketua.',
        };
    }

    /**
     * Confirm authorization (Ketua Final)
     */
    async confirmAuthorization(
        withdrawalId: string,
        authorizedBy: string,
        dto: ConfirmAuthorizationDto,
    ) {
        const withdrawal = await this.prisma.depositWithdrawal.findUnique({
            where: { id: withdrawalId },
            include: {
                user: true,
                depositApplication: true,
            },
        });

        if (!withdrawal) {
            throw new NotFoundException('Penarikan tidak ditemukan');
        }

        if (withdrawal.currentStep !== DepositWithdrawalStep.KETUA_AUTH) {
            throw new BadRequestException('Penarikan tidak dalam tahap otorisasi ketua');
        }

        if (withdrawal.status !== DepositWithdrawalStatus.DISBURSEMENT_IN_PROGRESS) {
            throw new BadRequestException('Status penarikan tidak valid untuk otorisasi');
        }

        await this.prisma.$transaction(async (tx) => {
            // Create authorization record
            await tx.depositWithdrawalAuthorization.create({
                data: {
                    depositWithdrawalId: withdrawalId,
                    authorizedBy,
                    authorizationDate: dto.authorizationDate
                        ? new Date(dto.authorizationDate)
                        : new Date(),
                    notes: dto.notes,
                },
            });

            // Update withdrawal status to COMPLETED
            await tx.depositWithdrawal.update({
                where: { id: withdrawalId },
                data: {
                    status: DepositWithdrawalStatus.COMPLETED,
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

                // Create savings transaction record
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

            // Update deposit application collected amount
            await tx.depositApplication.update({
                where: { id: withdrawal.depositApplicationId },
                data: {
                    collectedAmount: {
                        decrement: withdrawal.withdrawalAmount.toNumber(),
                    },
                },
            });
        });

        // Notify user
        try {
            await this.mailService.sendDepositWithdrawalCompleted(
                withdrawal.user.email,
                withdrawal.user.name,
                withdrawal.withdrawalNumber,
                withdrawal.depositApplication.depositNumber,
                withdrawal.netAmount.toNumber(),
            );
        } catch (error) {
            console.error('Failed to send completion email:', error);
        }

        return {
            message: 'Penarikan deposito berhasil diselesaikan dan dana telah ditransfer.',
        };
    }

    /**
     * Cancel withdrawal (only for user and before disbursement)
     */
    async cancelWithdrawal(userId: string, withdrawalId: string) {
        const withdrawal = await this.prisma.depositWithdrawal.findUnique({
            where: { id: withdrawalId },
        });

        if (!withdrawal) {
            throw new NotFoundException('Penarikan tidak ditemukan');
        }

        if (withdrawal.userId !== userId) {
            throw new ForbiddenException('Anda tidak memiliki akses ke penarikan ini');
        }

        if (
            withdrawal.status !== DepositWithdrawalStatus.SUBMITTED &&
            withdrawal.status !== DepositWithdrawalStatus.UNDER_REVIEW_DSP &&
            withdrawal.status !== DepositWithdrawalStatus.UNDER_REVIEW_KETUA
        ) {
            throw new BadRequestException(
                'Hanya penarikan yang belum diproses yang dapat dibatalkan',
            );
        }

        await this.prisma.depositWithdrawal.update({
            where: { id: withdrawalId },
            data: {
                status: DepositWithdrawalStatus.CANCELLED,
                currentStep: null,
            },
        });

        return { message: 'Penarikan deposito berhasil dibatalkan' };
    }

    // NOTIFICATION HELPERS

    private async notifyApprovers(
        withdrawalId: string,
        step: DepositWithdrawalStep,
    ) {
        const withdrawal = await this.prisma.depositWithdrawal.findUnique({
            where: { id: withdrawalId },
            include: {
                user: {
                    include: {
                        employee: true,
                    },
                },
                depositApplication: true,
            },
        });

        if (!withdrawal) return;

        let roleName: string;
        let recipients: any[] = [];

        switch (step) {
            case DepositWithdrawalStep.DIVISI_SIMPAN_PINJAM:
                roleName = 'divisi_simpan_pinjam';
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
                break;

            case DepositWithdrawalStep.KETUA:
            case DepositWithdrawalStep.KETUA_AUTH:
                roleName = 'ketua';
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
                break;

            case DepositWithdrawalStep.SHOPKEEPER:
                roleName = 'shopkeeper';
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
                break;
        }

        for (const recipient of recipients) {
            try {
                if (step === DepositWithdrawalStep.SHOPKEEPER) {
                    await this.mailService.sendDepositWithdrawalDisbursementRequest(
                        recipient.email,
                        recipient.name,
                        withdrawal.user.name,
                        withdrawal.withdrawalNumber,
                        withdrawal.netAmount.toNumber(),
                        withdrawal.bankAccountNumber || '',
                    );
                } else if (step === DepositWithdrawalStep.KETUA_AUTH) {
                    await this.mailService.sendDepositWithdrawalAuthorizationRequest(
                        recipient.email,
                        recipient.name,
                        withdrawal.user.name,
                        withdrawal.withdrawalNumber,
                        withdrawal.netAmount.toNumber(),
                    );
                } else {
                    await this.mailService.sendDepositWithdrawalApprovalRequest(
                        recipient.email,
                        recipient.name,
                        withdrawal.user.name,
                        withdrawal.withdrawalNumber,
                        withdrawal.depositApplication.depositNumber,
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