import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, JobsOptions } from 'bullmq';
import {
    EmailJob,
    EmailJobType,
    EMAIL_QUEUE_NAME,
    DEFAULT_EMAIL_JOB_OPTIONS,
    BulkEmailOptions,
} from './mail.types';

/**
 * Mail Queue Service
 *
 * Service untuk menambahkan email ke queue.
 * Menggantikan direct email sending dengan queueing mechanism.
 *
 * Benefits:
 * - Email tidak akan hilang jika proses crash
 * - Automatic retry jika gagal
 * - Rate limiting untuk mencegah SMTP throttling
 * - Dapat mengirim bulk email tanpa blocking
 */
@Injectable()
export class MailQueueService {
    private readonly logger = new Logger(MailQueueService.name);

    constructor(
        @InjectQueue(EMAIL_QUEUE_NAME) private readonly emailQueue: Queue<EmailJob>,
    ) { }

    /**
     * Add single email ke queue
     */
    async addToQueue(
        emailJob: EmailJob,
        options?: JobsOptions,
    ): Promise<string> {
        const jobOptions: JobsOptions = {
            ...DEFAULT_EMAIL_JOB_OPTIONS,
            ...options,
        };

        const job = await this.emailQueue.add(emailJob.type, emailJob, jobOptions);

        this.logger.log(`Email job added: ${job.id} | Type: ${emailJob.type} | To: ${emailJob.to}`);

        return job.id!;
    }

    /**
     * Add bulk emails ke queue dengan rate limiting
     * Cocok untuk kirim notifikasi ke banyak user sekaligus
     */
    async addBulkToQueue(
        emailJobs: EmailJob[],
        options?: BulkEmailOptions,
    ): Promise<string[]> {
        const { delayBetweenEmails = 100, priority = 0 } = options || {};
        const jobIds: string[] = [];

        this.logger.log(`Adding ${emailJobs.length} emails to queue...`);

        for (let i = 0; i < emailJobs.length; i++) {
            const emailJob = emailJobs[i];
            const delay = i * delayBetweenEmails; // Stagger pengiriman

            const jobOptions: JobsOptions = {
                ...DEFAULT_EMAIL_JOB_OPTIONS,
                delay,
                priority,
            };

            const job = await this.emailQueue.add(emailJob.type, emailJob, jobOptions);
            jobIds.push(job.id!);
        }

        this.logger.log(`Successfully queued ${emailJobs.length} emails`);

        return jobIds;
    }

    // ==========================================
    // Helper methods untuk setiap tipe email
    // ==========================================

    /**
     * Queue email verification
     */
    async queueEmailVerification(email: string, name: string, token: string) {
        return this.addToQueue({
            type: EmailJobType.EMAIL_VERIFICATION,
            to: email,
            data: { name, token },
        });
    }

    /**
     * Queue password reset email
     */
    async queuePasswordReset(email: string, name: string, token: string) {
        return this.addToQueue({
            type: EmailJobType.PASSWORD_RESET,
            to: email,
            data: { name, token },
        });
    }

    /**
     * Queue approval request untuk member application
     */
    async queueApprovalRequest(
        email: string,
        approverName: string,
        applicantName: string,
        employeeNumber: string,
        roleName: string,
    ) {
        return this.addToQueue({
            type: EmailJobType.APPROVAL_REQUEST,
            to: email,
            data: { approverName, applicantName, employeeNumber, roleName },
        });
    }

    /**
     * Queue application rejected notification
     */
    async queueApplicationRejected(
        email: string,
        applicantName: string,
        reason: string,
    ) {
        return this.addToQueue({
            type: EmailJobType.APPLICATION_REJECTED,
            to: email,
            data: { applicantName, reason },
        });
    }

    /**
     * Queue membership approved notification
     */
    async queueMembershipApproved(email: string, memberName: string) {
        return this.addToQueue({
            type: EmailJobType.MEMBERSHIP_APPROVED,
            to: email,
            data: { memberName },
        });
    }

