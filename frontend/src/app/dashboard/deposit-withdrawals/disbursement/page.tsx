'use client';

import { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Eye, Banknote } from 'lucide-react';
import { toast } from 'sonner';

import { DataTableAdvanced } from '@/components/data-table/data-table-advanced';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WithdrawalDetailDialog } from '@/components/deposit-withdrawal/withdrawal-detail-dialog';
import { ShopkeeperDisbursementDialog } from '@/components/deposit-withdrawal/shopkeeper-disbursement';

import { depositWithdrawalService } from '@/services/deposit-withdrawal.service';
import {
    DepositWithdrawal,
    DepositWithdrawalStep,
} from '@/types/deposit-withdrawal.types';
import { DataTableConfig } from '@/types/data-table.types';
import { formatCurrency } from '@/lib/format';

export default function WithdrawalDisbursementPage() {
    const [data, setData] = useState<DepositWithdrawal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<DepositWithdrawal | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [disbursementDialogOpen, setDisbursementDialogOpen] = useState(false);

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
        step: DepositWithdrawalStep.SHOPKEEPER,
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

    const handleDisbursement = (withdrawal: DepositWithdrawal) => {
        setSelectedWithdrawal(withdrawal);
        setDisbursementDialogOpen(true);
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
                header: 'Jumlah Transfer',
                cell: ({ row }) => (
                    <span className="font-bold text-green-600">
                        {formatCurrency(row.original.netAmount)}
                    </span>
                ),
            },
            {
                accessorKey: 'bankAccountNumber',
                header: 'Rekening',
                cell: ({ row }) => (
                    <span className="font-mono text-sm">
                        {row.original.bankAccountNumber || '-'}
                    </span>
                ),
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
                            onClick={() => handleDisbursement(row.original)}
                        >
                            <Banknote className="h-4 w-4 mr-2" />
                            Proses
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
                    Pencairan Dana Penarikan
                </h1>
                <p className="text-muted-foreground">
                    Proses pencairan dana untuk penarikan deposito yang sudah disetujui
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Pencairan Menunggu Proses</CardTitle>
                    <CardDescription>
                        Konfirmasi pencairan dana setelah transfer dilakukan
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
                        onResetFilters={() => setFilters({ step: DepositWithdrawalStep.SHOPKEEPER })}
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

            <ShopkeeperDisbursementDialog
                withdrawal={selectedWithdrawal}
                open={disbursementDialogOpen}
                onOpenChange={setDisbursementDialogOpen}
                onSuccess={fetchData}
            />
        </div>
    );
}