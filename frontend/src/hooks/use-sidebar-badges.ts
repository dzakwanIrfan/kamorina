import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { loanService } from '@/services/loan.service';
import { savingsWithdrawalService } from '@/services/savings-withdrawal.service';
import { depositService } from '@/services/deposit.service';
import { depositChangeService } from '@/services/deposit-change.service';
import { memberApplicationService } from '@/services/member-application.service';
import { LoanStatus, LoanApprovalStep } from '@/types/loan.types';
import { SavingsWithdrawalStatus, SavingsWithdrawalStep } from '@/types/savings-withdrawal.types';
import { DepositStatus, DepositApprovalStep } from '@/types/deposit.types';
import { DepositChangeStatus, DepositChangeApprovalStep } from '@/types/deposit-change.types';
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
                    // Determine the correct status/step query based on role
                    // Note: The backend logic for "getPending" might be complex, so relying on "All Loans + Status Filter" 
                    // might be the standard way if specific "pending" endpoints don't cover everything.
                    // However, for badge count, "SUBMITTED" or specific steps are usually what we want.

                    let loanStatus: LoanStatus | undefined;
                    let loanStep: LoanApprovalStep | undefined;

                    // Simple logic: If any approver, just fetch what's pending for them.
                    // Since the API typically filters by what the USER can see/approve, 
                    // allow the backend (via service methods) to handle the heavy lifting if possible.
                    // We will use standard "pending" queries where available.

                    // Wait, loanService uses general getAllLoans. We should filter.
                    if (isDSP) {
                        loanStatus = LoanStatus.UNDER_REVIEW_DSP;
                    } else if (isKetua) {
                        loanStatus = LoanStatus.UNDER_REVIEW_KETUA;
                    } else if (isPengawas) {
                        loanStatus = LoanStatus.UNDER_REVIEW_PENGAWAS;
                    }

                    // If we have a specific status target, fetch it
                    if (loanStatus) {
                        keys.push('/dashboard/loans/approvals');
                        promises.push(loanService.getAllLoans({ status: loanStatus, limit: 1 }));
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
                    let swStatus: SavingsWithdrawalStatus | undefined;

                    if (isDSP) {
                        swStatus = SavingsWithdrawalStatus.UNDER_REVIEW_DSP;
                    } else if (isKetua) {
                        swStatus = SavingsWithdrawalStatus.UNDER_REVIEW_KETUA;
                    }

                    if (swStatus) {
                        keys.push('/dashboard/savings-withdrawals/approvals');
                        promises.push(savingsWithdrawalService.getAllWithdrawals({ status: swStatus, limit: 1 }));
                    }
                }

                // 5. Savings Withdrawal Disbursement (Shopkeeper)
                if (isShopkeeper) {
                    keys.push('/dashboard/savings-withdrawals/disbursement');
                    // No specific "pending disbursement" endpoint visible in service, so we filter normal list
                    promises.push(savingsWithdrawalService.getAllWithdrawals({
                        status: SavingsWithdrawalStatus.APPROVED_WAITING_DISBURSEMENT,
                        limit: 1
                    }));
                }

                // 6. Savings Withdrawal Authorization (Ketua)
                if (isKetua) {
                    keys.push('/dashboard/savings-withdrawals/authorization');
                    /* 
                      Based on types: 
                      Ketua Authorization probably happens after DISBURSEMENT_IN_PROGRESS 
                      or is a separate step. Checking step KETUA_AUTH usually implies pending auth.
                    */
                    promises.push(savingsWithdrawalService.getAllWithdrawals({
                        step: SavingsWithdrawalStep.KETUA_AUTH,
                        limit: 1
                    }));
                }

                // 7. Deposit Approvals
                if (isKetua || isDSP) {
                    let depositStatus: DepositStatus | undefined;
                    if (isDSP) depositStatus = DepositStatus.UNDER_REVIEW_DSP;
                    if (isKetua) depositStatus = DepositStatus.UNDER_REVIEW_KETUA;

                    if (depositStatus) {
                        keys.push('/dashboard/deposits/approvals');
                        promises.push(depositService.getAllDeposits({ status: depositStatus, limit: 1 }));
                    }
                }

                // 8. Deposit Change Approvals
                if (isKetua || isDSP) {
                    let dcStatus: DepositChangeStatus | undefined;
                    if (isDSP) dcStatus = DepositChangeStatus.UNDER_REVIEW_DSP;
                    if (isKetua) dcStatus = DepositChangeStatus.UNDER_REVIEW_KETUA;

                    if (dcStatus) {
                        keys.push('/dashboard/deposit-changes/approvals');
                        promises.push(depositChangeService.getAllChangeRequests({ status: dcStatus, limit: 1 }));
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
