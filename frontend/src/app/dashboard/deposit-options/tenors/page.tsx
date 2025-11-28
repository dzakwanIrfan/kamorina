'use client';

import { useState, useEffect, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Plus, AlertCircle, Trash2, Download, Calendar } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTableAdvanced } from '@/components/data-table/data-table-advanced';
import { ColumnActions } from '@/components/data-table/column-actions';
import { DepositTenorFormDialog } from '@/components/deposit-options/deposit-tenor-form-dialog';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';

import { useAuthStore } from '@/store/auth.store';
import { depositOptionService } from '@/services/deposit-option.service';
import { handleApiError } from '@/lib/axios';
import { DepositTenorOption, QueryDepositOptionParams } from '@/types/deposit-option.types';
import { PaginatedResponse } from '@/types/pagination.types';
import { DataTableConfig } from '@/types/data-table.types';

const DEFAULT_QUERY_PARAMS: QueryDepositOptionParams = {
  page: 1,
  limit: 10,
  search: '',
  sortBy: 'sortOrder',
  sortOrder: 'asc',
};

export default function DepositTenorsPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<PaginatedResponse<DepositTenorOption>>({
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [queryParams, setQueryParams] = useState<QueryDepositOptionParams>(DEFAULT_QUERY_PARAMS);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DepositTenorOption | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [selectedForBulkDelete, setSelectedForBulkDelete] = useState<DepositTenorOption[]>([]);

  const canCreate = user?.roles?.some((role) =>
    ['ketua', 'divisi_simpan_pinjam'].includes(role)
  );
  const canEdit = user?.roles?.some((role) =>
    ['ketua', 'divisi_simpan_pinjam'].includes(role)
  );
  const canDelete = user?.roles?.includes('ketua');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await depositOptionService.getAllTenors(queryParams);
      setData(response);
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

  const handleFiltersChange = (filters: Record<string, any>) => {
    setQueryParams((prev) => ({
      ...prev,
      ...filters,
      page: 1,
    }));
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

  const handleCreate = () => {
    setSelectedItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: DepositTenorOption) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (item: DepositTenorOption) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const handleBulkDelete = (selectedRows: DepositTenorOption[]) => {
    setSelectedForBulkDelete(selectedRows);
    setIsBulkDeleteOpen(true);
  };

  const handleExport = (selectedRows: DepositTenorOption[]) => {
    const dataToExport = selectedRows.length > 0 ? selectedRows : data.data;

    const csv = [
      ['Kode', 'Label', 'Bulan', 'Status', 'Urutan', 'Tanggal Dibuat'],
      ...dataToExport.map((item) => [
        item.code,
        item.label,
        item.months,
        item.isActive ? 'Aktif' : 'Tidak Aktif',
        item.sortOrder,
        format(new Date(item.createdAt), 'dd/MM/yyyy'),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deposit-tenors-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success(`Exported ${dataToExport.length} data`);
  };

  const handleSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true);

      if (selectedItem) {
        await depositOptionService.updateTenor(selectedItem.id, formData);
        toast.success('Opsi tenor deposito berhasil diupdate');
      } else {
        await depositOptionService.createTenor(formData);
        toast.success('Opsi tenor deposito berhasil ditambahkan');
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
      const response = await depositOptionService.deleteTenor(selectedItem.id);
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

  const handleBulkDeleteConfirm = async () => {
    try {
      setIsDeleting(true);

      const promises = selectedForBulkDelete.map((item) =>
        depositOptionService.deleteTenor(item.id)
      );

      await Promise.all(promises);

      toast.success(`${selectedForBulkDelete.length} data berhasil dihapus`);
      setIsBulkDeleteOpen(false);
      setSelectedForBulkDelete([]);
      fetchData();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setIsDeleting(false);
    }
  };

  const tableConfig: DataTableConfig<DepositTenorOption> = {
    searchable: true,
    searchPlaceholder: 'Cari kode atau label...',
    filterable: true,
    filterFields: [
      {
        id: 'isActive',
        label: 'Status',
        type: 'select',
        placeholder: 'Semua Status',
        options: [
          { label: 'Semua Status', value: 'all' },
          { label: 'Aktif', value: 'true' },
          { label: 'Tidak Aktif', value: 'false' },
        ],
      },
    ],
    selectable: canDelete,
    bulkActions: canDelete
      ? [
          {
            label: 'Delete Selected',
            icon: Trash2,
            variant: 'destructive',
            onClick: handleBulkDelete,
          },
          {
            label: 'Export Selected',
            icon: Download,
            variant: 'outline',
            onClick: handleExport,
          },
        ]
      : [
          {
            label: 'Export Selected',
            icon: Download,
            variant: 'outline',
            onClick: handleExport,
          },
        ],
    toolbarActions: canCreate
      ? [
          {
            label: 'Tambah Tenor',
            icon: Plus,
            onClick: handleCreate,
          },
        ]
      : [],
  };

  const columns: ColumnDef<DepositTenorOption>[] = [
    {
      accessorKey: 'code',
      header: 'Kode',
      cell: ({ row }) => (
        <span className="font-mono font-medium text-sm">{row.original.code}</span>
      ),
    },
    {
      accessorKey: 'label',
      header: 'Label',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium">{row.original.label}</span>
        </div>
      ),
    },
    {
      accessorKey: 'months',
      header: 'Durasi',
      cell: ({ row }) => (
        <span className="font-semibold text-primary">
          {row.original.months} Bulan
        </span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? 'Aktif' : 'Tidak Aktif'}
        </Badge>
      ),
    },
    {
      accessorKey: 'sortOrder',
      header: 'Urutan',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.sortOrder}</Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Tanggal Dibuat',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.createdAt), 'dd MMM yyyy', {
            locale: localeId,
          })}
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
          <h1 className="text-3xl font-bold tracking-tight">Opsi Tenor Deposito</h1>
          <p className="text-muted-foreground">
            Kelola pilihan jangka waktu deposito yang tersedia
          </p>
        </div>
      </div>

      {!canCreate && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Anda hanya memiliki akses untuk melihat data. Hubungi admin untuk
            melakukan perubahan.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Opsi Tenor Deposito</CardTitle>
          <CardDescription>
            Total {data.meta.total} opsi terdaftar
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
            onFiltersChange={handleFiltersChange}
            onResetFilters={handleResetFilters}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <DepositTenorFormDialog
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
        title="Hapus Opsi Tenor Deposito"
        description={`Apakah Anda yakin ingin menghapus "${selectedItem?.label}"? Aksi ini tidak dapat dibatalkan.`}
        isLoading={isDeleting}
      />

      <DeleteConfirmationDialog
        open={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        onConfirm={handleBulkDeleteConfirm}
        title="Hapus Multiple Opsi"
        description={`Apakah Anda yakin ingin menghapus ${selectedForBulkDelete.length} opsi? Aksi ini tidak dapat dibatalkan.`}
        isLoading={isDeleting}
      />
    </div>
  );
}