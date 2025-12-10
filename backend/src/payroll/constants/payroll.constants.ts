export const PAYROLL_SETTINGS_KEYS = {
  CUTOFF_DATE: 'cooperative_cutoff_date',
  PAYROLL_DATE: 'cooperative_payroll_date',
  MONTHLY_MEMBERSHIP_FEE: 'monthly_membership_fee',
  DEPOSIT_INTEREST_RATE: 'deposit_interest_rate',
  LOAN_INTEREST_RATE: 'loan_interest_rate',
  INITIAL_MEMBERSHIP_FEE: 'initial_membership_fee',
} as const;

export const DEFAULT_VALUES = {
  CUTOFF_DATE: 15,
  PAYROLL_DATE: 27,
  MONTHLY_MEMBERSHIP_FEE: 50000,
  DEPOSIT_INTEREST_RATE: 4,
  LOAN_INTEREST_RATE: 8,
  INITIAL_MEMBERSHIP_FEE: 500000,
} as const;

export const INSTALLMENT_PLANS = {
  FULL_PAYMENT: 1,
  TWO_INSTALLMENTS: 2,
} as const;
