"use client";

import { useState, useEffect, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Eye, Shield } from "lucide-react";
import { toast } from "sonner";

import { DataTableAdvanced } from "@/components/data-table/data-table-advanced";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

const formatIDR = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

export function RepaymentList() {
  const { user } = useAuthStore();
  const [data, setData] = useState<LoanRepayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRepayment, setSelectedRepayment] =
    useState<LoanRepayment | null>(null);
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

  useEffect(() => {
    fetchData();
  }, [meta.page, meta.limit, searchValue, filters]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await loanRepaymentService.getAllRepayments({
        page: meta.page,
        limit: meta.limit,
        search: searchValue || undefined,
        status: filters.status || undefined,
        step: filters.step || undefined,
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

  const handleViewDetail = async (repayment: LoanRepayment) => {
    if (!repayment.loanApplication) {
      try {
        const fullDetail = await loanRepaymentService.getRepaymentById(
          repayment.id
        );
        setSelectedRepayment(fullDetail);
      } catch (error) {
        toast.error("Gagal memuat detail pelunasan");
        return;
      }
    } else {
      setSelectedRepayment(repayment);
    }
    setDetailDialogOpen(true);
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
              {row.original.loanApplication?.user?.name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "loanApplication.loanNumber",
        header: "No. Pinjaman",
        cell: ({ row }) => (
          <span className="text-sm font-mono text-muted-foreground">
            {row.original.loanApplication?.loanNumber}
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
    toolbarActions: [],
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengajuan Pelunasan</CardTitle>
          <CardDescription>
            Kelola dan proses approval pelunasan pinjaman anggota
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
            onResetFilters={() => setFilters({})}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <RepaymentDetailDialog
        repayment={selectedRepayment}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        isApprover={true}
        currentUserRoles={user?.roles}
        onSuccess={fetchData}
      />
    </div>
  );
}
