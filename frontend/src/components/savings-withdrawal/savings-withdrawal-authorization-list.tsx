"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  User,
  Check,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

import { DataTableAdvanced } from "@/components/data-table/data-table-advanced";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SavingsWithdrawalAuthorizationDialog } from "./savings-withdrawal-authorization-dialog";
import { SavingsWithdrawalDetailDialog } from "./savings-withdrawal-detail-dialog";

import { savingsWithdrawalService } from "@/services/savings-withdrawal.service";
import { usePermissions } from "@/hooks/use-permission";
import {
  SavingsWithdrawal,
  SavingsWithdrawalStatus,
} from "@/types/savings-withdrawal.types";
import { DataTableConfig } from "@/types/data-table.types";
import { formatCurrency } from "@/lib/format";

export function SavingsWithdrawalAuthorizationList() {
  const { hasRole } = usePermissions();

  const [data, setData] = useState<SavingsWithdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<SavingsWithdrawal | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedAccountNumber, setCopiedAccountNumber] = useState<string | null>(
    null
  );

  const [singleActionId, setSingleActionId] = useState<string | null>(null);

  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [searchValue, setSearchValue] = useState("");

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await savingsWithdrawalService.getAllWithdrawals({
        page: meta.page,
        limit: meta.limit,
        search: searchValue || undefined,
        status: SavingsWithdrawalStatus.DISBURSEMENT_IN_PROGRESS,
        sortBy: "submittedAt",
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

  useEffect(() => {
    fetchData();
  }, [meta.page, meta.limit, searchValue]);

  const handleBulkAuthorization = async (
    authorizationDate: Date | undefined,
    authorizationTime: string,
    notes: string
  ) => {
    try {
      const idsToProcess = singleActionId ? [singleActionId] : selectedIds;

      const result = await savingsWithdrawalService.bulkConfirmAuthorization({
        withdrawalIds: idsToProcess,
        authorizationDate: authorizationDate
          ? format(authorizationDate, "yyyy-MM-dd")
          : undefined,
        authorizationTime,
        notes,
      });

      toast.success(result.message);

      if (result.results && result.results.failed.length > 0) {
        toast.warning(
          `${result.results.failed.length} otorisasi gagal diproses`
        );
      }

      setSelectedIds([]);
      setSingleActionId(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memproses otorisasi");
      throw error;
    }
  };

  const openAuthDialog = (ids: string[]) => {
    setSelectedIds(ids);
    setSingleActionId(null);
    setAuthDialogOpen(true);
  };

  const openSingleAuthDialog = (id: string) => {
    setSingleActionId(id);
    setSelectedIds([]);
    setAuthDialogOpen(true);
  };

  const handleViewDetail = async (withdrawal: SavingsWithdrawal) => {
    try {
      const fullWithdrawal = await savingsWithdrawalService.getWithdrawalById(
        withdrawal.id
      );
      setSelectedWithdrawal(fullWithdrawal);
      setDetailDialogOpen(true);
    } catch (error) {
      setSelectedWithdrawal(withdrawal);
      setDetailDialogOpen(true);
    }
  };

  const handleCopyAccountNumber = async (
    accountNumber: string,
    withdrawalId: string
  ) => {
    if (accountNumber === "-") return;

    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopiedAccountNumber(withdrawalId);
      toast.success("Nomor rekening berhasil disalin");

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedAccountNumber(null);
      }, 2000);
    } catch (error) {
      toast.error("Gagal menyalin nomor rekening");
    }
  };

  const columns: ColumnDef<SavingsWithdrawal>[] = useMemo(
    () => [
      {
        accessorKey: "withdrawalNumber",
        header: "No. Penarikan",
        cell: ({ row }) => (
          <span className="font-mono font-medium text-sm">
            {row.original.withdrawalNumber}
          </span>
        ),
      },
      {
        accessorKey: "user.name",
        header: "Nama",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">
              {row.original.user?.employee?.fullName}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.original.user?.employee?.employeeNumber}
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
          const isCopied = copiedAccountNumber === row.original.id;

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
                    ? () =>
                        handleCopyAccountNumber(accountNumber, row.original.id)
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
        accessorKey: "withdrawalAmount",
        header: "Jumlah Pinjaman",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-semibold text-lg">
              {formatCurrency(row.original.withdrawalAmount)}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "penaltyAmount",
        header: "Jumlah Penalti",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-semibold text-red-600 text-lg">
              {row.original.penaltyAmount
                ? formatCurrency(row.original.penaltyAmount)
                : "-"}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "netAmount",
        header: "Jumlah Transfer",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-bold text-green-700 text-lg">
              {formatCurrency(row.original.netAmount)}
            </div>
          </div>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
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
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => openSingleAuthDialog(row.original.id)}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Otorisasi
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const tableConfig: DataTableConfig<SavingsWithdrawal> = {
    searchable: true,
    searchPlaceholder: "Cari nama atau nomor...",
    selectable: true,
    bulkActions: [
      {
        label: "Otorisasi Massal",
        onClick: (selected) => {
          const ids = selected.map((item) => item.id);
          openAuthDialog(ids);
        },
        icon: ShieldCheck,
        variant: "default",
      },
    ],
  };

  return (
    <>
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

      <SavingsWithdrawalDetailDialog
        withdrawal={selectedWithdrawal}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onSuccess={fetchData}
        canApprove={false}
      />

      <SavingsWithdrawalAuthorizationDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        selectedCount={singleActionId ? 1 : selectedIds.length}
        withdrawal={
          singleActionId
            ? data.find((item) => item.id === singleActionId)
            : null
        }
        onConfirm={handleBulkAuthorization}
      />
    </>
  );
}
