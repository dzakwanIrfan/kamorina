'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Eye, CheckCircle2, XCircle, Clock, Calendar, Download, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { DataTableAdvanced } from '@/components/data-table/data-table-advanced';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SavingsWithdrawalDetailDialog } from './savings-withdrawal-detail-dialog';
import { BulkApproveSavingsWithdrawalDialog } from './bulk-approve-savings-withdrawal-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

import { savingsWithdrawalService } from '@/services/savings-withdrawal.service';
import { useAuthStore } from '@/store/auth.store';
import { usePermissions } from '@/hooks/use-permission';
import {
    SavingsWithdrawal,
    SavingsWithdrawalStatus,
    SavingsWithdrawalStep,
} from '@/types/savings-withdrawal.types';
import { DataTableConfig } from '@/types/data-table.types';
import { formatCurrency } from '@/lib/format';
import * as XLSX from 'xlsx';

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
        icon: XCircle
    },
};

const stepMap = {
    [SavingsWithdrawalStep.DIVISI_SIMPAN_PINJAM]: 'Divisi Simpan Pinjam',
    [SavingsWithdrawalStep.KETUA]: 'Ketua',
    [SavingsWithdrawalStep.SHOPKEEPER]: 'Shopkeeper',
    [SavingsWithdrawalStep.KETUA_AUTH]: 'Ketua (Otorisasi)',
};

interface SavingsWithdrawalApprovalListProps {
    defaultStatus?: SavingsWithdrawalStatus;
    defaultStep?: SavingsWithdrawalStep;
}

