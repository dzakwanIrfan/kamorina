"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Eye, Shield, Download, Calendar } from "lucide-react";
import { toast } from "sonner";

import { DataTableAdvanced } from "@/components/data-table/data-table-advanced";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

import { loanRepaymentService } from "@/services/loan-repayment.service";
import {
  LoanRepayment,
  RepaymentStatus,
  RepaymentApprovalStep,
} from "@/types/loan-repayment.types";
import { DataTableConfig } from "@/types/data-table.types";
import { RepaymentStatusBadge } from "./repayment-status-badge";
import { RepaymentDetailDialog } from "./repayment-detail-dialog";
import { useAuthStore } from "@/store/auth.store";
import { usePermissions } from "@/hooks/use-permission";
import * as XLSX from "xlsx";

const formatIDR = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const stepMap = {
  [RepaymentApprovalStep.DIVISI_SIMPAN_PINJAM]: "Divisi Simpan Pinjam",
  [RepaymentApprovalStep.KETUA]: "Ketua",
};

interface RepaymentListProps {
  defaultStatus?: RepaymentStatus;
  defaultStep?: RepaymentApprovalStep;
}

export function RepaymentList({
  defaultStatus,
  defaultStep,
}: RepaymentListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { hasRole } = usePermissions();

  const [data, setData] = useState<LoanRepayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRepayment, setSelectedRepayment] =
    useState<LoanRepayment | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Date range state
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

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

  // Get default filter based on user role
  const getDefaultStepFilter = () => {
    if (defaultStep) return defaultStep;
    if (hasRole("ketua")) return RepaymentApprovalStep.KETUA;
    if (hasRole("divisi_simpan_pinjam"))
      return RepaymentApprovalStep.DIVISI_SIMPAN_PINJAM;
    return undefined;
  };

  const getDefaultStatusFilter = () => {
    if (defaultStatus) return defaultStatus;
    if (hasRole("ketua")) return RepaymentStatus.UNDER_REVIEW_KETUA;
    if (hasRole("divisi_simpan_pinjam"))
      return RepaymentStatus.UNDER_REVIEW_DSP;
    return undefined;
  };

  // Initialize filters on mount
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

  // Check if user can approve
  const canApprove = hasRole("ketua") || hasRole("divisi_simpan_pinjam");

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

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const params: any = {
        page: meta.page,
        limit: meta.limit,
        search: searchValue || undefined,
        status: filters.status || undefined,
        step: filters.step || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      if (dateRange.from) {
        params.startDate = format(dateRange.from, "yyyy-MM-dd");
      }
      if (dateRange.to) {
        params.endDate = format(dateRange.to, "yyyy-MM-dd");
      }

      const response = await loanRepaymentService.getAllRepayments(params);
      setData(response.data);
      setMeta(response.meta);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetail = async (repayment: LoanRepayment) => {
    try {
      const fullDetail = await loanRepaymentService.getRepaymentById(
        repayment.id
      );
      setSelectedRepayment(fullDetail);
    } catch (error) {
      toast.error("Gagal memuat detail pelunasan");
      return;
    }
    setDetailDialogOpen(true);
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
      const exportData = data.map((repayment) => ({
        "Nomor Pelunasan": repayment.repaymentNumber,
        "Nomor Pinjaman": repayment.loanApplication?.loanNumber || "-",
        "Nama Peminjam":
          repayment.loanApplication?.user?.employee?.fullName || "-",
        "No. Karyawan":
          repayment.loanApplication?.user?.employee?.employeeNumber || "-",
        Department:
          repayment.loanApplication?.user?.employee?.department
            ?.departmentName || "-",
        "Total Pelunasan": repayment.totalAmount,
        Status:
          repayment.status === RepaymentStatus.UNDER_REVIEW_DSP
            ? "Review DSP"
            : repayment.status === RepaymentStatus.UNDER_REVIEW_KETUA
            ? "Review Ketua"
            : repayment.status === RepaymentStatus.APPROVED
            ? "Disetujui"
            : repayment.status === RepaymentStatus.REJECTED
            ? "Ditolak"
            : repayment.status,
        "Step Saat Ini": repayment.currentStep
          ? stepMap[repayment.currentStep]
          : "-",
        "Tanggal Pengajuan": repayment.submittedAt
          ? format(new Date(repayment.submittedAt), "dd/MM/yyyy HH:mm", {
              locale: id,
            })
          : "-",
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Pelunasan");

      const fileName = `pelunasan_${format(
        new Date(),
        "yyyyMMdd_HHmmss"
      )}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success("Data berhasil diekspor");
    } catch (error) {
      toast.error("Gagal mengekspor data");
    }
  };

  const columns: ColumnDef<LoanRepayment>[] = useMemo(
    () => [
      {
        accessorKey: "repaymentNumber",
        header: "No. Pelunasan",
        cell: ({ row }) => (
          <span className="font-mono font-medium text-sm">
            {row.original.repaymentNumber}
          </span>
        ),
      },
      {
        accessorKey: "loanApplication.user.employee.employeeNumber",
        header: "No. Karyawan",
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.loanApplication?.user?.employee?.employeeNumber ||
              "-"}
          </span>
        ),
      },
      {
        accessorKey: "loanApplication.user.name",
        header: "Nama Peminjam",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={row.original.loanApplication?.user?.avatar} />
              <AvatarFallback className="text-[10px]">
                {row.original.loanApplication?.user?.name
                  ?.slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">
              {row.original.loanApplication?.user?.employee?.fullName ||
                row.original.loanApplication?.user?.name ||
                "-"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "loanApplication.user.employee.department.departmentName",
        header: "Department",
        cell: ({ row }) =>
          row.original.loanApplication?.user?.employee?.department
            ?.departmentName || "-",
      },
      {
        accessorKey: "loanApplication.loanNumber",
        header: "No. Pinjaman",
        cell: ({ row }) => (
          <span className="text-sm font-mono text-muted-foreground">
            {row.original.loanApplication?.loanNumber || "-"}
          </span>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: "Total Pelunasan",
        cell: ({ row }) => (
          <span className="font-semibold text-primary">
            {formatIDR(row.original.totalAmount)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <RepaymentStatusBadge status={row.original.status} />
        ),
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
        accessorKey: "createdAt",
        header: "Diajukan Pada",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {format(new Date(row.original.createdAt), "dd MMM yyyy, HH:mm", {
              locale: id,
            })}
          </span>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetail(row.original)}
          >
            {row.original.status.startsWith("UNDER_REVIEW") ? (
              <>
                {" "}
                <Shield className="h-4 w-4 mr-2" /> Proses{" "}
              </>
            ) : (
              <>
                {" "}
                <Eye className="h-4 w-4 mr-2" /> Detail{" "}
              </>
            )}
          </Button>
        ),
      },
    ],
    []
  );

  const tableConfig: DataTableConfig<LoanRepayment> = {
    searchable: true,
    searchPlaceholder: "Cari nomor, nama...",
    filterable: true,
    selectable: false,
    filterFields: [
      {
        id: "status",
        label: "Status",
        type: "select",
        placeholder: "Semua Status",
        options: [
          { label: "Semua Status", value: "all" },
          { label: "Review DSP", value: RepaymentStatus.UNDER_REVIEW_DSP },
          { label: "Review Ketua", value: RepaymentStatus.UNDER_REVIEW_KETUA },
          { label: "Disetujui", value: RepaymentStatus.APPROVED },
          { label: "Ditolak", value: RepaymentStatus.REJECTED },
        ],
      },
      {
        id: "step",
        label: "Posisi Approval",
        type: "select",
        placeholder: "Semua Posisi",
        options: [
          { label: "Semua Posisi", value: "all" },
          {
            label: "Divisi Simpan Pinjam",
            value: RepaymentApprovalStep.DIVISI_SIMPAN_PINJAM,
          },
          { label: "Ketua", value: RepaymentApprovalStep.KETUA },
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

      <RepaymentDetailDialog
        repayment={selectedRepayment}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        isApprover={canApprove}
        currentUserRoles={user?.roles}
        onSuccess={fetchData}
      />
    </div>
  );
}
