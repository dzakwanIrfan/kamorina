import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { loanService } from '@/services/loan.service';
import { savingsWithdrawalService } from '@/services/savings-withdrawal.service';
import { depositService } from '@/services/deposit.service';
import { depositChangeService } from '@/services/deposit-change.service';
import { memberApplicationService } from '@/services/member-application.service';
import { LoanApprovalStep } from '@/types/loan.types';
import { SavingsWithdrawalStatus, SavingsWithdrawalStep } from '@/types/savings-withdrawal.types';
import { DepositApprovalStep } from '@/types/deposit.types';
import { DepositChangeApprovalStep } from '@/types/deposit-change.types';
import { ApplicationStatus, ApprovalStep } from '@/types/member-application.types';

export function useSidebarBadges() {
    const { user } = useAuthStore();
    const [badges, setBadges] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);

    // Helper to check roles
    const hasRole = (roles: string[]) => {
        return user?.roles?.some((role) => roles.includes(role));
    };

    const isKetua = hasRole(['ketua']);
    const isDSP = hasRole(['divisi_simpan_pinjam']);
    const isShopkeeper = hasRole(['shopkeeper']);
    const isPengawas = hasRole(['pengawas']);

    useEffect(() => {
        const fetchBadges = async () => {
            if (!user) return;
            setLoading(true);

            const newBadges: Record<string, number> = {};

            try {
                const promises: Promise<any>[] = [];
                const keys: string[] = [];

                // 1. Loans Approvals
                if (isKetua || isDSP || isPengawas) {
                    let loanStep: LoanApprovalStep | undefined;

                    if (isDSP) {
                        loanStep = LoanApprovalStep.DIVISI_SIMPAN_PINJAM;
                    } else if (isKetua) {
                        loanStep = LoanApprovalStep.KETUA;
                    } else if (isPengawas) {
                        loanStep = LoanApprovalStep.PENGAWAS;
                    }

                    if (loanStep) {
                        keys.push('/dashboard/loans/approvals');
                        promises.push(loanService.getAllLoans({ step: loanStep, limit: 1 }));
                    }
                }

                // 2. Loans Disbursement (Shopkeeper)
                if (isShopkeeper) {
                    keys.push('/dashboard/loans/disbursement');
                    promises.push(loanService.getPendingDisbursement({ limit: 1 }));
                }

                // 3. Loans Authorization (Ketua)
                if (isKetua) {
                    keys.push('/dashboard/loans/authorization');
                    promises.push(loanService.getPendingAuthorization({ limit: 1 }));
                }

                // 4. Savings Withdrawal Approvals
                if (isKetua || isDSP) {
                    let swStep: SavingsWithdrawalStep | undefined;

                    if (isDSP) {
                        swStep = SavingsWithdrawalStep.DIVISI_SIMPAN_PINJAM;
                    } else if (isKetua) {
                        swStep = SavingsWithdrawalStep.KETUA;
                    }

                    if (swStep) {
                        keys.push('/dashboard/savings-withdrawals/approvals');
                        promises.push(savingsWithdrawalService.getAllWithdrawals({ step: swStep, limit: 1 }));
                    }
                }

                // 5. Savings Withdrawal Disbursement (Shopkeeper)
                if (isShopkeeper) {
                    keys.push('/dashboard/savings-withdrawals/disbursement');
                    promises.push(savingsWithdrawalService.getAllWithdrawals({
                        status: SavingsWithdrawalStatus.APPROVED_WAITING_DISBURSEMENT,
                        limit: 1
                    }));
                }

                // 6. Savings Withdrawal Authorization (Ketua)
                if (isKetua) {
                    keys.push('/dashboard/savings-withdrawals/authorization');
                    promises.push(savingsWithdrawalService.getAllWithdrawals({
                        step: SavingsWithdrawalStep.KETUA_AUTH,
                        limit: 1
                    }));
                }

                // 7. Deposit Approvals
                if (isKetua || isDSP) {
                    let depositStep: DepositApprovalStep | undefined;

                    if (isDSP) depositStep = DepositApprovalStep.DIVISI_SIMPAN_PINJAM;
                    if (isKetua) depositStep = DepositApprovalStep.KETUA;

                    if (depositStep) {
                        keys.push('/dashboard/deposits/approvals');
                        promises.push(depositService.getAllDeposits({ step: depositStep, limit: 1 }));
                    }
                }

                // 8. Deposit Change Approvals
                if (isKetua || isDSP) {
                    let dcStep: DepositChangeApprovalStep | undefined;

                    if (isDSP) dcStep = DepositChangeApprovalStep.DIVISI_SIMPAN_PINJAM;
                    if (isKetua) dcStep = DepositChangeApprovalStep.KETUA;

                    if (dcStep) {
                        keys.push('/dashboard/deposit-changes/approvals');
                        promises.push(depositChangeService.getAllChangeRequests({ step: dcStep, limit: 1 }));
                    }
                }

                // 9. Member Applications
                if (isKetua || isDSP || isPengawas || hasRole(['payroll'])) {
                    // Member applications are only 'UNDER_REVIEW'. Steps differentiate who is reviewing.
                    // However, the service just has 'getApplications'.
                    // DSP is usually first step.
                    let appStep: ApprovalStep | undefined;
                    if (isDSP) appStep = ApprovalStep.DIVISI_SIMPAN_PINJAM;
                    if (isKetua) appStep = ApprovalStep.KETUA;

                    if (appStep) {
                        keys.push('/dashboard/member-application');
                        promises.push(memberApplicationService.getApplications({
                            status: ApplicationStatus.UNDER_REVIEW,
                            step: appStep,
                            limit: 1
                        }));
                    }
                }

                // Execute all promises
                const results = await Promise.all(promises);

                // Map results to keys
                results.forEach((res, index) => {
                    const key = keys[index];
                    if (res && res.meta && typeof res.meta.total === 'number') {
                        if (res.meta.total > 0) {
                            newBadges[key] = res.meta.total;
                        }
                    }
                });

            } catch (error) {
                console.error("Failed to fetch sidebar badges", error);
            } finally {
                setBadges(newBadges);
                setLoading(false);
            }
        };

        fetchBadges();

        // Optional: Set up an interval to refresh badges every minute
        const intervalId = setInterval(fetchBadges, 60000);
        return () => clearInterval(intervalId);

    }, [user]); // Re-run if user changes

    return { badges, loading };
}
