'use client';

import { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Eye, CheckCircle2, XCircle, Clock, Plus, Ban, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { DataTableAdvanced } from '@/components/data-table/data-table-advanced';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { savingsWithdrawalService } from '@/services/savings-withdrawal.service';
import {
    SavingsWithdrawal,
    SavingsWithdrawalStatus
} from '@/types/savings-withdrawal.types';
import { DataTableConfig } from '@/types/data-table.types';
import { formatCurrency } from '@/lib/format';
import { useBukuTabungan } from '@/hooks/use-buku-tabungan';
import { SavingsWithdrawalDetailDialog } from './savings-withdrawal-detail-dialog';

const statusMap = {
    [SavingsWithdrawalStatus.SUBMITTED]: {
        label: 'Submitted',
        variant: 'default' as const,
        icon: Clock
    },
    [SavingsWithdrawalStatus.UNDER_REVIEW_DSP]: {
        label: 'Review DSP',
        variant: 'default' as const,
        icon: Clock
    },
    [SavingsWithdrawalStatus.UNDER_REVIEW_KETUA]: {
        label: 'Review Ketua',
        variant: 'default' as const,
        icon: Clock
    },
    [SavingsWithdrawalStatus.APPROVED_WAITING_DISBURSEMENT]: {
        label: 'Menunggu Pencairan',
        variant: 'default' as const,
        icon: Clock
    },
    [SavingsWithdrawalStatus.DISBURSEMENT_IN_PROGRESS]: {
        label: 'Proses Pencairan',
        variant: 'default' as const,
        icon: Clock
    },
    [SavingsWithdrawalStatus.COMPLETED]: {
        label: 'Selesai',
        variant: 'default' as const,
        icon: CheckCircle2
    },
    [SavingsWithdrawalStatus.REJECTED]: {
        label: 'Ditolak',
        variant: 'destructive' as const,
        icon: XCircle
    },
    [SavingsWithdrawalStatus.CANCELLED]: {
        label: 'Dibatalkan',
        variant: 'destructive' as const,
        icon: Ban
    },
};

export function MySavingsWithdrawals() {
    const router = useRouter();
    const [data, setData] = useState<SavingsWithdrawal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<SavingsWithdrawal | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [withdrawalToCancel, setWithdrawalToCancel] = useState<string | null>(null);
    const { tabungan } = useBukuTabungan({ includeTransactionSummary: true });

    const [meta, setMeta] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
    });

    const [searchValue, setSearchValue] = useState('');
    const [filters, setFilters] = useState<Record<string, any>>({});

    useEffect(() => {
        fetchData();
    }, [meta.page, meta.limit, searchValue, filters]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const response = await savingsWithdrawalService.getMyWithdrawals({
                page: meta.page,
                limit: meta.limit,
                search: searchValue || undefined,
                status: filters.status || undefined,
                sortBy: 'createdAt',
                sortOrder: 'desc',
            });
            setData(response.data);
            setMeta(response.meta);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal memuat data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewDetail = async (withdrawal: SavingsWithdrawal) => {
        try {
            const fullWithdrawal = await savingsWithdrawalService.getWithdrawalById(withdrawal.id);
            setSelectedWithdrawal(fullWithdrawal);
            setDetailDialogOpen(true);
        } catch (error) {
            setSelectedWithdrawal(withdrawal);
            setDetailDialogOpen(true);
        }
    };

    const handleCreateNew = () => {
        router.push('/dashboard/savings-withdrawals/create');
    };

    const handleCancelClick = (withdrawalId: string) => {
        setWithdrawalToCancel(withdrawalId);
        setCancelDialogOpen(true);
    };

    const handleCancelConfirm = async () => {
        if (!withdrawalToCancel) return;

        try {
            await savingsWithdrawalService.cancelWithdrawal(withdrawalToCancel);
            toast.success('Penarikan berhasil dibatalkan');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal membatalkan penarikan');
        } finally {
            setCancelDialogOpen(false);
            setWithdrawalToCancel(null);
        }
    };

    const canCancel = (status: SavingsWithdrawalStatus) => {
        return [
            SavingsWithdrawalStatus.SUBMITTED,
            SavingsWithdrawalStatus.UNDER_REVIEW_DSP,
            SavingsWithdrawalStatus.UNDER_REVIEW_KETUA,
        ].includes(status);
    };

    const columns: ColumnDef<SavingsWithdrawal>[] = useMemo(
        () => [
            {
                accessorKey: 'withdrawalNumber',
                header: 'No. Penarikan',
                cell: ({ row }) => (
                    <span className="font-mono font-medium text-sm">
                        {row.original.withdrawalNumber}
                    </span>
                ),
            },
            {
                accessorKey: 'withdrawalAmount',
                header: 'Jumlah Penarikan',
                cell: ({ row }) => (
                    <span className="font-semibold">
                        {formatCurrency(row.original.withdrawalAmount)}
                    </span>
                ),
            },
            {
                accessorKey: 'netAmount',
                header: 'Diterima',
                cell: ({ row }) => (
                    <div className="space-y-1">
                        <div className="font-semibold text-green-600">
                            {formatCurrency(row.original.netAmount)}
                        </div>
                        {row.original.hasEarlyDepositPenalty && (
                            <div className="flex items-center gap-1 text-xs text-orange-600">
                                <AlertTriangle className="h-3 w-3" />
                                Pinalti: -{formatCurrency(row.original.penaltyAmount)}
                            </div>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ row }) => {
                    const status = statusMap[row.original.status];
                    const StatusIcon = status.icon;
                    return (
                        <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                        </Badge>
                    );
                },
            },
            {
                accessorKey: 'submittedAt',
                header: 'Tanggal Ajuan',
                cell: ({ row }) => {
                    if (!row.original.submittedAt) return '-';
                    return (
                        <span className="text-sm">
                            {format(new Date(row.original.submittedAt), 'dd MMM yyyy', {
                                locale: id,
                            })}
                        </span>
                    );
                },
            },
            {
                id: 'actions',
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
                            {canCancel(row.original.status) && (
                                <DropdownMenuItem
                                    onClick={() => handleCancelClick(row.original.id)}
                                    className="text-destructive"
                                >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Batalkan
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            },
        ],
        []
    );

    const tableConfig: DataTableConfig<SavingsWithdrawal> = {
        searchable: true,
        searchPlaceholder: 'Cari berdasarkan nomor penarikan...',
        filterable: true,
        selectable: false,
        filterFields: [
            {
                id: 'status',
                label: 'Status',
                type: 'select',
                placeholder: 'Semua Status',
                options: [
                    { label: 'Semua Status', value: 'all' },
                    { label: 'Submitted', value: SavingsWithdrawalStatus.SUBMITTED },
                    { label: 'Review DSP', value: SavingsWithdrawalStatus.UNDER_REVIEW_DSP },
                    { label: 'Review Ketua', value: SavingsWithdrawalStatus.UNDER_REVIEW_KETUA },
                    { label: 'Menunggu Pencairan', value: SavingsWithdrawalStatus.APPROVED_WAITING_DISBURSEMENT },
                    { label: 'Proses Pencairan', value: SavingsWithdrawalStatus.DISBURSEMENT_IN_PROGRESS },
                    { label: 'Selesai', value: SavingsWithdrawalStatus.COMPLETED },
                    { label: 'Ditolak', value: SavingsWithdrawalStatus.REJECTED },
                    { label: 'Dibatalkan', value: SavingsWithdrawalStatus.CANCELLED },
                ],
            },
        ],
        toolbarActions: [
            {
                label: 'Ajukan Penarikan Baru',
                icon: Plus,
                onClick: handleCreateNew,
                variant: 'default',
            },
        ],
    };

    const totalWithdrawn = data
        .filter((w) => w.status === SavingsWithdrawalStatus.COMPLETED)
        .reduce((sum, w) => sum + Number(w.netAmount), 0);

    const inProgressCount = data.filter(
        (w) =>
            ![
                SavingsWithdrawalStatus.COMPLETED,
                SavingsWithdrawalStatus.REJECTED,
                SavingsWithdrawalStatus.CANCELLED,
            ].includes(w.status)
    ).length;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Tersedia</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(Number(tabungan?.summary.saldoSukarela || 0))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Saldo Sukarela yang dapat ditarik
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Penarikan</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(totalWithdrawn)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total yang sudah dicairkan
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dalam Proses</CardTitle>
                        <Clock className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {inProgressCount}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Pengajuan yang sedang diproses
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Penarikan Tabungan</CardTitle>
                    <CardDescription>
                        Kelola dan pantau semua pengajuan penarikan tabungan Anda
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTableAdvanced
                        columns={columns}
                        data={data}
                        meta={meta}
                        config={tableConfig}
                        onPageChange={(page) => setMeta((prev) => ({ ...prev, page }))}
                        onPageSizeChange={(limit) => setMeta((prev) => ({ ...prev, limit, page: 1 }))}
                        onSearch={setSearchValue}
                        onFiltersChange={setFilters}
                        onResetFilters={() => setFilters({})}
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

            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Batalkan Penarikan?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin membatalkan pengajuan penarikan ini?
                            Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Tidak</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelConfirm}>
                            Ya, Batalkan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}