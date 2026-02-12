"use client";

import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Landmark,
  ArrowDownCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ActivityItem,
  ActivityType,
  STATUS_LABELS,
  STATUS_VARIANTS,
  ACTIVITY_TYPE_LABELS,
} from "@/types/dashboard.types";

interface ActivityListProps {
  activities: ActivityItem[];
  isApprover: boolean;
}

const ACTIVITY_CONFIG: Record<
  ActivityType,
  { icon: typeof CreditCard; color: string; bg: string }
> = {
  loan: {
    icon: CreditCard,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950",
  },
  deposit: {
    icon: Landmark,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950",
  },
  withdrawal: {
    icon: ArrowDownCircle,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-950",
  },
  repayment: {
    icon: CheckCircle2,
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-950",
  },
};

function getActivityRoute(type: ActivityType, id: string): string {
  const routes: Record<ActivityType, string> = {
    loan: `/dashboard/loans/${id}`,
    deposit: `/dashboard/deposits/${id}`,
    withdrawal: `/dashboard/savings-withdrawals/${id}`,
    repayment: `/dashboard/loan-repayments/${id}`,
  };
  return routes[type] || "/dashboard";
}

function formatCurrency(value: string): string {
  const numValue = parseFloat(value);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue);
}

export function ActivityList({ activities, isApprover }: ActivityListProps) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          {isApprover ? "Menunggu Persetujuan" : "Aktivitas Terkini"}
        </CardTitle>
        <CardDescription className="text-xs">
          {isApprover
            ? "Pengajuan yang perlu disetujui"
            : "Pengajuan yang sedang diproses"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-60 sm:h-72">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {isApprover
                  ? "Tidak ada pengajuan baru"
                  : "Tidak ada aktivitas"}
              </p>
            </div>
          ) : (
            <div className="space-y-2 pr-3">
              {activities.map((activity) => {
                const config = ACTIVITY_CONFIG[activity.type];
                const Icon = config?.icon || Clock;

                return (
                  <div
                    key={`${activity.type}-${activity.id}`}
                    className="cursor-pointer rounded-md border p-3 transition-colors hover:bg-muted/50"
                    onClick={() =>
                      router.push(getActivityRoute(activity.type, activity.id))
                    }
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`shrink-0 rounded-md p-2 ${config?.bg || "bg-gray-50"}`}
                        >
                          <Icon
                            className={`h-4 w-4 ${config?.color || "text-gray-600"}`}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {activity.title}
                          </p>
                          <div className="flex">
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(activity.amount)}
                            </p>
                            <span className="mx-1 text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(activity.date), "dd MMM yyyy", {
                                locale: localeId,
                              })}
                            </span>
                            {isApprover && activity.applicantName && (
                              <>
                                <span className="text-xs text-muted-foreground">·</span>
                                <span className="truncate text-xs text-muted-foreground">
                                  {activity.applicantName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">
                        {ACTIVITY_TYPE_LABELS[activity.type]}
                      </Badge>
                      <Badge
                        variant={
                          STATUS_VARIANTS[activity.status] || "secondary"
                        }
                        className="shrink-0 text-[10px]"
                      >
                        {STATUS_LABELS[activity.status] || activity.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
