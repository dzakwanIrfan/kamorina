import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailService } from './mail.service';
import {
    EmailJob,
    EmailJobType,
    EMAIL_QUEUE_NAME,
} from './mail.types';

/**
 * Mail Queue Processor
 * 
 * Worker yang memproses semua email job dari queue.
 * Menggunakan BullMQ untuk reliable email delivery dengan:
 * - Automatic retries dengan exponential backoff
 * - Dead letter queue untuk email yang gagal
 * - Rate limiting untuk mencegah throttling SMTP
 */
@Processor(EMAIL_QUEUE_NAME, {
    concurrency: 3, // Proses maksimal 3 email bersamaan
    limiter: {
        max: 10, // Maksimal 10 job per durasi
        duration: 1000, // Per 1 detik (10 emails/second)
    },
})
export class MailProcessor extends WorkerHost {
    private readonly logger = new Logger(MailProcessor.name);

    constructor(private readonly mailService: MailService) {
        super();
    }

    /**
     * Main processor function
     * Handle setiap email job berdasarkan type nya
     */
    async process(job: Job<EmailJob>): Promise<void> {
        const { type, to } = job.data;

        this.logger.log(`Processing email job: ${job.id} | Type: ${type} | To: ${to}`);

        try {
            await this.processEmailByType(job.data);
            this.logger.log(`Email sent successfully: ${job.id}`);
        } catch (error) {
            this.logger.error(`Failed to send email: ${job.id}`, error);
            throw error; // Re-throw untuk trigger retry
        }
    }

