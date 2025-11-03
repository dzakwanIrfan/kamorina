'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Plus, Eye, Pencil, Trash2, Power, PowerOff, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { DataTableAdvanced } from '@/components/data-table/data-table-advanced';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmployeeFormDialog } from '@/components/employees/employee-form-dialog';
import { EmployeeDetailDialog } from '@/components/employees/employee-detail-dialog';
import { EmployeeImportDialog } from '@/components/employees/employee-import-dialog';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ColumnActions } from '@/components/data-table/column-actions';

import { employeeService } from '@/services/employee.service';
import { departmentService } from '@/services/department.service';
import { golonganService } from '@/services/golongan.service';
import { usePermissions } from '@/hooks/use-permission';
import { Employee, EmployeeType } from '@/types/employee.types';
import { Department } from '@/types/department.types';
import { Golongan } from '@/types/golongan.types';
import { DataTableConfig } from '@/types/data-table.types';

const employeeTypeLabels: Record<EmployeeType, string> = {
  [EmployeeType.TETAP]: 'Pegawai Tetap',
  [EmployeeType.KONTRAK]: 'Kontrak',
};

const employeeTypeBadgeVariant: Record<EmployeeType, 'default' | 'secondary' | 'outline'> = {
  [EmployeeType.TETAP]: 'default',
  [EmployeeType.KONTRAK]: 'secondary',
};

export default function EmployeesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasRole } = usePermissions();

  const [data, setData] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [golongans, setGolongans] = useState<Golongan[]>([]);

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
  const canExport = hasRole('ketua') || hasRole('divisi_simpan_pinjam') || hasRole('pengawas') || hasRole('bendahara') || hasRole('payroll');
  const canImport = hasRole('ketua') || hasRole('divisi_simpan_pinjam') || hasRole('pengawas');

  useEffect(() => {
    fetchDepartments();
    fetchGolongans();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getAll({ limit: 100 });
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchGolongans = async () => {
    try {
      const response = await golonganService.getAll({ limit: 100 });
      setGolongans(response.data);
    } catch (error) {
      console.error('Failed to fetch golongans:', error);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const params: any = {
        page: meta.page,
        limit: meta.limit,
        search: searchValue || undefined,
        isActive: filters.isActive !== undefined ? filters.isActive === 'true' : undefined,
        departmentId: filters.departmentId && filters.departmentId !== 'all' ? filters.departmentId : undefined,
        golonganId: filters.golonganId && filters.golonganId !== 'all' ? filters.golonganId : undefined,
        employeeType: filters.employeeType && filters.employeeType !== 'all' ? filters.employeeType : undefined,
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

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const params: any = {
        search: searchValue || undefined,
        isActive: filters.isActive !== undefined ? filters.isActive === 'true' : undefined,
        departmentId: filters.departmentId && filters.departmentId !== 'all' ? filters.departmentId : undefined,
        golonganId: filters.golonganId && filters.golonganId !== 'all' ? filters.golonganId : undefined,
        employeeType: filters.employeeType && filters.employeeType !== 'all' ? filters.employeeType : undefined,
      };

      const blob = await employeeService.exportToCSV(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employees-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Data berhasil diekspor');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengekspor data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = () => {
    setImportDialogOpen(true);
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
        accessorKey: 'department.departmentName',
        header: 'Department',
        cell: ({ row }) => row.original.department?.departmentName || '-',
      },
      {
        accessorKey: 'golongan.golonganName',
        header: 'Golongan',
        cell: ({ row }) => row.original.golongan?.golonganName || '-',
      },
      {
        accessorKey: 'employeeType',
        header: 'Tipe',
        cell: ({ row }) => (
          <Badge variant={employeeTypeBadgeVariant[row.original.employeeType]}>
            {employeeTypeLabels[row.original.employeeType]}
          </Badge>
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
        accessorKey: '_count.users',
        header: 'User',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original._count?.users || 0}
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

  const toolbarActions = [];
  
  if (canImport) {
    toolbarActions.push({
      label: 'Import',
      onClick: handleImport,
      icon: Upload,
      variant: 'outline' as const,
    });
  }

  if (canExport) {
    toolbarActions.push({
      label: 'Export',
      onClick: handleExport,
      icon: Download,
      variant: 'outline' as const,
      disabled: isExporting,
    });
  }

  if (canCreate) {
    toolbarActions.push({
      label: 'Tambah Karyawan',
      onClick: handleCreate,
      icon: Plus,
      variant: 'default' as const,
    });
  }

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
      {
        id: 'departmentId',
        label: 'Department',
        type: 'select',
        placeholder: 'Semua Department',
        options: [
          { label: 'Semua Department', value: 'all' },
          ...departments.map(dept => ({
            label: dept.departmentName,
            value: dept.id,
          })),
        ],
      },
      {
        id: 'golonganId',
        label: 'Golongan',
        type: 'select',
        placeholder: 'Semua Golongan',
        options: [
          { label: 'Semua Golongan', value: 'all' },
          ...golongans.map(gol => ({
            label: gol.golonganName,
            value: gol.id,
          })),
        ],
      },
      {
        id: 'employeeType',
        label: 'Tipe Karyawan',
        type: 'select',
        placeholder: 'Semua Tipe',
        options: [
          { label: 'Semua Tipe', value: 'all' },
          { label: 'Pegawai Tetap', value: EmployeeType.TETAP },
          { label: 'Kontrak', value: EmployeeType.KONTRAK },
        ],
      },
    ],
    toolbarActions: toolbarActions.length > 0 ? toolbarActions : undefined,
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

      <EmployeeImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={fetchData}
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