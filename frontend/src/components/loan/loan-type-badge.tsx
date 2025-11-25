'use client';

import { Badge } from '@/components/ui/badge';
import { LoanType } from '@/types/loan.types';
import { getLoanTypeLabel } from '@/lib/loan-utils';
import { 
  Banknote, 
  ShoppingBag, 
  ShoppingCart, 
  Smartphone 
} from 'lucide-react';

interface LoanTypeBadgeProps {
  loanType: LoanType;
  showIcon?: boolean;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

const loanTypeIcons: Record<LoanType, any> = {
  [LoanType.CASH_LOAN]: Banknote,
  [LoanType.GOODS_REIMBURSE]: ShoppingBag,
  [LoanType.GOODS_ONLINE]: ShoppingCart,
  [LoanType.GOODS_PHONE]: Smartphone,
};

export function LoanTypeBadge({ 
  loanType, 
  showIcon = false, 
  variant = 'outline' 
}: LoanTypeBadgeProps) {
  const Icon = loanTypeIcons[loanType];

  return (
    <Badge variant={variant} className="flex items-center gap-1 w-fit">
      {showIcon && <Icon className="h-3 w-3" />}
      {getLoanTypeLabel(loanType)}
    </Badge>
  );
}