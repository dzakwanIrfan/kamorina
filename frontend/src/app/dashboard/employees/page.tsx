'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Plus, Eye, Pencil, Trash2, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';

import { DataTableAdvanced } from '@/components/data-table/data-table-advanced';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmployeeFormDialog } from '@/components/employees/employee-form-dialog';
import { EmployeeDetailDialog } from '@/components/employees/employee-detail-dialog';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ColumnActions } from '@/components/data-table/column-actions';

import { employeeService } from '@/services/employee.service';
import { usePermissions } from '@/hooks/use-permission';
import { Employee } from '@/types/employee.types';
import { DataTableConfig } from '@/types/data-table.types';

export default function EmployeesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasRole } = usePermissions();

  const [data, setData] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Pagination state
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [filters, setFilters] = useState<Record<string, any>>({});
  const [searchValue, setSearchValue] = useState('');

  // Check permissions
  const canCreate = hasRole('ketua') || hasRole('divisi_simpan_pinjam') || hasRole('pengawas');
  const canEdit = hasRole('ketua') || hasRole('divisi_simpan_pinjam') || hasRole('pengawas');
  const canDelete = hasRole('ketua') || hasRole('divisi_simpan_pinjam');

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const params: any = {
        page: meta.page,
        limit: meta.limit,
        search: searchValue || undefined,
        isActive: filters.isActive !== undefined ? filters.isActive === 'true' : undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const response = await employeeService.getAll(params);
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
  }, [meta.page, meta.limit, searchValue, filters]);

  const handleCreate = () => {
    setSelectedEmployee(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormDialogOpen(true);
  };

  const handleViewDetail = (employee: Employee) => {
    setSelectedEmployeeId(employee.id);
    setDetailDialogOpen(true);
  };

  const handleDelete = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
  };

  const handleToggleActive = async (employee: Employee) => {
    try {
      const result = await employeeService.toggleActive(employee.id);
      toast.success(result.message);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengubah status');
    }
  };

  const confirmDelete = async () => {
    if (!selectedEmployee) return;

    try {
      const result = await employeeService.delete(selectedEmployee.id);
      toast.success(result.message);
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menghapus karyawan');
    }
  };

  const columns: ColumnDef<Employee>[] = useMemo(
    () => [
      {
        accessorKey: 'employeeNumber',
        header: 'No. Karyawan',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.employeeNumber}</span>
        ),
      },
      {
        accessorKey: 'fullName',
        header: 'Nama Lengkap',
        cell: ({ row }) => row.original.fullName,
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
        accessorKey: '_count.users',
        header: 'Jumlah User',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original._count?.users || 0} user
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Tanggal Dibuat',
        cell: ({ row }) => (
          <span className="text-sm">
            {format(new Date(row.original.createdAt), 'dd MMM yyyy', {
              locale: id,
            })}
          </span>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleToggleActive(row.original)}
              title={row.original.isActive ? 'Nonaktifkan' : 'Aktifkan'}
            >
              {row.original.isActive ? (
                <PowerOff className="h-4 w-4 text-orange-600" />
              ) : (
                <Power className="h-4 w-4 text-green-600" />
              )}
            </Button>
            <ColumnActions
              onView={() => handleViewDetail(row.original)}
              onEdit={canEdit ? () => handleEdit(row.original) : undefined}
              onDelete={canDelete ? () => handleDelete(row.original) : undefined}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          </div>
        ),
      },
    ],
    [canEdit, canDelete]
  );

  const tableConfig: DataTableConfig<Employee> = {
    searchable: true,
    searchPlaceholder: 'Cari berdasarkan nomor atau nama karyawan...',
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
    toolbarActions: canCreate
      ? [
          {
            label: 'Tambah Karyawan',
            onClick: handleCreate,
            icon: Plus,
            variant: 'default',
          },
        ]
      : undefined,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Kelola data karyawan dalam sistem
          </p>
        </div>
      </div>

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
            onFiltersChange={setFilters}
            onResetFilters={() => {
              setFilters({});
              setSearchValue('');
            }}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <EmployeeFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        employee={selectedEmployee}
        onSuccess={fetchData}
      />

      <EmployeeDetailDialog
        employeeId={selectedEmployeeId}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus Karyawan"
        description={`Apakah Anda yakin ingin menghapus karyawan "${selectedEmployee?.fullName}"? Tindakan ini tidak dapat dibatalkan.`}
      />
    </div>
  );
}