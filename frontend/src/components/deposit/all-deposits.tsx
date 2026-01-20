"use client";

import { useState, useEffect, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  PiggyBank,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import { DataTableAdvanced } from "@/components/data-table/data-table-advanced";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DepositDetailDialog } from "@/components/deposit/deposit-detail-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { depositService } from "@/services/deposit.service";
import { DepositApplication, DepositStatus } from "@/types/deposit.types";
import { DataTableConfig } from "@/types/data-table.types";

const statusMap = {
  [DepositStatus.DRAFT]: {
    label: "Draft",
    variant: "secondary" as const,
    icon: Clock,
  },
  [DepositStatus.SUBMITTED]: {
    label: "Submitted",
    variant: "secondary" as const,
    icon: Clock,
  },
  [DepositStatus.UNDER_REVIEW_DSP]: {
    label: "Review DSP",
    variant: "default" as const,
    icon: Clock,
  },
  [DepositStatus.UNDER_REVIEW_KETUA]: {
    label: "Review Ketua",
    variant: "default" as const,
    icon: Clock,
  },
  [DepositStatus.APPROVED]: {
    label: "Disetujui",
    variant: "default" as const,
    icon: CheckCircle2,
  },
  [DepositStatus.ACTIVE]: {
    label: "Aktif",
    variant: "default" as const,
    icon: CheckCircle2,
  },
  [DepositStatus.COMPLETED]: {
    label: "Selesai",
    variant: "default" as const,
    icon: CheckCircle2,
  },
  [DepositStatus.REJECTED]: {
    label: "Ditolak",
    variant: "destructive" as const,
    icon: XCircle,
  },
  [DepositStatus.CANCELLED]: {
    label: "Dibatalkan",
    variant: "destructive" as const,
    icon: XCircle,
  },
};

export function AllDeposits() {
  const [data, setData] = useState<DepositApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDeposit, setSelectedDeposit] =
    useState<DepositApplication | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [searchValue, setSearchValue] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  useEffect(() => {
    fetchData();
  }, [meta.page, meta.limit, searchValue, filters, dateRange]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await depositService.getAllDeposits({
        page: meta.page,
        limit: meta.limit,
        search: searchValue || undefined,
        status: filters.status || undefined,
        startDate: dateRange.from
          ? format(dateRange.from, "yyyy-MM-dd")
          : undefined,
        endDate: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setData(response.data);
      setMeta(response.meta);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleViewDetail = (deposit: DepositApplication) => {
    setSelectedDeposit(deposit);
    setDetailDialogOpen(true);
  };

  const columns: ColumnDef<DepositApplication>[] = useMemo(
    () => [
      {
        accessorKey: "depositNumber",
        header: "No. Deposito",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-mono font-medium text-sm">
              {row.original.depositNumber}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(row.original.createdAt), "dd MMM yyyy", {
                locale: id,
              })}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "user.employee.fullName",
        header: "Nama Anggota",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-sm">
              {row.original.user?.employee.fullName}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.original.user?.employee?.employeeNumber}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "amountValue",
        header: "Jumlah",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <span className="font-semibold text-primary">
              {formatCurrency(row.original.amountValue)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "tenorMonths",
        header: "Tenor",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.tenorMonths} Bulan</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = statusMap[row.original.status];
          const StatusIcon = status.icon;
          return (
            <Badge
              variant={status.variant}
              className="flex items-center gap-1 w-fit"
            >
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "maturityDate",
        header: "Jatuh Tempo",
        cell: ({ row }) => {
          if (!row.original.maturityDate) return "-";
          return (
            <span className="text-sm">
              {format(new Date(row.original.maturityDate), "dd MMM yyyy", {
                locale: id,
              })}
            </span>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewDetail(row.original)}>
                <Eye className="h-4 w-4 mr-2" />
                Lihat Detail
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  const tableConfig: DataTableConfig<DepositApplication> = {
    searchable: true,
    searchPlaceholder: "Cari no. deposito atau nama member...",
    filterable: true,

    dateRangeFilter: true,
    selectable: false,
    filterFields: [
      {
        id: "status",
        label: "Status",
        type: "select",
        placeholder: "Semua Status",
        options: [
          { label: "Semua Status", value: "all" },
          { label: "Draft", value: DepositStatus.DRAFT },
          { label: "Submitted", value: DepositStatus.SUBMITTED },
          { label: "Disetujui", value: DepositStatus.APPROVED },
          { label: "Aktif", value: DepositStatus.ACTIVE },
          { label: "Selesai", value: DepositStatus.COMPLETED },
          { label: "Ditolak", value: DepositStatus.REJECTED },
          { label: "Dibatalkan", value: DepositStatus.CANCELLED },
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Semua Data Deposito</CardTitle>
          <CardDescription>
            Menampilkan seluruh data deposito anggota koperasi dari semua status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTableAdvanced
            columns={columns}
            data={data}
            meta={meta}
            config={tableConfig}
            onPageChange={(page) => setMeta((prev) => ({ ...prev, page }))}
            onPageSizeChange={(limit) =>
              setMeta((prev) => ({ ...prev, limit, page: 1 }))
            }
            onSearch={setSearchValue}
            onFiltersChange={setFilters}
            onResetFilters={() => {
              setFilters({});
              setDateRange({});
            }}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <DepositDetailDialog
        deposit={selectedDeposit}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onSuccess={fetchData}
        canApprove={false}
      />
    </div>
  );
}