    /**
     * Queue new member notification
     */
    async queueNewMemberNotification(
        email: string,
        recipientName: string,
        memberName: string,
        memberEmail: string,
    ) {
        return this.addToQueue({
            type: EmailJobType.NEW_MEMBER_NOTIFICATION,
            to: email,
            data: { recipientName, memberName, memberEmail },
        });
    }

    // ==========================================
    // LOAN EMAIL METHODS
    // ==========================================

    /**
     * Queue loan approval request
     */
    async queueLoanApprovalRequest(
        email: string,
        approverName: string,
        applicantName: string,
        loanNumber: string,
        loanAmount: number,
        roleName: string,
    ) {
        return this.addToQueue({
            type: EmailJobType.LOAN_APPROVAL_REQUEST,
            to: email,
            data: { approverName, applicantName, loanNumber, loanAmount, roleName },
        });
    }

    /**
     * Queue loan revised notification
     */
    async queueLoanRevised(
        email: string,
        applicantName: string,
        loanNumber: string,
        revisionNotes: string,
    ) {
        return this.addToQueue({
            type: EmailJobType.LOAN_REVISED,
            to: email,
            data: { applicantName, loanNumber, revisionNotes },
        });
    }

    /**
     * Queue loan rejected notification
     */
    async queueLoanRejected(
        email: string,
        applicantName: string,
        loanNumber: string,
        reason: string,
    ) {
        return this.addToQueue({
            type: EmailJobType.LOAN_REJECTED,
            to: email,
            data: { applicantName, loanNumber, reason },
        });
    }

    /**
     * Queue loan disbursement request
     */
    async queueLoanDisbursementRequest(
        email: string,
        shopkeeperName: string,
        applicantName: string,
        loanNumber: string,
        loanAmount: number,
        bankAccountNumber: string,
    ) {
        return this.addToQueue({
            type: EmailJobType.LOAN_DISBURSEMENT_REQUEST,
            to: email,
            data: { shopkeeperName, applicantName, loanNumber, loanAmount, bankAccountNumber },
        });
    }

    /**
     * Queue loan authorization request
     */
    async queueLoanAuthorizationRequest(
        email: string,
        ketuaName: string,
        applicantName: string,
        loanNumber: string,
        loanAmount: number,
    ) {
        return this.addToQueue({
            type: EmailJobType.LOAN_AUTHORIZATION_REQUEST,
            to: email,
            data: { ketuaName, applicantName, loanNumber, loanAmount },
        });
    }

    /**
     * Queue loan disbursed notification
     */
    async queueLoanDisbursed(
        email: string,
        applicantName: string,
        loanNumber: string,
        loanAmount: number,
        bankAccountNumber: string,
    ) {
        return this.addToQueue({
            type: EmailJobType.LOAN_DISBURSED,
            to: email,
            data: { applicantName, loanNumber, loanAmount, bankAccountNumber },
        });
    }

    /**
     * Queue loan completion notification
     */
    async queueLoanCompletionNotification(
        email: string,
        applicantName: string,
        loanNumber: string,
        loanAmount: number,
    ) {
        return this.addToQueue({
            type: EmailJobType.LOAN_COMPLETION_NOTIFICATION,
            to: email,
            data: { applicantName, loanNumber, loanAmount },
        });
    }

    // ==========================================
    // DEPOSIT EMAIL METHODS
    // ==========================================

    /**
     * Queue deposit approval request
     */
    async queueDepositApprovalRequest(
        email: string,
        approverName: string,
        applicantName: string,
        depositNumber: string,
        depositAmount: number,
        roleName: string,
    ) {
        return this.addToQueue({
            type: EmailJobType.DEPOSIT_APPROVAL_REQUEST,
            to: email,
            data: { approverName, applicantName, depositNumber, depositAmount, roleName },
        });
    }

    /**
     * Queue deposit rejected notification
     */
    async queueDepositRejected(
        email: string,
        applicantName: string,
        depositNumber: string,
        reason: string,
    ) {
        return this.addToQueue({
            type: EmailJobType.DEPOSIT_REJECTED,
            to: email,
            data: { applicantName, depositNumber, reason },
        });
    }

