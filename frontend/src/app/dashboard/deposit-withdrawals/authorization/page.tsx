'use client';

import { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Eye, Shield } from 'lucide-react';
import { toast } from 'sonner';

import { DataTableAdvanced } from '@/components/data-table/data-table-advanced';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WithdrawalDetailDialog } from '@/components/deposit-withdrawal/withdrawal-detail-dialog';
import { KetuaAuthorizationDialog } from '@/components/deposit-withdrawal/shopkeeper-disbursement';

import { depositWithdrawalService } from '@/services/deposit-withdrawal.service';
import {
    DepositWithdrawal,
    DepositWithdrawalStep,
} from '@/types/deposit-withdrawal.types';
import { DataTableConfig } from '@/types/data-table.types';
import { formatCurrency } from '@/lib/format';

export default function WithdrawalAuthorizationPage() {
    const [data, setData] = useState<DepositWithdrawal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<DepositWithdrawal | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [authDialogOpen, setAuthDialogOpen] = useState(false);

    const [meta, setMeta] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
    });

    const [searchValue, setSearchValue] = useState('');
    const [filters, setFilters] = useState<Record<string, any>>({
        step: DepositWithdrawalStep.KETUA_AUTH,
    });

    useEffect(() => {
        fetchData();
    }, [meta.page, meta.limit, searchValue, filters]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const response = await depositWithdrawalService.getAllWithdrawals({
                page: meta.page,
                limit: meta.limit,
                search: searchValue || undefined,
                step: filters.step || undefined,
                sortBy: 'submittedAt',
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

    const handleViewDetail = async (withdrawal: DepositWithdrawal) => {
        try {
            const fullWithdrawal = await depositWithdrawalService.getWithdrawalById(withdrawal.id);
            setSelectedWithdrawal(fullWithdrawal);
            setDetailDialogOpen(true);
        } catch (error) {
            setSelectedWithdrawal(withdrawal);
            setDetailDialogOpen(true);
        }
    };

    const handleAuthorization = (withdrawal: DepositWithdrawal) => {
        setSelectedWithdrawal(withdrawal);
        setAuthDialogOpen(true);
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
                accessorKey: 'user.name',
                header: 'Nama',
                cell: ({ row }) => row.original.user?.name || '-',
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
                accessorKey: 'netAmount',
                header: 'Jumlah',
                cell: ({ row }) => (
                    <span className="font-bold text-green-600">
                        {formatCurrency(row.original.netAmount)}
                    </span>
                ),
            },
            {
                accessorKey: 'disbursement.processedByUser.name',
                header: 'Diproses oleh',
                cell: ({ row }) => (
                    <span className="text-sm">
                        {row.original.disbursement?.processedByUser.name || '-'}
                    </span>
                ),
            },
            {
                accessorKey: 'disbursement.transactionDate',
                header: 'Tgl Pencairan',
                cell: ({ row }) => {
                    if (!row.original.disbursement?.transactionDate) return '-';
                    return (
                        <span className="text-sm">
                            {format(
                                new Date(row.original.disbursement.transactionDate),
                                'dd MMM yyyy',
                                { locale: id }
                            )}
                        </span>
                    );
                },
            },
            {
                id: 'actions',
                cell: ({ row }) => (
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(row.original)}
                        >
                            <Eye className="h-4 w-4 mr-2" />
                            Detail
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => handleAuthorization(row.original)}
                        >
                            <Shield className="h-4 w-4 mr-2" />
                            Otorisasi
                        </Button>
                    </div>
                ),
            },
        ],
        []
    );

    const tableConfig: DataTableConfig<DepositWithdrawal> = {
        searchable: true,
        searchPlaceholder: 'Cari berdasarkan nama atau nomor...',
        filterable: false,
        selectable: false,
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Otorisasi Penarikan Deposito
                </h1>
                <p className="text-muted-foreground">
                    Berikan otorisasi final untuk menyelesaikan proses penarikan
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Menunggu Otorisasi</CardTitle>
                    <CardDescription>
                        Otorisasi final setelah pencairan dana dikonfirmasi
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
                        onResetFilters={() => setFilters({ step: DepositWithdrawalStep.KETUA_AUTH })}
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

            <KetuaAuthorizationDialog
                withdrawal={selectedWithdrawal}
                open={authDialogOpen}
                onOpenChange={setAuthDialogOpen}
                onSuccess={fetchData}
            />
        </div>
    );
}