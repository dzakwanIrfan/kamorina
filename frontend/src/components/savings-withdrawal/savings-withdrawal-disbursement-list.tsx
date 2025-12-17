'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Banknote, AlertTriangle, Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

import { DataTableAdvanced } from '@/components/data-table/data-table-advanced';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SavingsWithdrawalDisbursementDialog } from './savings-withdrawal-disbursement-dialog';
import { SavingsWithdrawalDetailDialog } from './savings-withdrawal-detail-dialog';

import { savingsWithdrawalService } from '@/services/savings-withdrawal.service';
import { usePermissions } from '@/hooks/use-permission';
import {
    SavingsWithdrawal,
    SavingsWithdrawalStatus,
} from '@/types/savings-withdrawal.types';
import { DataTableConfig } from '@/types/data-table.types';
import { formatCurrency } from '@/lib/format';

export function SavingsWithdrawalDisbursementList() {
    const [data, setData] = useState<SavingsWithdrawal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<SavingsWithdrawal | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [disbursementDialogOpen, setDisbursementDialogOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // For single action via detail or row action
    const [singleActionId, setSingleActionId] = useState<string | null>(null);

    const [meta, setMeta] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
    });

    const [searchValue, setSearchValue] = useState('');

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const response = await savingsWithdrawalService.getAllWithdrawals({
                page: meta.page,
                limit: meta.limit,
                search: searchValue || undefined,
                status: SavingsWithdrawalStatus.APPROVED_WAITING_DISBURSEMENT, // Filter specifically for this page
                sortBy: 'submittedAt',
                sortOrder: 'asc', // Oldest first for disbursement queue
            });
            setData(response.data);
            setMeta(response.meta);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal memuat data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [meta.page, meta.limit, searchValue]);

    const handleBulkDisbursement = async (transactionDate: Date | undefined, notes: string) => {
        try {
            const idsToProcess = singleActionId ? [singleActionId] : selectedIds;

            const result = await savingsWithdrawalService.bulkConfirmDisbursement({
                withdrawalIds: idsToProcess,
                transactionDate: transactionDate ? format(transactionDate, 'yyyy-MM-dd') : undefined,
                notes,
            });

            toast.success(result.message);

            if (result.results && result.results.failed.length > 0) {
                toast.warning(`${result.results.failed.length} pencairan gagal diproses`);
            }

            setSelectedIds([]);
            setSingleActionId(null);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal memproses pencairan');
            throw error;
        }
    };

    const openDisbursementDialog = (ids: string[]) => {
        setSelectedIds(ids);
        setSingleActionId(null);
        setDisbursementDialogOpen(true);
    };

    const openSingleDisbursementDialog = (id: string) => {
        setSingleActionId(id);
        setSelectedIds([]); // clear bulk selection just in case
        setDisbursementDialogOpen(true);
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

    const handleExport = () => {
        try {
            const exportData = data.map((withdrawal) => ({
                'Nomor Penarikan': withdrawal.withdrawalNumber,
                'Nama': withdrawal.user?.name || '-',
                'No. Karyawan': withdrawal.user?.employee.employeeNumber || '-',
                'Bank': withdrawal.bankAccountNumber || withdrawal.user?.bankAccountNumber || '-',
                'Jumlah Transfer': withdrawal.netAmount,
                'Tanggal Approval': withdrawal.approvals.find(a => a.step === 'SHOPKEEPER')?.decidedAt
                    ? format(new Date(withdrawal.approvals.find(a => a.step === 'SHOPKEEPER')!.decidedAt!), 'dd/MM/yyyy HH:mm')
                    : '-',
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Siap Cair');

            const fileName = `pencairan_tabungan_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
            XLSX.writeFile(wb, fileName);

            toast.success('Data siap cair berhasil diekspor');
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
                accessorKey: 'user.name',
                header: 'Nama',
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span className="font-medium">{row.original.user?.name}</span>
                        <span className="text-xs text-muted-foreground">{row.original.user?.employee.employeeNumber}</span>
                    </div>
                ),
            },
            {
                accessorKey: 'bankAccountNumber',
                header: 'Rekening',
                cell: ({ row }) => row.original.bankAccountNumber || row.original.user?.bankAccountNumber || '-',
            },
            {
                accessorKey: 'netAmount',
                header: 'Jumlah Transfer',
                cell: ({ row }) => (
                    <div className="space-y-0.5">
                        <div className="font-bold text-green-700 text-lg">
                            {formatCurrency(row.original.netAmount)}
                        </div>
                        {row.original.hasEarlyDepositPenalty && (
                            <div className="flex items-center gap-1 text-xs text-orange-600">
                                <AlertTriangle className="h-3 w-3" />
                                Termasuk Pinalti
                            </div>
                        )}
                    </div>
                ),
            },
            {
                id: 'actions',
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
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => openSingleDisbursementDialog(row.original.id)}
                        >
                            <Banknote className="h-4 w-4 mr-2" />
                            Cairkan
                        </Button>
                    </div>
                ),
            },
        ],
        []
    );

    const tableConfig: DataTableConfig<SavingsWithdrawal> = {
        searchable: true,
        searchPlaceholder: 'Cari nama atau nomor...',
        selectable: true,
        toolbarActions: [
            {
                label: 'Export Data Transfer',
                icon: Download,
                onClick: handleExport,
                variant: 'outline',
            },
        ],
        bulkActions: [
            {
                label: 'Proses Pencairan Massal',
                onClick: (selected) => {
                    const ids = selected.map((item) => item.id);
                    openDisbursementDialog(ids);
                },
                icon: Banknote,
                variant: 'default',
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
                        onPageSizeChange={(limit) => setMeta((prev) => ({ ...prev, limit, page: 1 }))}
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
                canApprove={false} // Detail dialog is primarily for viewing here, actions are in table
            />

            <SavingsWithdrawalDisbursementDialog
                open={disbursementDialogOpen}
                onOpenChange={setDisbursementDialogOpen}
                selectedCount={singleActionId ? 1 : selectedIds.length}
                onConfirm={handleBulkDisbursement}
            />
        </>
    );
}
