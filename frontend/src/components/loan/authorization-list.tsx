"use client";

import { useState, useEffect, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Check, CheckCircle2, Copy } from "lucide-react";
import { FaRupiahSign } from "react-icons/fa6";
import { toast } from "sonner";

import { DataTableAdvanced } from "@/components/data-table/data-table-advanced";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProcessAuthorizationDialog } from "@/components/loan/process-authorization-dialog";
import { BulkProcessAuthorizationDialog } from "@/components/loan/bulk-process-authorization-dialog";
import { LoanDetailDialog } from "@/components/loan/loan-detail-dialog";

import { loanService } from "@/services/loan.service";
import { LoanApplication } from "@/types/loan.types";
import { DataTableConfig } from "@/types/data-table.types";
import { getLoanTypeLabel } from "@/lib/loan-utils";

export function AuthorizationList() {
  const [data, setData] = useState<LoanApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(
    null
  );
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [authorizationDialogOpen, setAuthorizationDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedAccountNumber, setCopiedAccountNumber] = useState<string | null>(
    null
  );

  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    fetchData();
  }, [meta.page, meta.limit, searchValue]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await loanService.getPendingAuthorization({
        page: meta.page,
        limit: meta.limit,
        search: searchValue || undefined,
        sortBy: "disbursedAt",
        sortOrder: "asc",
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

  const handleProcessAuthorization = (loan: LoanApplication) => {
    setSelectedLoan(loan);
    setAuthorizationDialogOpen(true);
  };

  const handleCopyAccountNumber = async (accountNumber: string) => {
    if (accountNumber === "-") return;

    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopiedAccountNumber(accountNumber);
      toast.success("Nomor rekening berhasil disalin");

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedAccountNumber(null);
      }, 2000);
    } catch (error) {
      toast.error("Gagal menyalin nomor rekening");
    }
  };

  // Update columns untuk menambahkan loan type
  const columns: ColumnDef<LoanApplication>[] = useMemo(
    () => [
      {
        accessorKey: "loanNumber",
        header: "No. Pinjaman",
        cell: ({ row }) => (
          <span className="font-mono font-medium text-sm">
            {row.original.loanNumber}
          </span>
        ),
      },
      {
        accessorKey: "loanType",
        header: "Jenis",
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs">
            {getLoanTypeLabel(row.original.loanType)}
          </Badge>
        ),
      },
      {
        accessorKey: "user.name",
        header: "Nama",
        cell: ({ row }) => row.original.user?.employee?.fullName || "-",
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
        accessorKey: "bankAccountNumber",
        header: "Rekening",
        cell: ({ row }) => {
          const accountNumber =
            row.original.user?.employee?.bankAccountNumber || "-";
          const isClickable = accountNumber !== "-";
          const isCopied = copiedAccountNumber === accountNumber;

          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={`h-auto p-2 justify-start font-mono ${
                  isClickable
                    ? "hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                    : "cursor-default hover:bg-transparent"
                }`}
                onClick={
                  isClickable
                    ? () => handleCopyAccountNumber(accountNumber)
                    : undefined
                }
                disabled={!isClickable}
              >
                <span className="mr-2">{accountNumber}</span>
                {isClickable &&
                  (isCopied ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  ))}
              </Button>
            </div>
          );
        },
      },
      {
        accessorKey: "approvedAt",
        header: "Tanggal Disetujui",
        cell: ({ row }) => {
          if (!row.original.approvedAt) return "-";
          return (
            <span className="text-sm">
              {format(new Date(row.original.approvedAt), "dd MMM yyyy", {
                locale: id,
              })}
            </span>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDetail(row.original)}
            >
              Detail
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleProcessAuthorization(row.original)}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Proses
            </Button>
          </div>
        ),
      },
    ],
    [copiedAccountNumber]
  );

  const tableConfig: DataTableConfig<LoanApplication> = {
    searchable: true,
    searchPlaceholder: "Cari berdasarkan nama, no. pinjaman...",
    filterable: false,
    selectable: true,
    bulkActions: [
      {
        label: "Otorisasi Massal",
        onClick: (selected) => {
          const ids = selected.map((item) => item.id);
          setSelectedIds(ids);
          setBulkDialogOpen(true);
        },
        icon: CheckCircle2,
        variant: "default",
      },
    ],
  };

  return (
    <div className="space-y-6">
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
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <LoanDetailDialog
        loan={selectedLoan}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onSuccess={fetchData}
        canApprove={false}
      />

      <ProcessAuthorizationDialog
        loan={selectedLoan}
        open={authorizationDialogOpen}
        onOpenChange={setAuthorizationDialogOpen}
        onSuccess={fetchData}
      />

      <BulkProcessAuthorizationDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        selectedIds={selectedIds}
        onSuccess={fetchData}
      />
    </div>
  );
}
