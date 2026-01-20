"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Download,
} from "lucide-react";
import { toast } from "sonner";

import { DataTableAdvanced } from "@/components/data-table/data-table-advanced";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DepositDetailDialog } from "@/components/deposit/deposit-detail-dialog";
import { BulkApproveDepositDialog } from "@/components/deposit/bulk-approve-deposit-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

import { depositService } from "@/services/deposit.service";
import { useAuthStore } from "@/store/auth.store";
import { usePermissions } from "@/hooks/use-permission";
import {
  DepositApplication,
  DepositStatus,
  DepositApprovalStep,
  DepositApprovalDecision,
} from "@/types/deposit.types";
import { DataTableConfig } from "@/types/data-table.types";
import * as XLSX from "xlsx";

const statusMap = {
  [DepositStatus.UNDER_REVIEW_DSP]: {
    label: "Review DSP",
    variant: "secondary" as const,
    icon: Clock,
  },
  [DepositStatus.UNDER_REVIEW_KETUA]: {
    label: "Review Ketua",
    variant: "secondary" as const,
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

const stepMap = {
  [DepositApprovalStep.DIVISI_SIMPAN_PINJAM]: "Divisi Simpan Pinjam",
  [DepositApprovalStep.KETUA]: "Ketua",
};

interface DepositListProps {
  defaultStatus?: DepositStatus;
  defaultStep?: DepositApprovalStep;
}

export function DepositList({ defaultStatus, defaultStep }: DepositListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { hasRole } = usePermissions();

  const [data, setData] = useState<DepositApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDeposit, setSelectedDeposit] =
    useState<DepositApplication | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const getDefaultStepFilter = () => {
    if (hasRole("ketua")) return DepositApprovalStep.KETUA;
    if (hasRole("divisi_simpan_pinjam"))
      return DepositApprovalStep.DIVISI_SIMPAN_PINJAM;
    return undefined;
  };

  const getDefaultStatusFilter = () => {
    if (hasRole("ketua")) return DepositStatus.UNDER_REVIEW_KETUA;
    if (hasRole("divisi_simpan_pinjam"))
      return DepositStatus.UNDER_REVIEW_DSP;
    return undefined;
  };

  const [filters, setFilters] = useState<Record<string, any>>({});
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const statusParam = searchParams.get("status");
    const stepParam = searchParams.get("step");

    const initialFilters: Record<string, any> = {};

    if (statusParam) {
      initialFilters.status = statusParam;
    } else {
      const defaultStatus = getDefaultStatusFilter();
      if (defaultStatus) initialFilters.status = defaultStatus;
    }

    if (stepParam) {
      initialFilters.step = stepParam;
    } else {
      const defaultStep = getDefaultStepFilter();
      if (defaultStep) initialFilters.step = defaultStep;
    }

    setFilters(initialFilters);
    setIsInitialized(true);
  }, []);

  const canApprove = hasRole("ketua") || hasRole("divisi_simpan_pinjam");

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const params: any = {
        page: meta.page,
        limit: meta.limit,
        search: searchValue || undefined,
        status: filters.status || undefined,
        step: filters.step || undefined,
        sortBy: "submittedAt",
        sortOrder: "desc",
      };

      if (dateRange.from) {
        params.startDate = format(dateRange.from, "yyyy-MM-dd");
      }
      if (dateRange.to) {
        params.endDate = format(dateRange.to, "yyyy-MM-dd");
      }

      const response = await depositService.getAllDeposits(params);
      setData(response.data);
      setMeta(response.meta);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized) {
      fetchData();
    }
  }, [meta.page, meta.limit, searchValue, filters, dateRange, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;

    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.step) params.set("step", filters.step);

    const newUrl = params.toString() ? `?${params.toString()}` : "";
    router.replace(newUrl, { scroll: false });
  }, [filters, router, isInitialized]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleViewDetail = async (deposit: DepositApplication) => {
    try {
      // Fetch full detail with calculation breakdown
      const fullDeposit = await depositService.getDepositById(deposit.id);
      setSelectedDeposit(fullDeposit);
      setDetailDialogOpen(true);
    } catch (error) {
      // Fallback to basic deposit if fetch fails
      setSelectedDeposit(deposit);
      setDetailDialogOpen(true);
    }
  };

  const handleBulkAction = async (
    decision: DepositApprovalDecision,
    notes?: string
  ) => {
    try {
      const result = await depositService.bulkProcessApproval({
        depositIds: selectedIds,
        decision,
        notes,
      });

      toast.success(result.message);

      if (result.results.failed.length > 0) {
        toast.warning(
          `${result.results.failed.length} deposito gagal diproses`
        );
      }

      setSelectedIds([]);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memproses deposito");
      throw error;
    }
  };

  const handleFiltersChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setMeta((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    const defaultFilters: Record<string, any> = {};

    const defaultStatus = getDefaultStatusFilter();
    if (defaultStatus) defaultFilters.status = defaultStatus;

    const defaultStep = getDefaultStepFilter();
    if (defaultStep) defaultFilters.step = defaultStep;

    setFilters(defaultFilters);
    setSearchValue("");
    setDateRange({});
    setMeta((prev) => ({ ...prev, page: 1 }));
  };

  const handleExport = () => {
    try {
      const exportData = data.map((deposit) => ({
        "Nomor Deposito": deposit.depositNumber,
        Nama: deposit.user?.name || "-",
        "No. Karyawan": deposit.user?.employee.employeeNumber || "-",
        Department: deposit.user?.employee.department?.departmentName || "-",
        "Jumlah Deposito": deposit.amountValue,
        "Jangka Waktu (Bulan)": deposit.tenorMonths,
        "Bunga (%)": deposit.interestRate || 0,
        Status: statusMap[deposit.status]?.label || deposit.status,
        "Step Saat Ini": deposit.currentStep
          ? stepMap[deposit.currentStep]
          : "-",
        "Tanggal Submit": deposit.submittedAt
          ? format(new Date(deposit.submittedAt), "dd/MM/yyyy HH:mm", {
              locale: id,
            })
          : "-",
        "Tanggal Jatuh Tempo": deposit.maturityDate
          ? format(new Date(deposit.maturityDate), "dd/MM/yyyy", { locale: id })
          : "-",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Deposito");

      const fileName = `deposito_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success("Data berhasil diekspor");
    } catch (error) {
      toast.error("Gagal mengekspor data");
    }
  };

  const columns: ColumnDef<DepositApplication>[] = useMemo(
    () => [
      {
        accessorKey: "depositNumber",
        header: "No. Deposito",
        cell: ({ row }) => (
          <span className="font-mono font-medium text-sm">
            {row.original.depositNumber}
          </span>
        ),
      },
      {
        accessorKey: "user.employee.employeeNumber",
        header: "No. Karyawan",
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.user?.employee.employeeNumber}
          </span>
        ),
      },
      {
        accessorKey: "user.name",
        header: "Nama",
        cell: ({ row }) => row.original.user?.employee.fullName || "-",
      },
      {
        accessorKey: "user.department.departmentName",
        header: "Department",
        cell: ({ row }) =>
          row.original.user?.employee.department?.departmentName || "-",
      },
      {
        accessorKey: "amountValue",
        header: "Jumlah Deposito",
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
        accessorKey: "currentStep",
        header: "Step",
        cell: ({ row }) => {
          if (!row.original.currentStep) return "-";
          return (
            <Badge variant="outline" className="text-xs">
              {stepMap[row.original.currentStep]}
            </Badge>
          );
        },
      },
      {
        accessorKey: "submittedAt",
        header: "Tanggal Submit",
        cell: ({ row }) => {
          if (!row.original.submittedAt) return "-";
          return (
            <span className="text-sm">
              {format(new Date(row.original.submittedAt), "dd MMM yyyy", {
                locale: id,
              })}
            </span>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetail(row.original)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Detail
          </Button>
        ),
      },
    ],
    []
  );

  const tableConfig: DataTableConfig<DepositApplication> = {
    searchable: true,
    searchPlaceholder: "Cari berdasarkan nama, email, no. deposito...",
    filterable: true,
    selectable: canApprove,
    filterFields: [
      {
        id: "status",
        label: "Status",
        type: "select",
        placeholder: "Semua Status",
        options: [
          { label: "Semua Status", value: "all" },
          { label: "Review DSP", value: DepositStatus.UNDER_REVIEW_DSP },
          { label: "Review Ketua", value: DepositStatus.UNDER_REVIEW_KETUA },
          { label: "Disetujui", value: DepositStatus.APPROVED },
          { label: "Aktif", value: DepositStatus.ACTIVE },
          { label: "Selesai", value: DepositStatus.COMPLETED },
          { label: "Ditolak", value: DepositStatus.REJECTED },
        ],
      },
      {
        id: "step",
        label: "Step Approval",
        type: "select",
        placeholder: "Semua Step",
        options: [
          { label: "Semua Step", value: "all" },
          {
            label: "Divisi Simpan Pinjam",
            value: DepositApprovalStep.DIVISI_SIMPAN_PINJAM,
          },
          { label: "Ketua", value: DepositApprovalStep.KETUA },
        ],
      },
    ],
    toolbarActions: [
      {
        label: "Export",
        icon: Download,
        onClick: handleExport,
        variant: "outline",
      },
    ],
    bulkActions: canApprove
      ? [
          {
            label: "Proses Massal",
            onClick: (selected) => {
              const ids = selected.map((item) => item.id);
              setSelectedIds(ids);
              setBulkDialogOpen(true);
            },
            icon: CheckCircle2,
            variant: "default",
          },
        ]
      : undefined,
  };

  return (
    <div className="space-y-6">
      {/* Date Range Picker */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter Tanggal:</span>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.from
                      ? format(dateRange.from, "dd MMM yyyy", { locale: id })
                      : "Tanggal Mulai"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) =>
                      setDateRange((prev) => ({ ...prev, from: date }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <span className="text-muted-foreground">-</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.to
                      ? format(dateRange.to, "dd MMM yyyy", { locale: id })
                      : "Tanggal Akhir"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) =>
                      setDateRange((prev) => ({ ...prev, to: date }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {(dateRange.from || dateRange.to) && (
                <Button
                  variant="ghost"
                  onClick={() => setDateRange({})}
                  size="sm"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
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
            onFiltersChange={handleFiltersChange}
            onResetFilters={handleResetFilters}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <DepositDetailDialog
        deposit={selectedDeposit}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onSuccess={fetchData}
        canApprove={
          canApprove &&
          selectedDeposit?.status !== DepositStatus.APPROVED &&
          selectedDeposit?.status !== DepositStatus.REJECTED &&
          selectedDeposit?.currentStep !== null
        }
      />

      <BulkApproveDepositDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        selectedCount={selectedIds.length}
        onConfirm={handleBulkAction}
      />
    </div>
  );
}
