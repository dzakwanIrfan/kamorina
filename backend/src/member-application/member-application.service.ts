import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { SubmitApplicationDto } from './dto/submit-application.dto';
import { ApproveRejectDto } from './dto/approve-reject.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import { ApplicationStatus, ApprovalStep, ApprovalDecision } from '@prisma/client';
import { PaginatedResult } from '../common/interfaces/pagination.interface';

@Injectable()
export class MemberApplicationService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async submitApplication(userId: string, dto: SubmitApplicationDto) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // Check if already member
    if (user.memberVerified) {
      throw new BadRequestException('Anda sudah menjadi member');
    }

    // Check if NIK already used by another user
    if (dto.nik !== user.nik) {
      const nikExists = await this.prisma.user.findFirst({
        where: {
          nik: dto.nik,
          id: { not: userId },
        },
      });

      if (nikExists) {
        throw new ConflictException('NIK sudah digunakan oleh user lain');
      }
    }

    // Check if NPWP already used by another user
    if (dto.npwp !== user.npwp) {
      const npwpExists = await this.prisma.user.findFirst({
        where: {
          npwp: dto.npwp,
          id: { not: userId },
        },
      });

      if (npwpExists) {
        throw new ConflictException('NPWP sudah digunakan oleh user lain');
      }
    }

    // Check if department exists
    const department = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
    });

    if (!department) {
      throw new NotFoundException('Department tidak ditemukan');
    }

    // Check if application already exists
    const existingApplication = await this.prisma.memberApplication.findUnique({
      where: { userId },
    });

    if (existingApplication) {
      if (existingApplication.status === ApplicationStatus.UNDER_REVIEW) {
        throw new BadRequestException('Anda sudah memiliki pengajuan yang sedang diproses');
      }
      if (existingApplication.status === ApplicationStatus.APPROVED) {
        throw new BadRequestException('Pengajuan Anda sudah disetujui');
      }
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Update user data
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            nik: dto.nik,
            npwp: dto.npwp,
            departmentId: dto.departmentId,
            dateOfBirth: new Date(dto.dateOfBirth),
            birthPlace: dto.birthPlace,
            permanentEmployeeDate: new Date(dto.permanentEmployeeDate),
            installmentPlan: dto.installmentPlan,
          },
        });

        // Create or update application
        let application;
        if (existingApplication) {
          application = await tx.memberApplication.update({
            where: { userId },
            data: {
              status: ApplicationStatus.UNDER_REVIEW,
              currentStep: ApprovalStep.DIVISI_SIMPAN_PINJAM,
              submittedAt: new Date(),
              rejectedAt: null,
              rejectionReason: null,
            },
          });

          // Delete old approvals
          await tx.applicationApproval.deleteMany({
            where: { applicationId: application.id },
          });
        } else {
          application = await tx.memberApplication.create({
            data: {
              userId,
              status: ApplicationStatus.UNDER_REVIEW,
              currentStep: ApprovalStep.DIVISI_SIMPAN_PINJAM,
              submittedAt: new Date(),
            },
          });
        }

        // Create approval records for all steps
        await tx.applicationApproval.createMany({
          data: [
            {
              applicationId: application.id,
              step: ApprovalStep.DIVISI_SIMPAN_PINJAM,
            },
            {
              applicationId: application.id,
              step: ApprovalStep.KETUA,
            },
          ],
        });

        return { updatedUser, application };
      });

      // Send notification to DIVISI_SIMPAN_PINJAM
      try {
        await this.notifyNextApprover(result.application.id, ApprovalStep.DIVISI_SIMPAN_PINJAM);
      } catch (emailError) {
        console.error('Failed to send notification:', emailError);
        // Don't fail the transaction if email fails
      }

      return {
        message: 'Pengajuan member berhasil disubmit. Menunggu approval dari Divisi Simpan Pinjam.',
        applicationId: result.application.id,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      console.error('Submit application error:', error);
      throw new BadRequestException('Terjadi kesalahan saat submit pengajuan');
    }
  }

  async getMyApplication(userId: string) {
    const application = await this.prisma.memberApplication.findUnique({
      where: { userId },
      include: {
        user: {
          include: {
            employee: true,
            department: true,
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
    });

    if (!application) {
      throw new NotFoundException('Pengajuan tidak ditemukan');
    }

    return application;
  }

  async getApplications(query: QueryApplicationDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, status, userId, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { nik: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [applications, total] = await Promise.all([
      this.prisma.memberApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            include: {
              employee: true,
              department: true,
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
      this.prisma.memberApplication.count({ where }),
    ]);

    return {
      data: applications,
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

  async getApplicationById(id: string) {
    const application = await this.prisma.memberApplication.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            employee: true,
            department: true,
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
    });

    if (!application) {
      throw new NotFoundException('Pengajuan tidak ditemukan');
    }

    return application;
  }

  async processApproval(
    applicationId: string,
    approverId: string,
    approverRoles: string[],
    dto: ApproveRejectDto,
  ) {
    const application = await this.prisma.memberApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          include: {
            employee: true,
          },
        },
        approvals: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Pengajuan tidak ditemukan');
    }

    if (application.status !== ApplicationStatus.UNDER_REVIEW) {
      throw new BadRequestException('Pengajuan sudah diproses sebelumnya');
    }

    // Check if user has permission to approve at current step
    const currentStep = application.currentStep;
    if (!currentStep) {
      throw new BadRequestException('Step approval tidak valid');
    }

    // Map role to step
    const roleStepMap: { [key: string]: ApprovalStep } = {
      divisi_simpan_pinjam: ApprovalStep.DIVISI_SIMPAN_PINJAM,
      ketua: ApprovalStep.KETUA,
    };

    const approverStep = approverRoles
      .map((role) => roleStepMap[role])
      .find((step) => step === currentStep);

    if (!approverStep) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk approve di step ini');
    }

    // Find the approval record
    const approvalRecord = application.approvals.find((a) => a.step === currentStep);

    if (!approvalRecord) {
      throw new BadRequestException('Record approval tidak ditemukan');
    }

    if (approvalRecord.decision) {
      throw new BadRequestException('Step ini sudah diproses sebelumnya');
    }

    try {
      if (dto.decision === ApprovalDecision.REJECTED) {
        // REJECT
        await this.prisma.$transaction(async (tx) => {
          // Update approval record
          await tx.applicationApproval.update({
            where: { id: approvalRecord.id },
            data: {
              decision: ApprovalDecision.REJECTED,
              decidedAt: new Date(),
              approverId,
              notes: dto.notes,
            },
          });

          // Update application status
          await tx.memberApplication.update({
            where: { id: applicationId },
            data: {
              status: ApplicationStatus.REJECTED,
              rejectedAt: new Date(),
              rejectionReason: dto.notes,
              currentStep: null,
            },
          });
        });

        // Send rejection email to applicant
        try {
          await this.mailService.sendApplicationRejected(
            application.user.email,
            application.user.name,
            dto.notes || 'Tidak ada catatan',
          );
        } catch (emailError) {
          console.error('Failed to send rejection email:', emailError);
        }

        return {
          message: 'Pengajuan berhasil ditolak',
        };
      } else {
        // APPROVE
        const isLastStep = currentStep === ApprovalStep.KETUA;

        await this.prisma.$transaction(async (tx) => {
          // Update approval record
          await tx.applicationApproval.update({
            where: { id: approvalRecord.id },
            data: {
              decision: ApprovalDecision.APPROVED,
              decidedAt: new Date(),
              approverId,
              notes: dto.notes,
            },
          });

          if (isLastStep) {
            // Final approval - set user as verified member
            await tx.user.update({
              where: { id: application.userId },
              data: {
                memberVerified: true,
                memberVerifiedAt: new Date(),
              },
            });

            await tx.memberApplication.update({
              where: { id: applicationId },
              data: {
                status: ApplicationStatus.APPROVED,
                approvedAt: new Date(),
                currentStep: null,
              },
            });
          } else {
            // Move to next step
            const nextStep = ApprovalStep.KETUA;
            await tx.memberApplication.update({
              where: { id: applicationId },
              data: {
                currentStep: nextStep,
              },
            });
          }
        });

        if (isLastStep) {
          // Send final approval emails
          try {
            await this.sendFinalApprovalNotifications(application.user.email, application.user.name);
          } catch (emailError) {
            console.error('Failed to send final approval emails:', emailError);
          }

          return {
            message: 'Pengajuan berhasil disetujui. User sekarang adalah member terverifikasi.',
          };
        } else {
          // Notify next approver
          try {
            await this.notifyNextApprover(applicationId, ApprovalStep.KETUA);
          } catch (emailError) {
            console.error('Failed to notify next approver:', emailError);
          }

          return {
            message: 'Pengajuan berhasil disetujui. Menunggu approval dari Ketua.',
          };
        }
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      console.error('Process approval error:', error);
      throw new BadRequestException('Terjadi kesalahan saat memproses approval');
    }
  }

  private async notifyNextApprover(applicationId: string, step: ApprovalStep) {
    const application = await this.prisma.memberApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          include: {
            employee: true,
          },
        },
      },
    });

    if (!application) return;

    // Get users with the required role
    const roleName = step === ApprovalStep.DIVISI_SIMPAN_PINJAM ? 'divisi_simpan_pinjam' : 'ketua';

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

    // Send email to all approvers
    for (const approver of approvers) {
      try {
        await this.mailService.sendApprovalRequest(
          approver.email,
          approver.name,
          application.user.name,
          application.user.employee.employeeNumber,
          roleName,
        );
      } catch (error) {
        console.error(`Failed to send approval request to ${approver.email}:`, error);
      }
    }
  }

  private async sendFinalApprovalNotifications(userEmail: string, userName: string) {
    // Notify the member
    await this.mailService.sendMembershipApproved(userEmail, userName);

    // Notify pengawas and payroll
    const notifyRoles = ['pengawas', 'payroll'];

    for (const role of notifyRoles) {
      const users = await this.prisma.user.findMany({
        where: {
          roles: {
            some: {
              level: {
                levelName: role,
              },
            },
          },
        },
      });

      for (const user of users) {
        try {
          await this.mailService.sendNewMemberNotification(user.email, user.name, userName, userEmail);
        } catch (error) {
          console.error(`Failed to send notification to ${user.email}:`, error);
        }
      }
    }
  }
}