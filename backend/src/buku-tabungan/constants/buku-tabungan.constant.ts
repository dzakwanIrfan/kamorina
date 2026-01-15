export const TRANSACTION_TYPES = {
  IURAN_PENDAFTARAN: 'iuran_pendaftaran',
  IURAN_BULANAN: 'iuran_bulanan',
  TABUNGAN_DEPOSITO: 'tabungan_deposito',
  SHU: 'shu',
  PENARIKAN: 'penarikan',
  BUNGA: 'bunga',
} as const;

export const SALDO_TYPES = {
  POKOK: 'saldo_pokok',
  WAJIB: 'saldo_wajib',
  SUKARELA: 'saldo_sukarela',
  BUNGA_DEPOSITO: 'bunga_deposito',
} as const;

export const DEFAULT_INCLUDE_ACCOUNT = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      employee: {
        select: {
          employeeNumber: true,
          fullName: true,
          department: {
            select: {
              id: true,
              departmentName: true,
            },
          },
          bankAccountNumber: true,
          bankAccountName: true,
        },
      },
    },
  },
} as const;

export const DEFAULT_INCLUDE_TRANSACTION = {
  payrollPeriod: {
    select: {
      id: true,
      month: true,
      year: true,
      name: true,
    },
  },
} as const;

export const DEFAULT_INCLUDE_ACCOUNT_LIST = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      employee: {
        select: {
          employeeNumber: true,
          fullName: true,
          employeeType: true,
          department: {
            select: {
              id: true,
              departmentName: true,
            },
          },
          golongan: {
            select: {
              id: true,
              golonganName: true,
            },
          },
        },
      },
    },
  },
} as const;

