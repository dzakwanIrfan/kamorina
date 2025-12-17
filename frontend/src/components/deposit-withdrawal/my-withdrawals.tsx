'use client';

import { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Eye, CheckCircle2, XCircle, Clock, Plus, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { DataTableAdvanced } from '@/components/data-table/data-table-advanced';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WithdrawalDetailDialog } from '@/components/deposit-withdrawal/withdrawal-detail-dialog';
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

import { depositWithdrawalService } from '@/services/deposit-withdrawal.service';
import {
    DepositWithdrawal,
    DepositWithdrawalStatus
} from '@/types/deposit-withdrawal.types';
import { DataTableConfig } from '@/types/data-table.types';
import { formatCurrency } from '@/lib/format';
import { useBukuTabungan } from '@/hooks/use-buku-tabungan';

const statusMap = {
    [DepositWithdrawalStatus.SUBMITTED]: {
        label: 'Submitted',
        variant: 'default' as const,
        icon: Clock
    },
    [DepositWithdrawalStatus.UNDER_REVIEW_DSP]: {
        label: 'Review DSP',
        variant: 'default' as const,
        icon: Clock
    },
    [DepositWithdrawalStatus.UNDER_REVIEW_KETUA]: {
        label: 'Review Ketua',
        variant: 'default' as const,
        icon: Clock
    },
    [DepositWithdrawalStatus.APPROVED_WAITING_DISBURSEMENT]: {
        label: 'Menunggu Pencairan',
        variant: 'default' as const,
        icon: Clock
    },
    [DepositWithdrawalStatus.DISBURSEMENT_IN_PROGRESS]: {
        label: 'Proses Pencairan',
        variant: 'default' as const,
        icon: Clock
    },
    [DepositWithdrawalStatus.COMPLETED]: {
        label: 'Selesai',
        variant: 'default' as const,
        icon: CheckCircle2
    },
    [DepositWithdrawalStatus.REJECTED]: {
        label: 'Ditolak',
        variant: 'destructive' as const,
        icon: XCircle
    },
    [DepositWithdrawalStatus.CANCELLED]: {
        label: 'Dibatalkan',
        variant: 'destructive' as const,
        icon: Ban
    },
};

export function MyWithdrawals() {
    const router = useRouter();
    const [data, setData] = useState<DepositWithdrawal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<DepositWithdrawal | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [withdrawalToCancel, setWithdrawalToCancel] = useState<string | null>(null);
    const { tabungan } = useBukuTabungan({
        includeTransactionSummary: true,
    });

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
            const response = await depositWithdrawalService.getMyWithdrawals({
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

    const handleViewDetail = (withdrawal: DepositWithdrawal) => {
        setSelectedWithdrawal(withdrawal);
        setDetailDialogOpen(true);
    };

    const handleCreateNew = () => {
        router.push('/dashboard/deposit-withdrawals/create');
    };

    const handleCancelClick = (withdrawalId: string) => {
        setWithdrawalToCancel(withdrawalId);
        setCancelDialogOpen(true);
    };

    const handleCancelConfirm = async () => {
        if (!withdrawalToCancel) return;

        try {
            await depositWithdrawalService.cancelWithdrawal(withdrawalToCancel);
            toast.success('Penarikan berhasil dibatalkan');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal membatalkan penarikan');
        } finally {
            setCancelDialogOpen(false);
            setWithdrawalToCancel(null);
        }
    };

    const canCancel = (status: DepositWithdrawalStatus) => {
        return [
            DepositWithdrawalStatus.SUBMITTED,
            DepositWithdrawalStatus.UNDER_REVIEW_DSP,
            DepositWithdrawalStatus.UNDER_REVIEW_KETUA,
        ].includes(status);
    };

    const columns: ColumnDef<DepositWithdrawal>[] = useMemo(
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
                accessorKey: 'depositApplication.depositNumber',
                header: 'No. Deposito',
                cell: ({ row }) => (
                    <span className="font-mono text-sm">
                        {row.original.depositApplication?.depositNumber || '-'}
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
                        {row.original.isEarlyWithdrawal && (
                            <div className="text-xs text-orange-600">
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

    const tableConfig: DataTableConfig<DepositWithdrawal> = {
        searchable: true,
        searchPlaceholder: 'Cari berdasarkan nomor penarikan atau deposito...',
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
                    { label: 'Submitted', value: DepositWithdrawalStatus.SUBMITTED },
                    { label: 'Review DSP', value: DepositWithdrawalStatus.UNDER_REVIEW_DSP },
                    { label: 'Review Ketua', value: DepositWithdrawalStatus.UNDER_REVIEW_KETUA },
                    { label: 'Menunggu Pencairan', value: DepositWithdrawalStatus.APPROVED_WAITING_DISBURSEMENT },
                    { label: 'Proses Pencairan', value: DepositWithdrawalStatus.DISBURSEMENT_IN_PROGRESS },
                    { label: 'Selesai', value: DepositWithdrawalStatus.COMPLETED },
                    { label: 'Ditolak', value: DepositWithdrawalStatus.REJECTED },
                    { label: 'Dibatalkan', value: DepositWithdrawalStatus.CANCELLED },
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
        .filter((w) => w.status === DepositWithdrawalStatus.COMPLETED)
        .reduce((sum, w) => sum + Number(w.netAmount), 0);

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pengajuan</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{meta.total}</div>
                        <p className="text-xs text-muted-foreground">
                            Semua pengajuan penarikan
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tabungan</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(Number(tabungan?.summary.saldoSukarela))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total saldo yang bisa diambil
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
                            {
                                data.filter(
                                    (w) =>
                                        ![
                                            DepositWithdrawalStatus.COMPLETED,
                                            DepositWithdrawalStatus.REJECTED,
                                            DepositWithdrawalStatus.CANCELLED,
                                        ].includes(w.status)
                                ).length
                            }
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Pengajuan yang sedang diproses
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Penarikan Deposito</CardTitle>
                    <CardDescription>
                        Kelola dan pantau semua pengajuan penarikan deposito Anda
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

            <WithdrawalDetailDialog
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