    /**
     * Process email berdasarkan type
     */
    private async processEmailByType(emailJob: EmailJob): Promise<void> {
        switch (emailJob.type) {
            // ========= AUTH EMAILS =========
            case EmailJobType.EMAIL_VERIFICATION:
                await this.mailService.sendEmailVerification(
                    emailJob.to,
                    emailJob.data.name,
                    emailJob.data.token,
                );
                break;

            case EmailJobType.PASSWORD_RESET:
                await this.mailService.sendPasswordResetEmail(
                    emailJob.to,
                    emailJob.data.name,
                    emailJob.data.token,
                );
                break;

            // ========= MEMBER APPLICATION EMAILS =========
            case EmailJobType.APPROVAL_REQUEST:
                await this.mailService.sendApprovalRequest(
                    emailJob.to,
                    emailJob.data.approverName,
                    emailJob.data.applicantName,
                    emailJob.data.employeeNumber,
                    emailJob.data.roleName,
                );
                break;

            case EmailJobType.APPLICATION_REJECTED:
                await this.mailService.sendApplicationRejected(
                    emailJob.to,
                    emailJob.data.applicantName,
                    emailJob.data.reason,
                );
                break;

            case EmailJobType.MEMBERSHIP_APPROVED:
                await this.mailService.sendMembershipApproved(
                    emailJob.to,
                    emailJob.data.memberName,
                );
                break;

            case EmailJobType.NEW_MEMBER_NOTIFICATION:
                await this.mailService.sendNewMemberNotification(
                    emailJob.to,
                    emailJob.data.recipientName,
                    emailJob.data.memberName,
                    emailJob.data.memberEmail,
                );
                break;

            // ========= LOAN EMAILS =========
            case EmailJobType.LOAN_APPROVAL_REQUEST:
                await this.mailService.sendLoanApprovalRequest(
                    emailJob.to,
                    emailJob.data.approverName,
                    emailJob.data.applicantName,
                    emailJob.data.loanNumber,
                    emailJob.data.loanAmount,
                    emailJob.data.roleName,
                );
                break;

            case EmailJobType.LOAN_REVISED:
                await this.mailService.sendLoanRevised(
                    emailJob.to,
                    emailJob.data.applicantName,
                    emailJob.data.loanNumber,
                    emailJob.data.revisionNotes,
                );
                break;

            case EmailJobType.LOAN_REJECTED:
                await this.mailService.sendLoanRejected(
                    emailJob.to,
                    emailJob.data.applicantName,
                    emailJob.data.loanNumber,
                    emailJob.data.reason,
                );
                break;

            case EmailJobType.LOAN_DISBURSEMENT_REQUEST:
                await this.mailService.sendLoanDisbursementRequest(
                    emailJob.to,
                    emailJob.data.shopkeeperName,
                    emailJob.data.applicantName,
                    emailJob.data.loanNumber,
                    emailJob.data.loanAmount,
                    emailJob.data.bankAccountNumber,
                );
                break;

            case EmailJobType.LOAN_AUTHORIZATION_REQUEST:
                await this.mailService.sendLoanAuthorizationRequest(
                    emailJob.to,
                    emailJob.data.ketuaName,
                    emailJob.data.applicantName,
                    emailJob.data.loanNumber,
                    emailJob.data.loanAmount,
                );
                break;

            case EmailJobType.LOAN_DISBURSED:
                await this.mailService.sendLoanDisbursed(
                    emailJob.to,
                    emailJob.data.applicantName,
                    emailJob.data.loanNumber,
                    emailJob.data.loanAmount,
                    emailJob.data.bankAccountNumber,
                );
                break;

            case EmailJobType.LOAN_COMPLETION_NOTIFICATION:
                await this.mailService.sendLoanCompletionNotification(
                    emailJob.to,
                    emailJob.data.applicantName,
                    emailJob.data.loanNumber,
                    emailJob.data.loanAmount,
                );
                break;

            // ========= DEPOSIT EMAILS =========
            case EmailJobType.DEPOSIT_APPROVAL_REQUEST:
                await this.mailService.sendDepositApprovalRequest(
                    emailJob.to,
                    emailJob.data.approverName,
                    emailJob.data.applicantName,
                    emailJob.data.depositNumber,
                    emailJob.data.depositAmount,
                    emailJob.data.roleName,
                );
                break;

            case EmailJobType.DEPOSIT_REJECTED:
                await this.mailService.sendDepositRejected(
                    emailJob.to,
                    emailJob.data.applicantName,
                    emailJob.data.depositNumber,
                    emailJob.data.reason,
                );
                break;

            case EmailJobType.DEPOSIT_APPROVED:
                await this.mailService.sendDepositApproved(
                    emailJob.to,
                    emailJob.data.applicantName,
                    emailJob.data.depositNumber,
                    emailJob.data.depositAmount,
                    emailJob.data.tenorMonths,
                );
                break;

            case EmailJobType.DEPOSIT_PAYROLL_NOTIFICATION:
                await this.mailService.sendDepositPayrollNotification(
                    emailJob.to,
                    emailJob.data.payrollName,
                    emailJob.data.applicantName,
                    emailJob.data.depositNumber,
                    emailJob.data.depositAmount,
                );
                break;

            // ========= DEPOSIT CHANGE EMAILS =========
            case EmailJobType.DEPOSIT_CHANGE_APPROVAL_REQUEST:
                await this.mailService.sendDepositChangeApprovalRequest(
                    emailJob.to,
                    emailJob.data.approverName,
                    emailJob.data.applicantName,
                    emailJob.data.changeNumber,
                    emailJob.data.depositNumber,
                    emailJob.data.currentAmount,
                    emailJob.data.newAmount,
                    emailJob.data.roleName,
                );
                break;

            case EmailJobType.DEPOSIT_CHANGE_REJECTED:
                await this.mailService.sendDepositChangeRejected(
                    emailJob.to,
                    emailJob.data.applicantName,
                    emailJob.data.changeNumber,
                    emailJob.data.depositNumber,
                    emailJob.data.reason,
                );
                break;

            case EmailJobType.DEPOSIT_CHANGE_APPROVED:
                await this.mailService.sendDepositChangeApproved(
                    emailJob.to,
                    emailJob.data.applicantName,
                    emailJob.data.changeNumber,
                    emailJob.data.depositNumber,
                    emailJob.data.currentAmount,
                    emailJob.data.newAmount,
                    emailJob.data.currentTenor,
                    emailJob.data.newTenor,
                    emailJob.data.adminFee,
                );
                break;

            case EmailJobType.DEPOSIT_CHANGE_PAYROLL_NOTIFICATION:
                await this.mailService.sendDepositChangePayrollNotification(
                    emailJob.to,
                    emailJob.data.payrollName,
                    emailJob.data.applicantName,
                    emailJob.data.changeNumber,
                    emailJob.data.depositNumber,
                    emailJob.data.currentAmount,
                    emailJob.data.newAmount,
                    emailJob.data.adminFee,
                );
                break;

            case EmailJobType.DEPOSIT_CHANGE_EMPLOYEE_NOTIFICATION:
                await this.mailService.sendDepositChangeNotificationToEmployee(
                    emailJob.to,
                    emailJob.data.employeeName,
                    emailJob.data.changeNumber,
                    emailJob.data.depositNumber,
                    emailJob.data.currentAmount,
                    emailJob.data.newAmount,
                    emailJob.data.currentTenor,
                    emailJob.data.newTenor,
                    emailJob.data.adminFee,
                    new Date(emailJob.data.effectiveDate),
                );
                break;

            // ========= SAVINGS WITHDRAWAL EMAILS =========
            case EmailJobType.SAVINGS_WITHDRAWAL_APPROVAL_REQUEST:
                await this.mailService.sendSavingsWithdrawalApprovalRequest(
                    emailJob.to,
                    emailJob.data.approverName,
                    emailJob.data.applicantName,
                    emailJob.data.withdrawalNumber,
                    emailJob.data.withdrawalAmount,
                    emailJob.data.roleName,
                );
                break;

            case EmailJobType.SAVINGS_WITHDRAWAL_REJECTED:
                await this.mailService.sendSavingsWithdrawalRejected(
                    emailJob.to,
                    emailJob.data.applicantName,
                    emailJob.data.withdrawalNumber,
                    emailJob.data.reason,
                );
                break;

            case EmailJobType.SAVINGS_WITHDRAWAL_DISBURSEMENT_REQUEST:
                await this.mailService.sendSavingsWithdrawalDisbursementRequest(
                    emailJob.to,
                    emailJob.data.shopkeeperName,
                    emailJob.data.applicantName,
                    emailJob.data.withdrawalNumber,
                    emailJob.data.withdrawalAmount,
                    emailJob.data.bankAccountNumber,
                );
                break;

            case EmailJobType.SAVINGS_WITHDRAWAL_AUTHORIZATION_REQUEST:
                await this.mailService.sendSavingsWithdrawalAuthorizationRequest(
                    emailJob.to,
                    emailJob.data.ketuaName,
                    emailJob.data.applicantName,
                    emailJob.data.withdrawalNumber,
                    emailJob.data.withdrawalAmount,
                );
                break;

            case EmailJobType.SAVINGS_WITHDRAWAL_APPROVED:
                await this.mailService.sendSavingsWithdrawalApproved(
                    emailJob.to,
                    emailJob.data.applicantName,
                    emailJob.data.withdrawalNumber,
                    emailJob.data.withdrawalAmount,
                    emailJob.data.bankAccountNumber,
                );
                break;

            case EmailJobType.SAVINGS_WITHDRAWAL_COMPLETED:
                await this.mailService.sendSavingsWithdrawalCompleted(
                    emailJob.to,
                    emailJob.data.applicantName,
                    emailJob.data.withdrawalNumber,
                    emailJob.data.withdrawalAmount,
                );
                break;

            // ========= GENERIC EMAILS =========
            case EmailJobType.GENERIC_EMAIL:
                await this.mailService.sendGenericEmail(
                    emailJob.to,
                    emailJob.data.subject,
                    emailJob.data.html,
                );
                break;

            default:
                this.logger.warn(`Unknown email type: ${(emailJob as EmailJob).type}`);
                throw new Error(`Unknown email type: ${(emailJob as EmailJob).type}`);
        }
    }

    // ========= EVENT HANDLERS =========

    @OnWorkerEvent('completed')
    onCompleted(job: Job<EmailJob>) {
        this.logger.debug(`Job ${job.id} completed for ${job.data.to}`);
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job<EmailJob>, error: Error) {
        this.logger.error(
            `Job ${job.id} failed for ${job.data.to} - Attempt: ${job.attemptsMade}/${job.opts.attempts}`,
            error.message,
        );
    }

    @OnWorkerEvent('error')
    onError(error: Error) {
        this.logger.error('Worker error:', error);
    }
}