    /**
     * Queue deposit approved notification
     */
    async queueDepositApproved(
        email: string,
        applicantName: string,
        depositNumber: string,
        depositAmount: number,
        tenorMonths: number,
    ) {
        return this.addToQueue({
            type: EmailJobType.DEPOSIT_APPROVED,
            to: email,
            data: { applicantName, depositNumber, depositAmount, tenorMonths },
        });
    }

    /**
     * Queue deposit payroll notification
     */
    async queueDepositPayrollNotification(
        email: string,
        payrollName: string,
        applicantName: string,
        depositNumber: string,
        depositAmount: number,
    ) {
        return this.addToQueue({
            type: EmailJobType.DEPOSIT_PAYROLL_NOTIFICATION,
            to: email,
            data: { payrollName, applicantName, depositNumber, depositAmount },
        });
    }

    // ==========================================
    // DEPOSIT CHANGE EMAIL METHODS
    // ==========================================

    /**
     * Queue deposit change approval request
     */
    async queueDepositChangeApprovalRequest(
        email: string,
        approverName: string,
        applicantName: string,
        changeNumber: string,
        depositNumber: string,
        currentAmount: number,
        newAmount: number,
        roleName: string,
    ) {
        return this.addToQueue({
            type: EmailJobType.DEPOSIT_CHANGE_APPROVAL_REQUEST,
            to: email,
            data: {
                approverName,
                applicantName,
                changeNumber,
                depositNumber,
                currentAmount,
                newAmount,
                roleName,
            },
        });
    }

    /**
     * Queue deposit change rejected notification
     */
    async queueDepositChangeRejected(
        email: string,
        applicantName: string,
        changeNumber: string,
        depositNumber: string,
        reason: string,
    ) {
        return this.addToQueue({
            type: EmailJobType.DEPOSIT_CHANGE_REJECTED,
            to: email,
            data: { applicantName, changeNumber, depositNumber, reason },
        });
    }

    /**
     * Queue deposit change approved notification
     */
    async queueDepositChangeApproved(
        email: string,
        applicantName: string,
        changeNumber: string,
        depositNumber: string,
        currentAmount: number,
        newAmount: number,
        currentTenor: number,
        newTenor: number,
        adminFee: number,
    ) {
        return this.addToQueue({
            type: EmailJobType.DEPOSIT_CHANGE_APPROVED,
            to: email,
            data: {
                applicantName,
                changeNumber,
                depositNumber,
                currentAmount,
                newAmount,
                currentTenor,
                newTenor,
                adminFee,
            },
        });
    }

    /**
     * Queue deposit change payroll notification
     */
    async queueDepositChangePayrollNotification(
        email: string,
        payrollName: string,
        applicantName: string,
        changeNumber: string,
        depositNumber: string,
        currentAmount: number,
        newAmount: number,
        adminFee: number,
    ) {
        return this.addToQueue({
            type: EmailJobType.DEPOSIT_CHANGE_PAYROLL_NOTIFICATION,
            to: email,
            data: {
                payrollName,
                applicantName,
                changeNumber,
                depositNumber,
                currentAmount,
                newAmount,
                adminFee,
            },
        });
    }

    /**
     * Queue deposit change employee notification
     */
    async queueDepositChangeEmployeeNotification(
        email: string,
        employeeName: string,
        changeNumber: string,
        depositNumber: string,
        currentAmount: number,
        newAmount: number,
        currentTenor: number,
        newTenor: number,
        adminFee: number,
        effectiveDate: Date,
    ) {
        return this.addToQueue({
            type: EmailJobType.DEPOSIT_CHANGE_EMPLOYEE_NOTIFICATION,
            to: email,
            data: {
                employeeName,
                changeNumber,
                depositNumber,
                currentAmount,
                newAmount,
                currentTenor,
                newTenor,
                adminFee,
                effectiveDate: effectiveDate.toISOString(),
            },
        });
    }

    // ==========================================
    // SAVINGS WITHDRAWAL EMAIL METHODS
    // ==========================================

