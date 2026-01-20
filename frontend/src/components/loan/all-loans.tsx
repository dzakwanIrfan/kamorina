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
  MoreHorizontal,
  Banknote,
  AlertCircle,
  Shield,
  Loader2,
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
import { LoanDetailDialog } from "@/components/loan/loan-detail-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { loanService } from "@/services/loan.service";
import { LoanApplication, LoanStatus, LoanType } from "@/types/loan.types";
import { DataTableConfig } from "@/types/data-table.types";

const statusMap = {
  [LoanStatus.DRAFT]: {
    label: "Draft",
    variant: "secondary" as const,
    icon: Clock,
  },
  [LoanStatus.SUBMITTED]: {
    label: "Submitted",
    variant: "secondary" as const,
    icon: Clock,
  },
  [LoanStatus.UNDER_REVIEW_DSP]: {
    label: "Review DSP",
    variant: "secondary" as const,
    icon: Clock,
  },
  [LoanStatus.UNDER_REVIEW_KETUA]: {
    label: "Review Ketua",
    variant: "secondary" as const,
    icon: Clock,
  },
  [LoanStatus.UNDER_REVIEW_PENGAWAS]: {
    label: "Review Pengawas",
    variant: "secondary" as const,
    icon: Clock,
  },
  [LoanStatus.APPROVED_PENDING_DISBURSEMENT]: {
    label: "Menunggu Pencairan",
    variant: "outline" as const,
    icon: Banknote,
  },
  [LoanStatus.DISBURSEMENT_IN_PROGRESS]: {
    label: "Pencairan Diproses",
    variant: "outline" as const,
    icon: Banknote,
  },
  [LoanStatus.PENDING_AUTHORIZATION]: {
    label: "Menunggu Otorisasi",
    variant: "outline" as const,
    icon: Shield,
  },
  [LoanStatus.DISBURSED]: {
    label: "Dicairkan",
    variant: "default" as const,
    icon: CheckCircle2,
  },
  [LoanStatus.COMPLETED]: {
    label: "Lunas",
    variant: "default" as const,
    icon: CheckCircle2,
  },
  [LoanStatus.REJECTED]: {
    label: "Ditolak",
    variant: "destructive" as const,
    icon: XCircle,
  },
  [LoanStatus.CANCELLED]: {
    label: "Dibatalkan",
    variant: "destructive" as const,
    icon: XCircle,
  },
};

const loanTypeMap = {
  [LoanType.CASH_LOAN]: "Pinjaman Tunai",
  [LoanType.GOODS_REIMBURSE]: "Reimburse Barang",
  [LoanType.GOODS_ONLINE]: "Barang Online",
  [LoanType.GOODS_PHONE]: "Kredit HP",
};

export function AllLoans() {
  const [data, setData] = useState<LoanApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(
    null
  );
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
      const response = await loanService.getAllLoans({
        page: meta.page,
        limit: meta.limit,
        search: searchValue || undefined,
        status: filters.status || undefined,
        loanType: filters.loanType || undefined,
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

  const handleViewDetail = (loan: LoanApplication) => {
    setSelectedLoan(loan);
    setDetailDialogOpen(true);
  };

  const columns: ColumnDef<LoanApplication>[] = useMemo(
    () => [
      {
        accessorKey: "loanNumber",
        header: "No. Pinjaman",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-mono font-medium text-sm">
              {row.original.loanNumber}
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
              {row.original.user?.employee?.fullName}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.original.user?.employee?.employeeNumber}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "loanType",
        header: "Jenis",
        cell: ({ row }) => (
          <span className="text-sm">{loanTypeMap[row.original.loanType]}</span>
        ),
      },
      {
        accessorKey: "loanAmount",
        header: "Jumlah",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <span className="font-semibold text-primary">
              {formatCurrency(row.original.loanAmount)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "loanTenor",
        header: "Tenor",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.loanTenor} Bulan</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = statusMap[row.original.status];
          const StatusIcon = status?.icon || AlertCircle;
          return (
            <Badge
              variant={status?.variant || "outline"}
              className="flex items-center gap-1 w-fit"
            >
              <StatusIcon className="h-3 w-3" />
              {status?.label || row.original.status}
            </Badge>
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

  const tableConfig: DataTableConfig<LoanApplication> = {
    searchable: true,
    searchPlaceholder: "Cari no. pinjaman atau nama...",
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
          { label: "Draft", value: LoanStatus.DRAFT },
          { label: "Submitted", value: LoanStatus.SUBMITTED },
          { label: "Review DSP", value: LoanStatus.UNDER_REVIEW_DSP },
          { label: "Review Ketua", value: LoanStatus.UNDER_REVIEW_KETUA },
          { label: "Review Pengawas", value: LoanStatus.UNDER_REVIEW_PENGAWAS },
          {
            label: "Menunggu Pencairan",
            value: LoanStatus.APPROVED_PENDING_DISBURSEMENT,
          },
          {
            label: "Menunggu Otorisasi",
            value: LoanStatus.PENDING_AUTHORIZATION,
          },
          { label: "Dicairkan", value: LoanStatus.DISBURSED },
          { label: "Lunas", value: LoanStatus.COMPLETED },
          { label: "Ditolak", value: LoanStatus.REJECTED },
          { label: "Dibatalkan", value: LoanStatus.CANCELLED },
        ],
      },
      {
        id: "loanType",
        label: "Jenis Pinjaman",
        type: "select",
        placeholder: "Semua Jenis",
        options: [
          { label: "Semua Jenis", value: "all" },
          { label: "Pinjaman Tunai", value: LoanType.CASH_LOAN },
          { label: "Reimburse Barang", value: LoanType.GOODS_REIMBURSE },
          { label: "Barang Online", value: LoanType.GOODS_ONLINE },
          { label: "Kredit HP", value: LoanType.GOODS_PHONE },
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Semua Data Pinjaman</CardTitle>
          <CardDescription>
            Menampilkan seluruh data pinjaman anggota koperasi dari semua status
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

      <LoanDetailDialog
        loan={selectedLoan}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onSuccess={fetchData}
      />
    </div>
  );
}
