import { 
  DepositChangeStatus, 
  DepositChangeApprovalStep, 
  DepositChangeType 
} from '@/types/deposit-change.types';
import { CheckCircle2, Clock, XCircle, ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';

export const changeStatusMap = {
  [DepositChangeStatus.DRAFT]: { 
    label: 'Draft', 
    variant: 'secondary' as const, 
    icon: Clock 
  },
  [DepositChangeStatus.SUBMITTED]: { 
    label: 'Submitted', 
    variant: 'default' as const, 
    icon: Clock 
  },
  [DepositChangeStatus.UNDER_REVIEW_DSP]: { 
    label: 'Review DSP', 
    variant: 'default' as const, 
    icon: Clock 
  },
  [DepositChangeStatus.UNDER_REVIEW_KETUA]: { 
    label: 'Review Ketua', 
    variant: 'default' as const, 
    icon: Clock 
  },
  [DepositChangeStatus. APPROVED]: { 
    label: 'Disetujui', 
    variant: 'default' as const, 
    icon: CheckCircle2 
  },
  [DepositChangeStatus.REJECTED]: { 
    label: 'Ditolak', 
    variant: 'destructive' as const, 
    icon: XCircle 
  },
  [DepositChangeStatus.CANCELLED]: { 
    label: 'Dibatalkan', 
    variant: 'destructive' as const, 
    icon: XCircle 
  },
};

export const changeStepMap = {
  [DepositChangeApprovalStep. DIVISI_SIMPAN_PINJAM]: 'Divisi Simpan Pinjam',
  [DepositChangeApprovalStep. KETUA]: 'Ketua',
};

export const changeTypeMap = {
  [DepositChangeType.AMOUNT_CHANGE]: { 
    label: 'Perubahan Jumlah', 
    icon: TrendingUp,
    color: 'text-blue-600' 
  },
  [DepositChangeType.TENOR_CHANGE]: { 
    label: 'Perubahan Tenor', 
    icon: Clock,
    color: 'text-green-600' 
  },
  [DepositChangeType.BOTH]: { 
    label: 'Perubahan Jumlah & Tenor', 
    icon: ArrowUpDown,
    color: 'text-purple-600' 
  },
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDifference = (amount: number): string => {
  const formatted = formatCurrency(Math.abs(amount));
  if (amount > 0) return `+${formatted}`;
  if (amount < 0) return `-${formatted}`;
  return formatted;
};