    /**
     * Queue savings withdrawal approval request
     */
    async queueSavingsWithdrawalApprovalRequest(
        email: string,
        approverName: string,
        applicantName: string,
        withdrawalNumber: string,
        withdrawalAmount: number,
        roleName: string,
    ) {
        return this.addToQueue({
            type: EmailJobType.SAVINGS_WITHDRAWAL_APPROVAL_REQUEST,
            to: email,
            data: { approverName, applicantName, withdrawalNumber, withdrawalAmount, roleName },
        });
    }

    /**
     * Queue savings withdrawal rejected notification
     */
    async queueSavingsWithdrawalRejected(
        email: string,
        applicantName: string,
        withdrawalNumber: string,
        reason: string,
    ) {
        return this.addToQueue({
            type: EmailJobType.SAVINGS_WITHDRAWAL_REJECTED,
            to: email,
            data: { applicantName, withdrawalNumber, reason },
        });
    }

    /**
     * Queue savings withdrawal disbursement request
     */
    async queueSavingsWithdrawalDisbursementRequest(
        email: string,
        shopkeeperName: string,
        applicantName: string,
        withdrawalNumber: string,
        withdrawalAmount: number,
        bankAccountNumber: string,
    ) {
        return this.addToQueue({
            type: EmailJobType.SAVINGS_WITHDRAWAL_DISBURSEMENT_REQUEST,
            to: email,
            data: {
                shopkeeperName,
                applicantName,
                withdrawalNumber,
                withdrawalAmount,
                bankAccountNumber,
            },
        });
    }

    /**
     * Queue savings withdrawal authorization request
     */
    async queueSavingsWithdrawalAuthorizationRequest(
        email: string,
        ketuaName: string,
        applicantName: string,
        withdrawalNumber: string,
        withdrawalAmount: number,
    ) {
        return this.addToQueue({
            type: EmailJobType.SAVINGS_WITHDRAWAL_AUTHORIZATION_REQUEST,
            to: email,
            data: { ketuaName, applicantName, withdrawalNumber, withdrawalAmount },
        });
    }

    /**
     * Queue savings withdrawal approved notification
     */
    async queueSavingsWithdrawalApproved(
        email: string,
        applicantName: string,
        withdrawalNumber: string,
        withdrawalAmount: number,
        bankAccountNumber: string,
    ) {
        return this.addToQueue({
            type: EmailJobType.SAVINGS_WITHDRAWAL_APPROVED,
            to: email,
            data: { applicantName, withdrawalNumber, withdrawalAmount, bankAccountNumber },
        });
    }

    /**
     * Queue savings withdrawal completed notification
     */
    async queueSavingsWithdrawalCompleted(
        email: string,
        applicantName: string,
        withdrawalNumber: string,
        withdrawalAmount: number,
    ) {
        return this.addToQueue({
            type: EmailJobType.SAVINGS_WITHDRAWAL_COMPLETED,
            to: email,
            data: { applicantName, withdrawalNumber, withdrawalAmount },
        });
    }

    // ==========================================
    // GENERIC EMAIL METHOD
    // ==========================================

    /**
     * Queue generic email dengan custom subject dan HTML
     */
    async queueGenericEmail(email: string, subject: string, html: string) {
        return this.addToQueue({
            type: EmailJobType.GENERIC_EMAIL,
            to: email,
            data: { subject, html },
        });
    }

    // ==========================================
    // BULK EMAIL HELPER METHODS
    // ==========================================

    /**
     * Kirim approval request ke banyak approvers
     * Sangat berguna untuk multi-level approval
     */
    async queueBulkApprovalRequests(
        approvers: Array<{
            email: string;
            approverName: string;
        }>,
        applicantName: string,
        employeeNumber: string,
        roleName: string,
    ): Promise<string[]> {
        const jobs: EmailJob[] = approvers.map((approver) => ({
            type: EmailJobType.APPROVAL_REQUEST,
            to: approver.email,
            data: {
                approverName: approver.approverName,
                applicantName,
                employeeNumber,
                roleName,
            },
        }));

        return this.addBulkToQueue(jobs, { delayBetweenEmails: 200 });
    }

