import {
  ApplicationStatus,
  ApprovalStep,
  ApprovalDecision,
  Prisma,
} from '@prisma/client';
import { SeederContext, logSuccess, logInfo } from './helpers/seeder-context';

// Initial membership fee (should match settings)
const INITIAL_MEMBERSHIP_FEE = 500000;

/**
 * Member application configurations by status
 */
interface ApplicationConfig {
  userIndex: number;
  status: ApplicationStatus;
  currentStep: ApprovalStep | null;
  installmentPlan: 1 | 2;
  isPaidOff: boolean;
  paidAmount: number;
  rejectionReason?: string;
  approvals: Array<{
    step: ApprovalStep;
    decision?: ApprovalDecision;
    notes?: string;
  }>;
}

/**
 * Seed Member Applications with various states for testing
 */
export async function seedMemberApplications(
  ctx: SeederContext,
): Promise<void> {
  logInfo('MemberApplications', 'Seeding member applications...');

  const testUsers = ctx.users.testUsers;
  if (testUsers.length === 0) {
    console.warn('No test users found. Skipping member applications.');
    return;
  }

  const now = new Date();
  const daysAgo = (days: number) =>
    new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Application configurations
  const configs: ApplicationConfig[] = [
    // === UNDER_REVIEW - Waiting DSP Approval (4 users) ===
    {
      userIndex: 0,
      status: ApplicationStatus.UNDER_REVIEW,
      currentStep: ApprovalStep.DIVISI_SIMPAN_PINJAM,
      installmentPlan: 1,
      isPaidOff: false,
      paidAmount: 0,
      approvals: [
        { step: ApprovalStep.DIVISI_SIMPAN_PINJAM },
        { step: ApprovalStep.KETUA },
      ],
    },
    {
      userIndex: 1,
      status: ApplicationStatus.UNDER_REVIEW,
      currentStep: ApprovalStep.DIVISI_SIMPAN_PINJAM,
      installmentPlan: 1,
      isPaidOff: false,
      paidAmount: 0,
      approvals: [
        { step: ApprovalStep.DIVISI_SIMPAN_PINJAM },
        { step: ApprovalStep.KETUA },
      ],
    },
    {
      userIndex: 2,
      status: ApplicationStatus.UNDER_REVIEW,
      currentStep: ApprovalStep.DIVISI_SIMPAN_PINJAM,
      installmentPlan: 2,
      isPaidOff: false,
      paidAmount: 0,
      approvals: [
        { step: ApprovalStep.DIVISI_SIMPAN_PINJAM },
        { step: ApprovalStep.KETUA },
      ],
    },
    {
      userIndex: 3,
      status: ApplicationStatus.UNDER_REVIEW,
      currentStep: ApprovalStep.DIVISI_SIMPAN_PINJAM,
      installmentPlan: 1,
      isPaidOff: false,
      paidAmount: 0,
      approvals: [
        { step: ApprovalStep.DIVISI_SIMPAN_PINJAM },
        { step: ApprovalStep.KETUA },
      ],
    },

    // === UNDER_REVIEW - Waiting Ketua Approval (4 users) ===
    {
      userIndex: 4,
      status: ApplicationStatus.UNDER_REVIEW,
      currentStep: ApprovalStep.KETUA,
      installmentPlan: 2,
      isPaidOff: false,
      paidAmount: 0,
      approvals: [
        {
          step: ApprovalStep.DIVISI_SIMPAN_PINJAM,
          decision: ApprovalDecision.APPROVED,
          notes: 'Data lengkap dan sesuai',
        },
        { step: ApprovalStep.KETUA },
      ],
    },
    {
      userIndex: 5,
      status: ApplicationStatus.UNDER_REVIEW,
      currentStep: ApprovalStep.KETUA,
      installmentPlan: 1,
      isPaidOff: false,
      paidAmount: 0,
      approvals: [
        {
          step: ApprovalStep.DIVISI_SIMPAN_PINJAM,
          decision: ApprovalDecision.APPROVED,
          notes: 'Disetujui',
        },
        { step: ApprovalStep.KETUA },
      ],
    },
    {
      userIndex: 6,
      status: ApplicationStatus.UNDER_REVIEW,
      currentStep: ApprovalStep.KETUA,
      installmentPlan: 2,
      isPaidOff: false,
      paidAmount: 0,
      approvals: [
        {
          step: ApprovalStep.DIVISI_SIMPAN_PINJAM,
          decision: ApprovalDecision.APPROVED,
          notes: 'Verified',
        },
        { step: ApprovalStep.KETUA },
      ],
    },
    {
      userIndex: 7,
      status: ApplicationStatus.UNDER_REVIEW,
      currentStep: ApprovalStep.KETUA,
      installmentPlan: 1,
      isPaidOff: false,
      paidAmount: 0,
      approvals: [
        {
          step: ApprovalStep.DIVISI_SIMPAN_PINJAM,
          decision: ApprovalDecision.APPROVED,
          notes: 'OK',
        },
        { step: ApprovalStep.KETUA },
      ],
    },

    // === APPROVED - Not paid off yet (for payroll testing) ===
    {
      userIndex: 8,
      status: ApplicationStatus.APPROVED,
      currentStep: null,
      installmentPlan: 1,
      isPaidOff: false,
      paidAmount: 0,
      approvals: [
        {
          step: ApprovalStep.DIVISI_SIMPAN_PINJAM,
          decision: ApprovalDecision.APPROVED,
          notes: 'Disetujui',
        },
        {
          step: ApprovalStep.KETUA,
          decision: ApprovalDecision.APPROVED,
          notes: 'Disetujui Ketua',
        },
      ],
    },
    {
      userIndex: 9,
      status: ApplicationStatus.APPROVED,
      currentStep: null,
      installmentPlan: 2,
      isPaidOff: false,
      paidAmount: INITIAL_MEMBERSHIP_FEE / 2,
      approvals: [
        {
          step: ApprovalStep.DIVISI_SIMPAN_PINJAM,
          decision: ApprovalDecision.APPROVED,
          notes: 'Disetujui',
        },
        {
          step: ApprovalStep.KETUA,
          decision: ApprovalDecision.APPROVED,
          notes: 'Disetujui Ketua',
        },
      ],
    },

    // === APPROVED - Paid off (existing members) ===
    {
      userIndex: 10,
      status: ApplicationStatus.APPROVED,
      currentStep: null,
      installmentPlan: 1,
      isPaidOff: true,
      paidAmount: INITIAL_MEMBERSHIP_FEE,
      approvals: [
        {
          step: ApprovalStep.DIVISI_SIMPAN_PINJAM,
          decision: ApprovalDecision.APPROVED,
          notes: 'Disetujui',
        },
        {
          step: ApprovalStep.KETUA,
          decision: ApprovalDecision.APPROVED,
          notes: 'Disetujui Ketua',
        },
      ],
    },
    {
      userIndex: 11,
      status: ApplicationStatus.APPROVED,
      currentStep: null,
      installmentPlan: 2,
      isPaidOff: true,
      paidAmount: INITIAL_MEMBERSHIP_FEE,
      approvals: [
        {
          step: ApprovalStep.DIVISI_SIMPAN_PINJAM,
          decision: ApprovalDecision.APPROVED,
          notes: 'Disetujui',
        },
        {
          step: ApprovalStep.KETUA,
          decision: ApprovalDecision.APPROVED,
          notes: 'Disetujui Ketua',
        },
      ],
    },
    {
      userIndex: 12,
      status: ApplicationStatus.APPROVED,
      currentStep: null,
      installmentPlan: 1,
      isPaidOff: true,
      paidAmount: INITIAL_MEMBERSHIP_FEE,
      approvals: [
        {
          step: ApprovalStep.DIVISI_SIMPAN_PINJAM,
          decision: ApprovalDecision.APPROVED,
          notes: 'Disetujui',
        },
        {
          step: ApprovalStep.KETUA,
          decision: ApprovalDecision.APPROVED,
          notes: 'Disetujui Ketua',
        },
      ],
    },
    {
      userIndex: 13,
      status: ApplicationStatus.APPROVED,
      currentStep: null,
      installmentPlan: 1,
      isPaidOff: true,
      paidAmount: INITIAL_MEMBERSHIP_FEE,
      approvals: [
        {
          step: ApprovalStep.DIVISI_SIMPAN_PINJAM,
          decision: ApprovalDecision.APPROVED,
          notes: 'Disetujui',
        },
        {
          step: ApprovalStep.KETUA,
          decision: ApprovalDecision.APPROVED,
          notes: 'Disetujui Ketua',
        },
      ],
    },

    // === REJECTED ===
    {
      userIndex: 14,
      status: ApplicationStatus.REJECTED,
      currentStep: null,
      installmentPlan: 1,
      isPaidOff: false,
      paidAmount: 0,
      rejectionReason: 'Data tidak lengkap',
      approvals: [
        {
          step: ApprovalStep.DIVISI_SIMPAN_PINJAM,
          decision: ApprovalDecision.REJECTED,
          notes: 'Data tidak lengkap',
        },
        { step: ApprovalStep.KETUA },
      ],
    },
    {
      userIndex: 15,
      status: ApplicationStatus.REJECTED,
      currentStep: null,
      installmentPlan: 1,
      isPaidOff: false,
      paidAmount: 0,
      rejectionReason: 'NIK tidak valid',
      approvals: [
        {
          step: ApprovalStep.DIVISI_SIMPAN_PINJAM,
          decision: ApprovalDecision.REJECTED,
          notes: 'NIK tidak valid',
        },
        { step: ApprovalStep.KETUA },
      ],
    },
    {
      userIndex: 16,
      status: ApplicationStatus.REJECTED,
      currentStep: null,
      installmentPlan: 1,
      isPaidOff: false,
      paidAmount: 0,
      rejectionReason: 'Belum memenuhi syarat masa kerja',
      approvals: [
        {
          step: ApprovalStep.DIVISI_SIMPAN_PINJAM,
          decision: ApprovalDecision.REJECTED,
          notes: 'Belum memenuhi syarat masa kerja',
        },
        { step: ApprovalStep.KETUA },
      ],
    },
  ];

  let createdCount = 0;

  for (const config of configs) {
    if (config.userIndex >= testUsers.length) continue;

    const user = testUsers[config.userIndex];
    const entranceFee = new Prisma.Decimal(INITIAL_MEMBERSHIP_FEE);
    // If config says isPaidOff, then paidAmount MUST be entranceFee
    const paidAmount = new Prisma.Decimal(
      config.isPaidOff ? INITIAL_MEMBERSHIP_FEE : config.paidAmount,
    );
    const remainingAmount = entranceFee.sub(paidAmount);

    // Calculate dates based on status
    const submittedAt = daysAgo(Math.floor(Math.random() * 30) + 5);
    let approvedAt: Date | undefined;
    let rejectedAt: Date | undefined;

    if (config.status === ApplicationStatus.APPROVED) {
      approvedAt = daysAgo(Math.floor(Math.random() * 4) + 1);
    } else if (config.status === ApplicationStatus.REJECTED) {
      rejectedAt = daysAgo(Math.floor(Math.random() * 3) + 1);
    }

    // Check if application already exists
    const existingApp = await ctx.prisma.memberApplication.findUnique({
      where: { userId: user.id },
    });

    if (existingApp) {
      continue;
    }

    // Create member application
    const application = await ctx.prisma.memberApplication.create({
      data: {
        userId: user.id,
        installmentPlan: config.installmentPlan,
        entranceFee,
        paidAmount,
        remainingAmount: remainingAmount.lt(0)
          ? new Prisma.Decimal(0)
          : remainingAmount,
        isPaidOff: config.isPaidOff,
        status: config.status,
        currentStep: config.currentStep,
        submittedAt,
        approvedAt,
        rejectedAt,
        rejectionReason: config.rejectionReason,
      },
    });

    // Create approvals
    for (const approval of config.approvals) {
      const approverId = approval.decision
        ? approval.step === ApprovalStep.DIVISI_SIMPAN_PINJAM
          ? ctx.users.divisi?.id
          : ctx.users.admin?.id
        : undefined;

      await ctx.prisma.applicationApproval.create({
        data: {
          applicationId: application.id,
          step: approval.step,
          decision: approval.decision,
          decidedAt: approval.decision ? new Date() : undefined,
          approverId,
          notes: approval.notes,
        },
      });
    }

    // Update user memberVerified status for approved applications
    if (config.status === ApplicationStatus.APPROVED) {
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          memberVerified: true,
          memberVerifiedAt: approvedAt,
          installmentPlan: config.installmentPlan,
        },
      });
    }

    createdCount++;
  }

  logSuccess(
    'MemberApplications',
    `Created ${createdCount} member applications`,
  );
  logInfo('MemberApplications', `- UNDER_REVIEW (DSP): 4`);
  logInfo('MemberApplications', `- UNDER_REVIEW (Ketua): 4`);
  logInfo('MemberApplications', `- APPROVED (not paid off): 2`);
  logInfo('MemberApplications', `- APPROVED (paid off): 4`);
  logInfo('MemberApplications', `- REJECTED: 3`);
}
