'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Eye, CheckCircle2, XCircle, Clock, Calendar, Download, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

import { DataTableAdvanced } from '@/components/data-table/data-table-advanced';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

import { DepositChangeDetailDialog } from './deposit-change-detail-dialog';
import { BulkApproveChangeDialog } from './bulk-approve-change-dialog';
import { depositChangeService } from '@/services/deposit-change.service';
import { usePermissions } from '@/hooks/use-permission';
import {
  DepositChangeRequest,
  DepositChangeStatus,
  DepositChangeApprovalStep,
  DepositChangeApprovalDecision,
  DepositChangeType,
} from '@/types/deposit-change.types';
import { DataTableConfig } from '@/types/data-table.types';
import {
  changeStatusMap,
  changeStepMap,
  changeTypeMap,
  formatCurrency,
} from '@/lib/deposit-change-constants';

interface DepositChangeListProps {
  defaultStatus?: DepositChangeStatus;
  defaultStep?: DepositChangeApprovalStep;
}

export function DepositChangeList({ defaultStatus, defaultStep }: DepositChangeListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasRole } = usePermissions();

  const [data, setData] = useState<DepositChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChange, setSelectedChange] = useState<DepositChangeRequest | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const getDefaultStepFilter = () => {
    if (defaultStep) return defaultStep;
    if (hasRole('ketua')) return DepositChangeApprovalStep.KETUA;
    if (hasRole('divisi_simpan_pinjam')) return DepositChangeApprovalStep.DIVISI_SIMPAN_PINJAM;
    return undefined;
  };

  const getDefaultStatusFilter = () => {
    if (defaultStatus) return defaultStatus;
    if (hasRole('ketua')) return DepositChangeStatus.UNDER_REVIEW_KETUA;
    return DepositChangeStatus.SUBMITTED;
  };

  const [filters, setFilters] = useState<Record<string, any>>({});
  const [searchValue, setSearchValue] = useState('');

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
  }, []);

  const canApprove = hasRole('ketua') || hasRole('divisi_simpan_pinjam');

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const params: any = {
        page: meta. page,
        limit: meta. limit,
        search: searchValue || undefined,
        status: filters.status || undefined,
        step: filters.step || undefined,
        changeType: filters.changeType || undefined,
        sortBy: 'submittedAt',
        sortOrder: 'desc',
      };

      if (dateRange.from) {
        params.startDate = format(dateRange.from, 'yyyy-MM-dd');
      }
      if (dateRange.to) {
        params.endDate = format(dateRange.to, 'yyyy-MM-dd');
      }

      const response = await depositChangeService.getAllChangeRequests(params);
      setData(response.data);
      setMeta(response.meta);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isInitialized) {
      fetchData();
    }
  }, [meta.page, meta.limit, searchValue, filters, dateRange, isInitialized]);

  useEffect(() => {
    if (! isInitialized) return;

    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.step) params.set('step', filters.step);

    const newUrl = params.toString() ?  `?${params.toString()}` : '';
    router.replace(newUrl, { scroll: false });
  }, [filters, router, isInitialized]);

  const handleViewDetail = async (changeRequest: DepositChangeRequest) => {
    try {
      const fullDetail = await depositChangeService.getChangeRequestById(changeRequest.id);
      setSelectedChange(fullDetail);
      setDetailDialogOpen(true);
    } catch (error) {
      setSelectedChange(changeRequest);
      setDetailDialogOpen(true);
    }
  };

  const handleBulkAction = async (decision: DepositChangeApprovalDecision, notes?: string) => {
    try {
      const result = await depositChangeService.bulkProcessApproval({
        changeRequestIds: selectedIds,
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
    setMeta((prev) => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
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

  const handleExport = () => {
    try {
      const exportData = data.map((item) => ({
        'No.  Perubahan': item.changeNumber,
        'No. Deposito': item.depositApplication?.depositNumber || '-',
        'Nama': item.user?.name || '-',
        'No. Karyawan': item.user?.employee?.employeeNumber || '-',
        'Department': item.user?.employee?.department?.departmentName || '-',
        'Jenis Perubahan': changeTypeMap[item.changeType]?.label || item.changeType,
        'Jumlah Sebelum': item.currentAmountValue,
        'Jumlah Sesudah': item.newAmountValue,
        'Tenor Sebelum (Bulan)': item.currentTenorMonths,
        'Tenor Sesudah (Bulan)': item.newTenorMonths,
        'Biaya Admin': item.adminFee,
        'Status': changeStatusMap[item.status]?.label || item.status,
        'Step Saat Ini': item.currentStep ?  changeStepMap[item.currentStep] : '-',
        'Tanggal Submit': item.submittedAt
          ? format(new Date(item. submittedAt), 'dd/MM/yyyy HH:mm', { locale: id })
          : '-',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Perubahan Deposito');

      const fileName = `perubahan_deposito_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success('Data berhasil diekspor');
    } catch (error) {
      toast.error('Gagal mengekspor data');
    }
  };

  const columns: ColumnDef<DepositChangeRequest>[] = useMemo(
    () => [
      {
        accessorKey: 'changeNumber',
        header: 'No. Perubahan',
        cell: ({ row }) => (
          <span className="font-mono font-medium text-sm">{row.original. changeNumber}</span>
        ),
      },
      {
        accessorKey: 'user.employee.employeeNumber',
        header: 'No. Karyawan',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.user?.employee?.employeeNumber || '-'}</span>
        ),
      },
      {
        accessorKey: 'user. name',
        header: 'Nama',
        cell: ({ row }) => row.original.user?.name || '-',
      },
      {
        accessorKey: 'changeType',
        header: 'Jenis',
        cell: ({ row }) => {
          const type = changeTypeMap[row.original.changeType];
          const TypeIcon = type?. icon || ArrowUpDown;
          return (
            <Badge variant="outline" className={`text-xs ${type?.color}`}>
              <TypeIcon className="h-3 w-3 mr-1" />
              {type?.label || row.original.changeType}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'currentAmountValue',
        header: 'Sebelum',
        cell: ({ row }) => (
          <div className="text-sm">
            <div>{formatCurrency(row.original.currentAmountValue)}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.currentTenorMonths} bln
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'newAmountValue',
        header: 'Sesudah',
        cell: ({ row }) => (
          <div className="text-sm font-medium text-primary">
            <div>{formatCurrency(row. original.newAmountValue)}</div>
            <div className="text-xs">{row.original.newTenorMonths} bln</div>
          </div>
        ),
      },
      {
        accessorKey: 'adminFee',
        header: 'Biaya Admin',
        cell: ({ row }) => (
          <span className="text-sm text-orange-600 font-medium">
            {formatCurrency(row.original.adminFee)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = changeStatusMap[row.original.status];
          const StatusIcon = status?.icon || Clock;
          return (
            <Badge variant={status?.variant} className="flex items-center gap-1 w-fit">
              <StatusIcon className="h-3 w-3" />
              {status?. label}
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
            <Badge variant="outline" className="text-xs">
              {changeStepMap[row. original.currentStep]}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'submittedAt',
        header: 'Tanggal',
        cell: ({ row }) => {
          if (!row.original. submittedAt) return '-';
          return (
            <span className="text-sm">
              {format(new Date(row.original.submittedAt), 'dd MMM yyyy', { locale: id })}
            </span>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <Button variant="ghost" size="sm" onClick={() => handleViewDetail(row. original)}>
            <Eye className="h-4 w-4 mr-2" />
            Detail
          </Button>
        ),
      },
    ],
    []
  );

  const tableConfig: DataTableConfig<DepositChangeRequest> = {
    searchable: true,
    searchPlaceholder: 'Cari berdasarkan nama, email, no. perubahan...',
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
          { label: 'Submitted', value: DepositChangeStatus.SUBMITTED },
          { label: 'Review DSP', value: DepositChangeStatus.UNDER_REVIEW_DSP },
          { label: 'Review Ketua', value: DepositChangeStatus.UNDER_REVIEW_KETUA },
          { label: 'Disetujui', value: DepositChangeStatus.APPROVED },
          { label: 'Ditolak', value: DepositChangeStatus.REJECTED },
        ],
      },
      {
        id: 'step',
        label: 'Step Approval',
        type: 'select',
        placeholder: 'Semua Step',
        options: [
          { label: 'Semua Step', value: 'all' },
          { label: 'Divisi Simpan Pinjam', value: DepositChangeApprovalStep.DIVISI_SIMPAN_PINJAM },
          { label: 'Ketua', value: DepositChangeApprovalStep. KETUA },
        ],
      },
      {
        id: 'changeType',
        label: 'Jenis Perubahan',
        type: 'select',
        placeholder: 'Semua Jenis',
        options: [
          { label: 'Semua Jenis', value: 'all' },
          { label: 'Perubahan Jumlah', value: DepositChangeType.AMOUNT_CHANGE },
          { label: 'Perubahan Tenor', value: DepositChangeType.TENOR_CHANGE },
          { label: 'Keduanya', value: DepositChangeType.BOTH },
        ],
      },
    ],
    toolbarActions: [
      {
        label: 'Export',
        icon: Download,
        onClick: handleExport,
        variant: 'outline',
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
      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter Tanggal:</span>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'justify-start text-left font-normal',
                      !dateRange. from && 'text-muted-foreground'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.from
                      ? format(dateRange. from, 'dd MMM yyyy', { locale: id })
                      : 'Tanggal Mulai'}
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
                    size="sm"
                    className={cn(
                      'justify-start text-left font-normal',
                      !dateRange.to && 'text-muted-foreground'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange.to
                      ?  format(dateRange.to, 'dd MMM yyyy', { locale: id })
                      : 'Tanggal Akhir'}
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

              {(dateRange.from || dateRange. to) && (
                <Button variant="ghost" onClick={() => setDateRange({})} size="sm">
                  Clear
                </Button>
              )}
            </div>
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

      <DepositChangeDetailDialog
        changeRequest={selectedChange}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onSuccess={fetchData}
        canApprove={
          canApprove &&
          selectedChange?. status !== DepositChangeStatus.APPROVED &&
          selectedChange?.status !== DepositChangeStatus.REJECTED &&
          selectedChange?.currentStep !== null
        }
      />

      <BulkApproveChangeDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        selectedCount={selectedIds.length}
        onConfirm={handleBulkAction}
      />
    </div>
  );
}