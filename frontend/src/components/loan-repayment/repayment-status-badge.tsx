import { Badge } from "@/components/ui/badge";
import { RepaymentStatus } from "@/types/loan-repayment.types";

interface RepaymentStatusBadgeProps {
  status: RepaymentStatus;
}

export function RepaymentStatusBadge({ status }: RepaymentStatusBadgeProps) {
  const getStatusConfig = (status: RepaymentStatus) => {
    switch (status) {
      case RepaymentStatus.UNDER_REVIEW_DSP:
        return {
          label: "Review DSP",
          variant: "outline" as const,
          className:
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
        };
      case RepaymentStatus.UNDER_REVIEW_KETUA:
        return {
          label: "Review Ketua",
          variant: "outline" as const,
          className:
            "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
        };
      case RepaymentStatus.APPROVED:
        return {
          label: "Disetujui",
          variant: "outline" as const,
          className:
            "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
        };
      case RepaymentStatus.REJECTED:
        return {
          label: "Ditolak",
          variant: "destructive" as const,
          className: "",
        };
      default:
        return {
          label: status,
          variant: "outline" as const,
          className: "",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
