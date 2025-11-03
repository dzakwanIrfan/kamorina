'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Eye, CheckCircle2, XCircle, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';

import { DataTableAdvanced } from '@/components/data-table/data-table-advanced';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApplicationDetailDialog } from '@/components/member-application/application-detail-dialog';
import { BulkActionDialog } from '@/components/member-application/bulk-action-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

import { memberApplicationService } from '@/services/member-application.service';
import { useAuthStore } from '@/store/auth.store';
import { usePermissions } from '@/hooks/use-permission';
import {
  MemberApplication,
  ApplicationStatus,
  ApprovalStep,
  ApprovalDecision,
} from '@/types/member-application.types';
import { DataTableConfig } from '@/types/data-table.types';

const statusMap = {
  [ApplicationStatus.UNDER_REVIEW]: { label: 'Under Review', variant: 'default' as const, icon: Clock },
  [ApplicationStatus.APPROVED]: { label: 'Approved', variant: 'default' as const, icon: CheckCircle2 },
  [ApplicationStatus.REJECTED]: { label: 'Rejected', variant: 'destructive' as const, icon: XCircle },
};

const stepMap = {
  [ApprovalStep.DIVISI_SIMPAN_PINJAM]: 'Divisi Simpan Pinjam',
  [ApprovalStep.KETUA]: 'Ketua',
};

export default function MemberApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { hasRole } = usePermissions();

  const [data, setData] = useState<MemberApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<MemberApplication | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Date range state
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  // Pagination state
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Get default filter based on user role
  const getDefaultStepFilter = () => {
    if (hasRole('ketua')) return ApprovalStep.KETUA;
    if (hasRole('divisi_simpan_pinjam')) return ApprovalStep.DIVISI_SIMPAN_PINJAM;
    return undefined; // Pengawas and Payroll see all
  };

  const getDefaultStatusFilter = () => {
    if (hasRole('pengawas') || hasRole('payroll')) {
      return ApplicationStatus.APPROVED;
    }
    return undefined;
  };

  const [filters, setFilters] = useState<Record<string, any>>({});
  const [searchValue, setSearchValue] = useState('');

  // Initialize filters on mount
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
  }, []); // Only run on mount

  // Check if user can approve
  const canApprove = hasRole('ketua') || hasRole('divisi_simpan_pinjam');
  const canViewOnly = hasRole('pengawas') || hasRole('payroll');

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

      const response = await memberApplicationService.getApplications(params);
      setData(response.data);
      setMeta(response.meta);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when filters are initialized and when dependencies change
  useEffect(() => {
    if (isInitialized) {
      fetchData();
    }
  }, [meta.page, meta.limit, searchValue, filters, dateRange, isInitialized]);

  // Update URL when filters change
  useEffect(() => {
    if (!isInitialized) return;
    
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.step) params.set('step', filters.step);
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.replace(newUrl, { scroll: false });
  }, [filters, router, isInitialized]);

  const handleViewDetail = (application: MemberApplication) => {
    setSelectedApplication(application);
    setDetailDialogOpen(true);
  };

  const handleBulkAction = async (decision: ApprovalDecision, notes?: string) => {
    try {
      const result = await memberApplicationService.bulkProcessApproval({
        applicationIds: selectedIds,
        decision,
        notes,
      });

      toast.success(result.message);
      
      if (result.results.failed.length > 0) {
        toast.warning(`${result.results.failed.length} pengajuan gagal diproses`);
      }

      setSelectedIds([]);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memproses pengajuan');
      throw error;
    }
  };

  const handleFiltersChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setMeta((prev) => ({ ...prev, page: 1 })); // Reset to page 1 when filters change
  };

  const handleResetFilters = () => {
    // Reset to default filters based on role
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

  const columns: ColumnDef<MemberApplication>[] = useMemo(
    () => [
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
        accessorKey: 'user.email',
        header: 'Email',
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.user?.email}
          </span>
        ),
      },
      {
        accessorKey: 'user.department.departmentName',
        header: 'Department',
        cell: ({ row }) => row.original.user?.employee.department?.departmentName || '-',
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
            <Badge variant="outline">
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

  const tableConfig: DataTableConfig<MemberApplication> = {
    searchable: true,
    searchPlaceholder: 'Cari berdasarkan nama, email, NIK, atau no. karyawan...',
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
          { label: 'Under Review', value: ApplicationStatus.UNDER_REVIEW },
          { label: 'Approved', value: ApplicationStatus.APPROVED },
          { label: 'Rejected', value: ApplicationStatus.REJECTED },
        ],
      },
      {
        id: 'step',
        label: 'Step',
        type: 'select',
        placeholder: 'Semua Step',
        options: [
          { label: 'Semua Step', value: 'all' },
          { label: 'Divisi Simpan Pinjam', value: ApprovalStep.DIVISI_SIMPAN_PINJAM },
          { label: 'Ketua', value: ApprovalStep.KETUA },
        ],
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Member Applications</h1>
          <p className="text-muted-foreground">
            Kelola pengajuan keanggotaan koperasi
          </p>
        </div>
      </div>

      {/* Date Range Picker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Filter Tanggal Pengajuan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
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

      <ApplicationDetailDialog
        application={selectedApplication}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onSuccess={fetchData}
        canApprove={
          canApprove &&
          selectedApplication?.status === ApplicationStatus.UNDER_REVIEW &&
          selectedApplication?.currentStep !== null
        }
      />

      <BulkActionDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        selectedCount={selectedIds.length}
        onConfirm={handleBulkAction}
      />
    </div>
  );
}