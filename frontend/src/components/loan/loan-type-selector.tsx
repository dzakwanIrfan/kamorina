'use client';

import { LoanType } from '@/types/loan.types';
import { getLoanTypeLabel, getLoanTypeDescription } from '@/lib/loan-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Banknote, 
  ShoppingBag, 
  ShoppingCart, 
  Smartphone,
  CheckCircle2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoanTypeSelectorProps {
  selectedType: LoanType | null;
  onSelect: (type: LoanType) => void;
  disabled?: boolean;
}

const loanTypeIcons: Record<LoanType, any> = {
  [LoanType.CASH_LOAN]: Banknote,
  [LoanType.GOODS_REIMBURSE]: ShoppingBag,
  [LoanType.GOODS_ONLINE]: ShoppingCart,
  [LoanType.GOODS_PHONE]: Smartphone,
};

const loanTypeBadges: Record<LoanType, string> = {
  [LoanType.CASH_LOAN]: 'Sesuai Plafond',
  [LoanType.GOODS_REIMBURSE]: 'Maks 15 Juta',
  [LoanType.GOODS_ONLINE]: 'Maks 15 Juta',
  [LoanType.GOODS_PHONE]: 'Harga Rekanan',
};

export function LoanTypeSelector({ selectedType, onSelect, disabled }: LoanTypeSelectorProps) {
  const loanTypes = Object.values(LoanType);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {loanTypes.map((type) => {
        const Icon = loanTypeIcons[type];
        const isSelected = selectedType === type;

        return (
          <Card
            key={type}
            className={cn(
              'cursor-pointer transition-all hover:shadow-md relative',
              isSelected && 'ring-2 ring-primary',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => !disabled && onSelect(type)}
          >
            {isSelected && (
              <div className="absolute top-2 right-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between">
                <Icon className="h-8 w-8 text-primary mb-2" />
              </div>
              <CardTitle className="text-lg">{getLoanTypeLabel(type)}</CardTitle>
              <CardDescription>{getLoanTypeDescription(type)}</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">{loanTypeBadges[type]}</Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}