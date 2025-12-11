"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Eye, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

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
import { TransactionDetailDialog } from "@/components/buku-tabungan/transaction-detail-dialog";

import { bukuTabunganService } from "@/services/buku-tabungan.service";
import {
    SavingsTransaction,
    QueryTransactionParams,
} from "@/types/buku-tabungan.types";
import { PaginationMeta } from "@/types/pagination.types";
import { DataTableConfig } from "@/types/data-table.types";
import { formatCurrency, toNumber } from "@/lib/format";

const MONTHS = [
    { label: "Semua Bulan", value: "all" },
    { label: "Januari", value: "1" },
    { label: "Februari", value: "2" },
    { label: "Maret", value: "3" },
    { label: "April", value: "4" },
    { label: "Mei", value: "5" },
    { label: "Juni", value: "6" },
    { label: "Juli", value: "7" },
    { label: "Agustus", value: "8" },
    { label: "September", value: "9" },
    { label: "Oktober", value: "10" },
    { label: "November", value: "11" },
    { label: "Desember", value: "12" },
];

const currentYear = new Date().getFullYear();
const YEARS = [
    { label: "Semua Tahun", value: "all" },
    ...Array.from({ length: 6 }, (_, i) => ({
        label: String(currentYear - i),
        value: String(currentYear - i),
    })),
];

const defaultMeta: PaginationMeta = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
};

interface UserTransactionListProps {
    userId: string;
}

export function UserTransactionList({ userId }: UserTransactionListProps) {
    const [selectedTransaction, setSelectedTransaction] =
        useState<SavingsTransaction | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);

    const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
    const [meta, setMeta] = useState<PaginationMeta>(defaultMeta);
    const [isLoading, setIsLoading] = useState(true);
    const [params, setParams] = useState<QueryTransactionParams>({
        page: 1,
        limit: 10,
        sortBy: "transactionDate",
        sortOrder: "desc",
    });

    const fetchTransactions = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await bukuTabunganService.getTransactionsByUserId(
                userId,
                params
            );
            setTransactions(response.data);
            setMeta(response.meta);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const message =
                    err.response?.data?.message || "Gagal memuat transaksi";
                toast.error(message);
            }
            setTransactions([]);
            setMeta(defaultMeta);
        } finally {
            setIsLoading(false);
        }
    }, [userId, params]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleViewDetail = (transaction: SavingsTransaction) => {
        setSelectedTransaction(transaction);
        setDetailDialogOpen(true);
    };

    const handleFiltersChange = (newFilters: Record<string, unknown>) => {
        const queryFilters: QueryTransactionParams = { ...params, page: 1 };

        if (newFilters.month && newFilters.month !== "all") {
            queryFilters.month = parseInt(newFilters.month as string);
        } else {
            delete queryFilters.month;
        }
        if (newFilters.year && newFilters.year !== "all") {
            queryFilters.year = parseInt(newFilters.year as string);
        } else {
            delete queryFilters.year;
        }

        setParams(queryFilters);
    };

    const handleResetFilters = () => {
        setParams({
            page: 1,
            limit: 10,
            sortBy: "transactionDate",
            sortOrder: "desc",
        });
    };

    const handleExport = async () => {
        try {
            const { default: XLSX } = await import("xlsx");

            const exportData = transactions.map((tx) => ({
                Tanggal: format(new Date(tx.transactionDate), "dd/MM/yyyy", {
                    locale: id,
                }),
                Periode: tx.payrollPeriod?.name || "-",
                "Iuran Pendaftaran": toNumber(tx.iuranPendaftaran),
                "Iuran Bulanan": toNumber(tx.iuranBulanan),
                "Tabungan Deposito": toNumber(tx.tabunganDeposito),
                SHU: toNumber(tx.shu),
                Bunga: toNumber(tx.bunga),
                Penarikan: toNumber(tx.penarikan),
                Keterangan: tx.description || "-",
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Transaksi");

            const fileName = `transaksi_${userId}_${format(
                new Date(),
                "yyyyMMdd_HHmmss"
            )}.xlsx`;
            XLSX.writeFile(wb, fileName);

            toast.success("Data berhasil diekspor");
        } catch {
            toast.error("Gagal mengekspor data");
        }
    };

    const columns: ColumnDef<SavingsTransaction>[] = useMemo(
        () => [
            {
                accessorKey: "transactionDate",
                header: "Tanggal",
                cell: ({ row }) => (
                    <span className="text-sm font-medium">
                        {format(new Date(row.original.transactionDate), "dd MMM yyyy", {
                            locale: id,
                        })}
                    </span>
                ),
            },
            {
                accessorKey: "payrollPeriod",
                header: "Periode",
                cell: ({ row }) => {
                    const period = row.original.payrollPeriod;
                    if (!period) return "-";
                    return (
                        <Badge variant="outline" className="text-xs">
                            {period.name || `${period.month}/${period.year}`}
                        </Badge>
                    );
                },
            },
            {
                accessorKey: "iuranBulanan",
                header: "Iuran Bulanan",
                cell: ({ row }) => {
                    const value = toNumber(row.original.iuranBulanan);
                    if (value === 0) return "-";
                    return (
                        <span className="text-green-600 font-medium">
                            +{formatCurrency(value)}
                        </span>
                    );
                },
            },
            {
                accessorKey: "tabunganDeposito",
                header: "Deposito",
                cell: ({ row }) => {
                    const value = toNumber(row.original.tabunganDeposito);
                    if (value === 0) return "-";
                    return (
                        <span className="text-green-600 font-medium">
                            +{formatCurrency(value)}
                        </span>
                    );
                },
            },
            {
                accessorKey: "penarikan",
                header: "Penarikan",
                cell: ({ row }) => {
                    const value = toNumber(row.original.penarikan);
                    if (value === 0) return "-";
                    return (
                        <span className="text-red-600 font-medium">
                            -{formatCurrency(value)}
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
                        <Eye className="h-4 w-4 mr-1" />
                        Detail
                    </Button>
                ),
            },
        ],
        []
    );

    const tableConfig: DataTableConfig<SavingsTransaction> = {
        searchable: false,
        filterable: true,
        selectable: false,
        filterFields: [
            {
                id: "month",
                label: "Bulan",
                type: "select",
                placeholder: "Pilih Bulan",
                options: MONTHS,
            },
            {
                id: "year",
                label: "Tahun",
                type: "select",
                placeholder: "Pilih Tahun",
                options: YEARS,
            },
        ],
        toolbarActions: [
            {
                label: "Export",
                icon: Download,
                onClick: handleExport,
                variant: "outline",
                disabled: transactions.length === 0,
            },
        ],
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Riwayat Transaksi</CardTitle>
                    <CardDescription>
                        Daftar semua transaksi tabungan anggota
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTableAdvanced
                        columns={columns}
                        data={transactions}
                        meta={meta}
                        config={tableConfig}
                        onPageChange={(page) => setParams((prev) => ({ ...prev, page }))}
                        onPageSizeChange={(limit) =>
                            setParams((prev) => ({ ...prev, limit, page: 1 }))
                        }
                        onFiltersChange={handleFiltersChange}
                        onResetFilters={handleResetFilters}
                        isLoading={isLoading}
                    />
                </CardContent>
            </Card>

            <TransactionDetailDialog
                transaction={selectedTransaction}
                open={detailDialogOpen}
                onOpenChange={setDetailDialogOpen}
            />
        </>
    );
}
