'use client';

import { useState, useEffect, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Plus, AlertCircle, Building2, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTableAdvanced } from '@/components/data-table/data-table-advanced';
import { ColumnActions } from '@/components/data-table/column-actions';
import { DepartmentFormDialog } from '@/components/departments/department-form-dialog';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';

import { useAuthStore } from '@/store/auth.store';
import { departmentService } from '@/services/department.service';
import { handleApiError } from '@/lib/axios';
import { Department, QueryDepartmentParams } from '@/types/department.types';
import { PaginatedResponse } from '@/types/pagination.types';
import { DataTableConfig } from '@/types/data-table.types';

// Define default query params
const DEFAULT_QUERY_PARAMS: QueryDepartmentParams = {
  page: 1,
  limit: 10,
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export default function DepartmentsPage() {
  const { user } = useAuthStore();
  const [departments, setDepartments] = useState<PaginatedResponse<Department>>({
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

  const [queryParams, setQueryParams] = useState<QueryDepartmentParams>(DEFAULT_QUERY_PARAMS);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [selectedForBulkDelete, setSelectedForBulkDelete] = useState<Department[]>([]);

  // Check permissions
  const canCreate = user?.roles?.some((role) =>
    ['ketua', 'divisi_simpan_pinjam'].includes(role)
  );
  const canEdit = user?.roles?.some((role) =>
    ['ketua', 'divisi_simpan_pinjam'].includes(role)
  );
  const canDelete = user?.roles?.includes('ketua');

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await departmentService.getAll(queryParams);
      setDepartments(response);
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Handlers
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
    // Reset to default query params
    setQueryParams(DEFAULT_QUERY_PARAMS);
  };

  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (limit: number) => {
    setQueryParams((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleCreate = () => {
    setSelectedDepartment(null);
    setIsFormOpen(true);
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (department: Department) => {
    setSelectedDepartment(department);
    setIsDeleteOpen(true);
  };

  const handleBulkDelete = (selectedRows: Department[]) => {
    setSelectedForBulkDelete(selectedRows);
    setIsBulkDeleteOpen(true);
  };

  const handleExport = (selectedRows: Department[]) => {
    const dataToExport = selectedRows.length > 0 ? selectedRows : departments.data;
    
    const csv = [
      ['ID', 'Department Name', 'User Count', 'Created At'],
      ...dataToExport.map((dept) => [
        dept.id,
        dept.departmentName,
        dept._count?.employees || 0,
        format(new Date(dept.createdAt), 'dd/MM/yyyy'),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `departments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success(`Exported ${dataToExport.length} departments`);
  };

  const handleSubmit = async (data: { departmentName: string }) => {
    try {
      setIsSubmitting(true);

      if (selectedDepartment) {
        await departmentService.update(selectedDepartment.id, data);
        toast.success('Department berhasil diupdate');
      } else {
        await departmentService.create(data);
        toast.success('Department berhasil ditambahkan');
      }

      setIsFormOpen(false);
      setSelectedDepartment(null);
      fetchDepartments();
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDepartment) return;

    try {
      setIsDeleting(true);
      const response = await departmentService.delete(selectedDepartment.id);
      toast.success(response.message);
      setIsDeleteOpen(false);
      setSelectedDepartment(null);
      fetchDepartments();
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      
      const promises = selectedForBulkDelete.map((dept) =>
        departmentService.delete(dept.id)
      );
      
      await Promise.all(promises);
      
      toast.success(`${selectedForBulkDelete.length} departments berhasil dihapus`);
      setIsBulkDeleteOpen(false);
      setSelectedForBulkDelete([]);
      fetchDepartments();
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // DataTable Config
  const tableConfig: DataTableConfig<Department> = {
    searchable: true,
    searchPlaceholder: 'Cari department...',
    filterable: true,
    filterFields: [
      {
        id: 'startDate',
        label: 'Dari Tanggal',
        type: 'date',
        placeholder: 'Pilih tanggal mulai',
      },
      {
        id: 'endDate',
        label: 'Sampai Tanggal',
        type: 'date',
        placeholder: 'Pilih tanggal akhir',
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
            label: 'Tambah Department',
            icon: Plus,
            onClick: handleCreate,
          },
        ]
      : [],
  };

  // Table columns
  const columns: ColumnDef<Department>[] = [
    {
      accessorKey: 'departmentName',
      header: 'Nama Department',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium">{row.original.departmentName}</span>
        </div>
      ),
    },
    {
      accessorKey: '_count.employee',
      header: 'Jumlah Karyawan',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original._count?.employees || 0} Karyawan</Badge>
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">
            Kelola department/divisi organisasi
          </p>
        </div>
      </div>

      {/* Warning for non-privileged users */}
      {!canCreate && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Anda hanya memiliki akses untuk melihat data. Hubungi admin untuk
            melakukan perubahan.
          </AlertDescription>
        </Alert>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Department</CardTitle>
          <CardDescription>
            Total {departments.meta.total} department terdaftar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTableAdvanced
            columns={columns}
            data={departments.data}
            meta={departments.meta}
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

      {/* Dialogs */}
      <DepartmentFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        department={selectedDepartment}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />

      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title="Hapus Department"
        description={`Apakah Anda yakin ingin menghapus department "${selectedDepartment?.departmentName}"? Aksi ini tidak dapat dibatalkan.`}
        isLoading={isDeleting}
      />

      <DeleteConfirmationDialog
        open={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        onConfirm={handleBulkDeleteConfirm}
        title="Hapus Multiple Departments"
        description={`Apakah Anda yakin ingin menghapus ${selectedForBulkDelete.length} departments? Aksi ini tidak dapat dibatalkan.`}
        isLoading={isDeleting}
      />
    </div>
  );
}