"use client";

import { useState, useEffect, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Eye,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Trash2,
  Play,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { payrollService } from "@/services/payroll.service";
import { PayrollPeriod } from "@/types/payroll.types";
import { DataTableConfig } from "@/types/data-table.types";
import { usePermissions } from "@/hooks/use-permission";
import { PayrollDetailDialog } from "./payroll-detail-dialog";
import { PayrollProcessDialog } from "./payroll-process-dialog";

export function PayrollPeriods() {
  const [data, setData] = useState<PayrollPeriod[]>([]);
  const { hasRole } = usePermissions();
  const [isLoading, setIsLoading] = useState(true);

  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(
    null,
  );
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [periodToDelete, setPeriodToDelete] = useState<PayrollPeriod | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

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

  const canManage = hasRole("ketua") || hasRole("payroll");

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await payrollService.getAllPeriods({
        page: meta.page,
        limit: meta.limit,
        search: searchValue || undefined,
        isProcessed:
          filters.isProcessed === "true"
            ? true
            : filters.isProcessed === "false"
              ? false
              : undefined,
        startDate: dateRange.from
          ? format(dateRange.from, "yyyy-MM-dd")
          : undefined,
        endDate: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
        sortBy: "year",
        sortOrder: "desc",
      });
      setData(response.data);
      setMeta(response.meta);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memuat data payroll");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: string): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const handleViewDetail = (period: PayrollPeriod) => {
    setSelectedPeriod(period);
    setDetailDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!periodToDelete) return;
    setIsDeleting(true);
    try {
      await payrollService.deletePeriod(periodToDelete.id);
      toast.success("Periode payroll berhasil dihapus");
      fetchData();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Gagal menghapus periode payroll",
      );
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setPeriodToDelete(null);
    }
  };

  const handleBulkDelete = async (selectedRows: PayrollPeriod[]) => {
    try {
      const result = await payrollService.bulkDeletePeriods({
        periodIds: selectedRows.map((r) => r.id),
      });
      toast.success(result.message);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menghapus periode");
    }
  };

  const getMonthName = (month: number): string => {
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    return months[month - 1] || "";
  };

  const columns: ColumnDef<PayrollPeriod>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Periode",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-sm">{row.original.name}</span>
            <span className="text-xs text-muted-foreground">
              {getMonthName(row.original.month)} {row.original.year}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "isProcessed",
        header: "Status",
        cell: ({ row }) => {
          const processed = row.original.isProcessed;
          return (
            <Badge
              variant={processed ? "default" : "secondary"}
              className="flex items-center gap-1 w-fit"
            >
              {processed ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              {processed ? "Diproses" : "Pending"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "totalAmount",
        header: "Total",
        cell: ({ row }) => (
          <span className="font-semibold text-primary">
            {formatCurrency(row.original.totalAmount)}
          </span>
        ),
      },
      {
        accessorKey: "transactionCount",
        header: "Transaksi",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.transactionCount} transaksi
          </span>
        ),
      },
      {
        accessorKey: "processedAt",
        header: "Tanggal Proses",
        cell: ({ row }) => {
          if (!row.original.processedAt)
            return <span className="text-muted-foreground">-</span>;
          return (
            <span className="text-sm">
              {format(new Date(row.original.processedAt), "dd MMM yyyy HH:mm", {
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
              {canManage && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => {
                      setPeriodToDelete(row.original);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [canManage],
  );

  const tableConfig: DataTableConfig<PayrollPeriod> = {
    searchable: true,
    searchPlaceholder: "Cari periode payroll...",
    filterable: true,
    dateRangeFilter: true,
    selectable: canManage,
    filterFields: [
      {
        id: "isProcessed",
        label: "Status",
        type: "select",
        placeholder: "Semua Status",
        options: [
          { label: "Semua Status", value: "all" },
          { label: "Sudah Diproses", value: "true" },
          { label: "Pending", value: "false" },
        ],
      },
    ],
    ...(canManage
      ? {
          bulkActions: [
            {
              label: "Hapus Terpilih",
              icon: Trash2,
              variant: "destructive" as const,
              onClick: handleBulkDelete,
            },
          ],
          toolbarActions: [
            {
              label: "Proses Payroll",
              icon: Play,
              onClick: () => setProcessDialogOpen(true),
            },
          ],
        }
      : {}),
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Daftar Periode Payroll</CardTitle>
          <CardDescription>
            Riwayat dan manajemen seluruh periode payroll koperasi
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

      {/* Detail Dialog */}
      <PayrollDetailDialog
        period={selectedPeriod}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      {/* Process Dialog */}
      <PayrollProcessDialog
        open={processDialogOpen}
        onOpenChange={setProcessDialogOpen}
        onSuccess={fetchData}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Periode Payroll</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus periode{" "}
              <strong>{periodToDelete?.name}</strong>? Tindakan ini akan
              menghapus semua transaksi terkait dan tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
