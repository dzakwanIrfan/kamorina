'use client';

import { useState, useEffect, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Plus, Trash2, Download, Wallet } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTableAdvanced } from '@/components/data-table/data-table-advanced';
import { ColumnActions } from '@/components/data-table/column-actions';
import { InitialBalanceFormDialog } from '@/components/social-fund/initial-balance-form-dialog';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';

import { useAuthStore } from '@/store/auth.store';
import { socialFundService } from '@/services/social-fund.service';
import { handleApiError } from '@/lib/axios';
import { SocialFundTransaction, QuerySocialFundParams } from '@/types/social-fund.types';
import { PaginatedResponse } from '@/types/pagination.types';
import { DataTableConfig } from '@/types/data-table.types';

const DEFAULT_QUERY_PARAMS: QuerySocialFundParams = {
  page: 1,
  limit: 10,
  sortOrder: 'desc',
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function InitialBalancePage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<PaginatedResponse<SocialFundTransaction>>({
    data: [],
    meta: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  });
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [queryParams, setQueryParams] = useState<QuerySocialFundParams>(DEFAULT_QUERY_PARAMS);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SocialFundTransaction | null>(null);

  const canCreate = user?.roles?.some((role) =>
    ['ketua', 'divisi_simpan_pinjam'].includes(role),
  );
  const canEdit = user?.roles?.some((role) =>
    ['ketua', 'divisi_simpan_pinjam'].includes(role),
  );
  const canDelete = user?.roles?.includes('ketua');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [balanceRes, listRes] = await Promise.all([
        socialFundService.getBalance(),
        socialFundService.getInitialBalances(queryParams),
      ]);
      setCurrentBalance(balanceRes.currentBalance);
      setData(listRes);
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (limit: number) => {
    setQueryParams((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleCreate = () => {
    setSelectedItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: SocialFundTransaction) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (item: SocialFundTransaction) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const handleExport = (selectedRows: SocialFundTransaction[]) => {
    const dataToExport = selectedRows.length > 0 ? selectedRows : data.data;

    const csv = [
      ['Tanggal', 'Jumlah', 'Keterangan', 'Saldo Setelah', 'Dibuat Oleh'],
      ...dataToExport.map((item) => [
        format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm'),
        item.amount,
        item.description || '-',
        item.balanceAfter,
        item.createdByUser.name,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saldo-awal-dana-sosial-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`Exported ${dataToExport.length} data`);
  };

  const handleSubmit = async (formData: { amount: number; description?: string }) => {
    try {
      setIsSubmitting(true);
      if (selectedItem) {
        await socialFundService.updateInitialBalance(selectedItem.id, formData);
        toast.success('Saldo awal berhasil diperbarui');
      } else {
        await socialFundService.createInitialBalance(formData);
        toast.success('Saldo awal berhasil ditambahkan');
      }
      setIsFormOpen(false);
      setSelectedItem(null);
      fetchData();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      setIsDeleting(true);
      const response = await socialFundService.deleteInitialBalance(selectedItem.id);
      toast.success(response.message);
      setIsDeleteOpen(false);
      setSelectedItem(null);
      fetchData();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const tableConfig: DataTableConfig<SocialFundTransaction> = {
    searchable: false,
    filterable: false,
    selectable: false,
    bulkActions: [
      {
        label: 'Export',
        icon: Download,
        variant: 'outline',
        onClick: handleExport,
      },
    ],
    toolbarActions: canCreate
      ? [{ label: 'Tambah Saldo Awal', icon: Plus, onClick: handleCreate }]
      : [],
  };

  const columns: ColumnDef<SocialFundTransaction>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Tanggal',
      cell: ({ row }) => (
        <span className="text-sm">
          {format(new Date(row.original.createdAt), 'dd MMM yyyy, HH:mm', {
            locale: localeId,
          })}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Jumlah',
      cell: ({ row }) => (
        <span className="font-semibold text-primary">
          {formatCurrency(row.original.amount)}
        </span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Keterangan',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.description || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'balanceAfter',
      header: 'Saldo Setelah',
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {formatCurrency(row.original.balanceAfter)}
        </span>
      ),
    },
    {
      accessorKey: 'createdByUser',
      header: 'Dibuat Oleh',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.createdByUser.name}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <ColumnActions
          onEdit={canEdit ? () => handleEdit(row.original) : undefined}
          onDelete={canDelete ? () => handleDeleteClick(row.original) : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saldo Awal Dana Sosial</h1>
          <p className="text-muted-foreground">
            Kelola saldo awal untuk dana sosial koperasi
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardDescription>Saldo Dana Sosial Saat Ini</CardDescription>
            <CardTitle className="text-2xl">
              {formatCurrency(currentBalance)}
            </CardTitle>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Saldo Awal</CardTitle>
          <CardDescription>
            Total {data.meta.total} entri saldo awal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTableAdvanced
            columns={columns}
            data={data.data}
            meta={data.meta}
            config={tableConfig}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <InitialBalanceFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        item={selectedItem}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />

      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title="Hapus Saldo Awal"
        description={`Apakah Anda yakin ingin menghapus entri saldo awal sebesar ${selectedItem ? formatCurrency(selectedItem.amount) : ''}? Saldo dana sosial akan dikurangi sejumlah ini.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
