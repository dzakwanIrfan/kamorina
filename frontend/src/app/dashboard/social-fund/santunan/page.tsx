'use client';

import { useState, useEffect, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Plus, Trash2, Download, Wallet, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTableAdvanced } from '@/components/data-table/data-table-advanced';
import { ColumnActions } from '@/components/data-table/column-actions';
import { SantunanFormDialog } from '@/components/social-fund/santunan-form-dialog';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';

import { useAuthStore } from '@/store/auth.store';
import { socialFundService } from '@/services/social-fund.service';
import { handleApiError } from '@/lib/axios';
import {
  SocialFundTransaction,
  QuerySocialFundParams,
} from '@/types/social-fund.types';
import { PaginatedResponse } from '@/types/pagination.types';
import { DataTableConfig } from '@/types/data-table.types';

const DEFAULT_QUERY_PARAMS: QuerySocialFundParams = {
  page: 1,
  limit: 10,
  search: '',
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

export default function SantunanPage() {
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

  const [queryParams, setQueryParams] =
    useState<QuerySocialFundParams>(DEFAULT_QUERY_PARAMS);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] =
    useState<SocialFundTransaction | null>(null);

  const canCreate = user?.roles?.some((role) =>
    ['ketua', 'divisi_simpan_pinjam'].includes(role),
  );
  const canDelete = user?.roles?.includes('ketua');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [balanceRes, listRes] = await Promise.all([
        socialFundService.getBalance(),
        socialFundService.getSantunanList(queryParams),
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

  const handleSearch = (search: string) => {
    setQueryParams((prev) => ({ ...prev, search, page: 1 }));
  };

  const handleResetFilters = () => {
    setQueryParams(DEFAULT_QUERY_PARAMS);
  };

  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (limit: number) => {
    setQueryParams((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    setQueryParams((prev) => ({
      ...prev,
      startDate: range.from?.toISOString(),
      endDate: range.to?.toISOString(),
      page: 1,
    }));
  };

  const handleCreate = () => {
    setIsFormOpen(true);
  };

  const handleDeleteClick = (item: SocialFundTransaction) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const handleExport = (selectedRows: SocialFundTransaction[]) => {
    const dataToExport = selectedRows.length > 0 ? selectedRows : data.data;

    const csv = [
      ['Tanggal', 'Penerima', 'NIK', 'Departemen', 'Jumlah', 'Alasan', 'Saldo Setelah', 'Dibuat Oleh'],
      ...dataToExport.map((item) => [
        format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm'),
        item.recipientUser?.employee.fullName || '-',
        item.recipientUser?.nik || '-',
        item.recipientUser?.employee.department.departmentName || '-',
        item.amount,
        `"${item.description || '-'}"`,
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
    a.download = `santunan-dana-sosial-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`Exported ${dataToExport.length} data`);
  };

  const handleSubmit = async (formData: {
    recipientUserId: string;
    amount: number;
    description: string;
  }) => {
    try {
      setIsSubmitting(true);
      const response = await socialFundService.createSantunan(formData);
      toast.success(response.message);
      setIsFormOpen(false);
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
      const response = await socialFundService.deleteSantunan(selectedItem.id);
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
    searchable: true,
    searchPlaceholder: 'Cari nama penerima atau keterangan...',
    filterable: false,
    dateRangeFilter: true,
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
      ? [{ label: 'Buat Santunan', icon: Plus, onClick: handleCreate }]
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
      accessorKey: 'recipientUser',
      header: 'Penerima',
      cell: ({ row }) => {
        const recipient = row.original.recipientUser;
        if (!recipient) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{recipient.employee.fullName}</span>
            <span className="text-xs text-muted-foreground">
              NIK: {recipient.nik || '-'} &middot;{' '}
              {recipient.employee.department.departmentName}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Jumlah',
      cell: ({ row }) => (
        <Badge variant="destructive" className="font-semibold">
          - {formatCurrency(row.original.amount)}
        </Badge>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Alasan/Peruntukan',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground max-w-[200px] truncate block">
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
    ...(canDelete
      ? [
          {
            id: 'actions',
            header: 'Aksi',
            cell: ({ row }: { row: any }) => (
              <ColumnActions
                onDelete={() => handleDeleteClick(row.original)}
                canDelete={canDelete}
              />
            ),
          } as ColumnDef<SocialFundTransaction>,
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Santunan</h1>
          <p className="text-muted-foreground">
            Pencairan dana sosial kepada anggota yang berhak
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardDescription>Saldo Dana Sosial</CardDescription>
              <CardTitle className="text-2xl">
                {formatCurrency(currentBalance)}
              </CardTitle>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
              <Wallet className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardDescription>Total Santunan Dicairkan</CardDescription>
              <CardTitle className="text-2xl">{data.meta.total} transaksi</CardTitle>
            </div>
          </CardHeader>
        </Card>
      </div>

      {currentBalance === 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Saldo dana sosial saat ini kosong. Silakan tambahkan saldo awal
            terlebih dahulu sebelum membuat santunan.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Santunan</CardTitle>
          <CardDescription>
            Total {data.meta.total} santunan tercatat
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
            onSearch={handleSearch}
            onDateRangeChange={handleDateRangeChange}
            onResetFilters={handleResetFilters}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <SantunanFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        currentBalance={currentBalance}
      />

      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title="Hapus Santunan"
        description={`Apakah Anda yakin ingin menghapus santunan sebesar ${selectedItem ? formatCurrency(selectedItem.amount) : ''} untuk ${selectedItem?.recipientUser?.employee.fullName || 'anggota ini'}? Saldo akan dikembalikan.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