export function SavingsWithdrawalApprovalList({
    defaultStatus,
    defaultStep
}: SavingsWithdrawalApprovalListProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { hasRole } = usePermissions();

    const [data, setData] = useState<SavingsWithdrawal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<SavingsWithdrawal | null>(null);
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
        if (defaultStep) return defaultStep;
        if (hasRole('ketua')) return SavingsWithdrawalStep.KETUA;
        if (hasRole('divisi_simpan_pinjam')) return SavingsWithdrawalStep.DIVISI_SIMPAN_PINJAM;
        return undefined;
    };

    const getDefaultStatusFilter = () => {
        if (defaultStatus) return defaultStatus;
        if (hasRole('ketua')) return SavingsWithdrawalStatus.UNDER_REVIEW_KETUA;
        if (hasRole('divisi_simpan_pinjam')) return SavingsWithdrawalStatus.SUBMITTED;
        return SavingsWithdrawalStatus.SUBMITTED;
    };

    const [filters, setFilters] = useState<Record<string, any>>({});
    const [searchValue, setSearchValue] = useState('');

    useEffect(() => {
        const statusParam = searchParams.get('status');
        const stepParam = searchParams.get('step');

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

    const canApprove = hasRole('ketua') || hasRole('divisi_simpan_pinjam');

    const fetchData = async () => {
        try {
            setIsLoading(true);

            const params: any = {
                page: meta.page,
                limit: meta.limit,
                search: searchValue || undefined,
                status: filters.status || undefined,
                step: filters.step || undefined,
                sortBy: 'submittedAt',
                sortOrder: 'desc',
            };

            if (dateRange.from) {
                params.startDate = format(dateRange.from, 'yyyy-MM-dd');
            }
            if (dateRange.to) {
                params.endDate = format(dateRange.to, 'yyyy-MM-dd');
            }

            const response = await savingsWithdrawalService.getAllWithdrawals(params);
            setData(response.data);
            setMeta(response.meta);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal memuat data');
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
        if (filters.status) params.set('status', filters.status);
        if (filters.step) params.set('step', filters.step);

        const newUrl = params.toString() ? `?${params.toString()}` : '';
        router.replace(newUrl, { scroll: false });
    }, [filters, router, isInitialized]);

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

    const handleBulkAction = async (decision: 'APPROVED' | 'REJECTED', notes?: string) => {
        try {
            const result = await savingsWithdrawalService.bulkProcessApproval({
                withdrawalIds: selectedIds,
                decision,
                notes,
            });

            toast.success(result.message);

            if (result.results.failed.length > 0) {
                toast.warning(`${result.results.failed.length} penarikan gagal diproses`);
            }

            setSelectedIds([]);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal memproses penarikan');
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
        setSearchValue('');
        setDateRange({});
        setMeta((prev) => ({ ...prev, page: 1 }));
    };

    const handleExport = () => {
        try {
            const exportData = data.map((withdrawal) => ({
                'Nomor Penarikan': withdrawal.withdrawalNumber,
                'Nama': withdrawal.user?.name || '-',
                'No. Karyawan': withdrawal.user?.employee.employeeNumber || '-',
                'Department': withdrawal.user?.employee.department?.departmentName || '-',
                'Jumlah Penarikan': withdrawal.withdrawalAmount,
                'Pinalti': withdrawal.penaltyAmount,
                'Diterima': withdrawal.netAmount,
                'Ada Pinalti': withdrawal.hasEarlyDepositPenalty ? 'Ya' : 'Tidak',
                'Status': statusMap[withdrawal.status]?.label || withdrawal.status,
                'Step Saat Ini': withdrawal.currentStep ? stepMap[withdrawal.currentStep] : '-',
                'Tanggal Submit': withdrawal.submittedAt
                    ? format(new Date(withdrawal.submittedAt), 'dd/MM/yyyy HH:mm', { locale: id })
                    : '-',
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Penarikan Tabungan');

            const fileName = `penarikan_tabungan_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
            XLSX.writeFile(wb, fileName);

            toast.success('Data berhasil diekspor');
        } catch (error) {
            toast.error('Gagal mengekspor data');
        }
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
                accessorKey: 'user.employee.employeeNumber',
                header: 'No. Karyawan',
                cell: ({ row }) => (
                    <span className="font-medium">
                        {row.original.user?.employee.employeeNumber}
                    </span>
                ),
            },
            {
                accessorKey: 'user.name',
                header: 'Nama',
                cell: ({ row }) => row.original.user?.name || '-',
            },
            {
                accessorKey: 'withdrawalAmount',
                header: 'Jumlah',
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
                    <div className="space-y-0.5">
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
                accessorKey: 'currentStep',
                header: 'Step',
                cell: ({ row }) => {
                    if (!row.original.currentStep) return '-';
                    return (
                        <Badge variant="outline" className="text-xs">
                            {stepMap[row.original.currentStep]}
                        </Badge>
                    );
                },
            },
            {
                accessorKey: 'submittedAt',
                header: 'Tanggal Submit',
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

    const tableConfig: DataTableConfig<SavingsWithdrawal> = {
        searchable: true,
        searchPlaceholder: 'Cari berdasarkan nama, nomor penarikan...',
        filterable: true,
        selectable: canApprove,
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
                ],
            },
            {
                id: 'step',
                label: 'Step',
                type: 'select',
                placeholder: 'Semua Step',
                options: [
                    { label: 'Semua Step', value: 'all' },
                    { label: 'Divisi Simpan Pinjam', value: SavingsWithdrawalStep.DIVISI_SIMPAN_PINJAM },
                    { label: 'Ketua', value: SavingsWithdrawalStep.KETUA },
                    { label: 'Shopkeeper', value: SavingsWithdrawalStep.SHOPKEEPER },
                    { label: 'Ketua (Otorisasi)', value: SavingsWithdrawalStep.KETUA_AUTH },
                ],
            },
        ],
        toolbarActions: [
            {
                label: 'Export',
                icon: Download,
                onClick: handleExport,
                variant: 'outline',
            },
        ],
        bulkActions: canApprove
            ? [
                {
                    label: 'Proses Massal',
                    onClick: (selected) => {
                        const ids = selected.map((item) => item.id);
                        setSelectedIds(ids);
                        setBulkDialogOpen(true);
                    },
                    icon: CheckCircle2,
                    variant: 'default',
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
                                            'justify-start text-left font-normal',
                                            !dateRange.from && 'text-muted-foreground'
                                        )}
                                    >
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {dateRange.from ? (
                                            format(dateRange.from, 'dd MMM yyyy', { locale: id })
                                        ) : (
                                            'Tanggal Mulai'
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <CalendarComponent
                                        mode="single"
                                        selected={dateRange.from}
                                        onSelect={(date) => setDateRange((prev) => ({ ...prev, from: date }))}
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
                                            'justify-start text-left font-normal',
                                            !dateRange.to && 'text-muted-foreground'
                                        )}
                                    >
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {dateRange.to ? (
                                            format(dateRange.to, 'dd MMM yyyy', { locale: id })
                                        ) : (
                                            'Tanggal Akhir'
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <CalendarComponent
                                        mode="single"
                                        selected={dateRange.to}
                                        onSelect={(date) => setDateRange((prev) => ({ ...prev, to: date }))}
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
                        onPageSizeChange={(limit) => setMeta((prev) => ({ ...prev, limit, page: 1 }))}
                        onSearch={setSearchValue}
                        onFiltersChange={handleFiltersChange}
                        onResetFilters={handleResetFilters}
                        isLoading={isLoading}
                    />
                </CardContent>
            </Card>

            <SavingsWithdrawalDetailDialog
                withdrawal={selectedWithdrawal}
                open={detailDialogOpen}
                onOpenChange={setDetailDialogOpen}
                onSuccess={fetchData}
                canApprove={
                    canApprove &&
                    selectedWithdrawal?.status !== SavingsWithdrawalStatus.COMPLETED &&
                    selectedWithdrawal?.status !== SavingsWithdrawalStatus.REJECTED &&
                    selectedWithdrawal?.currentStep !== null
                }
            />

            <BulkApproveSavingsWithdrawalDialog
                open={bulkDialogOpen}
                onOpenChange={setBulkDialogOpen}
                selectedCount={selectedIds.length}
                onConfirm={handleBulkAction}
            />
        </div>
    );
}