    /**
     * Kirim loan approval request ke banyak approvers
     */
    async queueBulkLoanApprovalRequests(
        approvers: Array<{
            email: string;
            approverName: string;
        }>,
        applicantName: string,
        loanNumber: string,
        loanAmount: number,
        roleName: string,
    ): Promise<string[]> {
        const jobs: EmailJob[] = approvers.map((approver) => ({
            type: EmailJobType.LOAN_APPROVAL_REQUEST,
            to: approver.email,
            data: {
                approverName: approver.approverName,
                applicantName,
                loanNumber,
                loanAmount,
                roleName,
            },
        }));

        return this.addBulkToQueue(jobs, { delayBetweenEmails: 200 });
    }

    /**
     * Kirim deposit approval request ke banyak approvers
     */
    async queueBulkDepositApprovalRequests(
        approvers: Array<{
            email: string;
            approverName: string;
        }>,
        applicantName: string,
        depositNumber: string,
        depositAmount: number,
        roleName: string,
    ): Promise<string[]> {
        const jobs: EmailJob[] = approvers.map((approver) => ({
            type: EmailJobType.DEPOSIT_APPROVAL_REQUEST,
            to: approver.email,
            data: {
                approverName: approver.approverName,
                applicantName,
                depositNumber,
                depositAmount,
                roleName,
            },
        }));

        return this.addBulkToQueue(jobs, { delayBetweenEmails: 200 });
    }

    /**
     * Kirim new member notification ke banyak recipients (pengawas, payroll, dll)
     */
    async queueBulkNewMemberNotifications(
        recipients: Array<{
            email: string;
            recipientName: string;
        }>,
        memberName: string,
        memberEmail: string,
    ): Promise<string[]> {
        const jobs: EmailJob[] = recipients.map((recipient) => ({
            type: EmailJobType.NEW_MEMBER_NOTIFICATION,
            to: recipient.email,
            data: {
                recipientName: recipient.recipientName,
                memberName,
                memberEmail,
            },
        }));

        return this.addBulkToQueue(jobs, { delayBetweenEmails: 200 });
    }

    /**
     * Kirim deposit change approval request ke banyak approvers
     */
    async queueBulkDepositChangeApprovalRequests(
        approvers: Array<{
            email: string;
            approverName: string;
        }>,
        applicantName: string,
        changeNumber: string,
        depositNumber: string,
        currentAmount: number,
        newAmount: number,
        roleName: string,
    ): Promise<string[]> {
        const jobs: EmailJob[] = approvers.map((approver) => ({
            type: EmailJobType.DEPOSIT_CHANGE_APPROVAL_REQUEST,
            to: approver.email,
            data: {
                approverName: approver.approverName,
                applicantName,
                changeNumber,
                depositNumber,
                currentAmount,
                newAmount,
                roleName,
            },
        }));

        return this.addBulkToQueue(jobs, { delayBetweenEmails: 200 });
    }

    // ==========================================
    // QUEUE MANAGEMENT METHODS
    // ==========================================

    /**
     * Get queue status (untuk monitoring)
     */
    async getQueueStatus() {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            this.emailQueue.getWaitingCount(),
            this.emailQueue.getActiveCount(),
            this.emailQueue.getCompletedCount(),
            this.emailQueue.getFailedCount(),
            this.emailQueue.getDelayedCount(),
        ]);

        return {
            waiting,
            active,
            completed,
            failed,
            delayed,
            total: waiting + active + delayed,
        };
    }

    /**
     * Pause queue (untuk maintenance)
     */
    async pauseQueue(): Promise<void> {
        await this.emailQueue.pause();
        this.logger.warn('Email queue paused');
    }

    /**
     * Resume queue
     */
    async resumeQueue(): Promise<void> {
        await this.emailQueue.resume();
        this.logger.log('Email queue resumed');
    }

    /**
     * Clean old jobs
     */
    async cleanOldJobs(gracePeriodMs: number = 24 * 60 * 60 * 1000): Promise<void> {
        await this.emailQueue.clean(gracePeriodMs, 1000, 'completed');
        await this.emailQueue.clean(gracePeriodMs * 7, 1000, 'failed');
        this.logger.log('Old jobs cleaned');
    }
}
