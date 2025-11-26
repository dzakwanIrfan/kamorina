'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Eye, CheckCircle2, XCircle, Clock, Calendar, Download } from 'lucide-react';
import { toast } from 'sonner';

import { DataTableAdvanced } from '@/components/data-table/data-table-advanced';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoanDetailDialog } from '@/components/loan/loan-detail-dialog';
import { BulkActionDialog } from '@/components/loan/bulk-action-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

import { loanService } from '@/services/loan.service';
import { useAuthStore } from '@/store/auth.store';
import { usePermissions } from '@/hooks/use-permission';
import {
  LoanApplication,
  LoanStatus,
  LoanApprovalStep,
  LoanApprovalDecision,
  LoanType,
} from '@/types/loan.types';
import { DataTableConfig } from '@/types/data-table.types';
import * as XLSX from 'xlsx';
import { getLoanTypeLabel } from '@/lib/loan-utils';

const statusMap = {
  [LoanStatus.DRAFT]: { label: 'Draft', variant: 'secondary' as const, icon: Clock },
  [LoanStatus.SUBMITTED]: { label: 'Submitted', variant: 'default' as const, icon: Clock },
  [LoanStatus.UNDER_REVIEW_DSP]: { label: 'Review DSP', variant: 'default' as const, icon: Clock },
  [LoanStatus.UNDER_REVIEW_KETUA]: { label: 'Review Ketua', variant: 'default' as const, icon: Clock },
  [LoanStatus.UNDER_REVIEW_PENGAWAS]: { label: 'Review Pengawas', variant: 'default' as const, icon: Clock },
  [LoanStatus.APPROVED_PENDING_DISBURSEMENT]: { label: 'Menunggu Pencairan', variant: 'default' as const, icon: Clock },
  [LoanStatus.DISBURSEMENT_IN_PROGRESS]: { label: 'Proses Pencairan', variant: 'default' as const, icon: Clock },
  [LoanStatus.PENDING_AUTHORIZATION]: { label: 'Menunggu Otorisasi', variant: 'default' as const, icon: Clock },
  [LoanStatus.DISBURSED]: { label: 'Telah Dicairkan', variant: 'default' as const, icon: CheckCircle2 },
  [LoanStatus.REJECTED]: { label: 'Ditolak', variant: 'destructive' as const, icon: XCircle },
  [LoanStatus.CANCELLED]: { label: 'Dibatalkan', variant: 'destructive' as const, icon: XCircle },
};

const stepMap = {
  [LoanApprovalStep.DIVISI_SIMPAN_PINJAM]: 'Divisi Simpan Pinjam',
  [LoanApprovalStep.KETUA]: 'Ketua',
  [LoanApprovalStep.PENGAWAS]: 'Pengawas',
};

interface LoanListProps {
  defaultStatus?: LoanStatus;
  defaultStep?: LoanApprovalStep;
}

export function LoanList({ defaultStatus, defaultStep }: LoanListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { hasRole } = usePermissions();

  const [data, setData] = useState<LoanApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);
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
    if (defaultStep) return defaultStep;
    if (hasRole('pengawas')) return LoanApprovalStep.PENGAWAS;
    if (hasRole('ketua')) return LoanApprovalStep.KETUA;
    if (hasRole('divisi_simpan_pinjam')) return LoanApprovalStep.DIVISI_SIMPAN_PINJAM;
    return undefined;
  };

  const getDefaultStatusFilter = () => {
    if (defaultStatus) return defaultStatus;
    if (hasRole('pengawas')) return LoanStatus.UNDER_REVIEW_PENGAWAS;
    if (hasRole('ketua')) return LoanStatus.UNDER_REVIEW_KETUA;
    if (hasRole('divisi_simpan_pinjam')) return LoanStatus.UNDER_REVIEW_DSP;
    return LoanStatus.SUBMITTED;
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
  }, []);

  // Check if user can approve
  const canApprove = hasRole('ketua') || hasRole('divisi_simpan_pinjam') || hasRole('pengawas');

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

      const response = await loanService.getAllLoans(params);
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
    if (!isInitialized) return;
    
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.step) params.set('step', filters.step);
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.replace(newUrl, { scroll: false });
  }, [filters, router, isInitialized]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleViewDetail = (loan: LoanApplication) => {
    setSelectedLoan(loan);
    setDetailDialogOpen(true);
  };

  const handleBulkAction = async (decision: LoanApprovalDecision, notes?: string) => {
    try {
      const result = await loanService.bulkProcessApproval({
        loanIds: selectedIds,
        decision,
        notes,
      });

      toast.success(result.message);
      
      if (result.results.failed.length > 0) {
        toast.warning(`${result.results.failed.length} pinjaman gagal diproses`);
      }

      setSelectedIds([]);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memproses pinjaman');
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

  // Update columns untuk menambahkan loan type
  const columns: ColumnDef<LoanApplication>[] = useMemo(
    () => [
      {
        accessorKey: 'loanNumber',
        header: 'No. Pinjaman',
        cell: ({ row }) => (
          <span className="font-mono font-medium text-sm">
            {row.original.loanNumber}
          </span>
        ),
      },
      {
        accessorKey: 'loanType',
        header: 'Jenis',
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            {getLoanTypeLabel(row.original.loanType)}
          </Badge>
        ),
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
        accessorKey: 'user.name',
        header: 'Nama',
        cell: ({ row }) => row.original.user?.name || '-',
      },
      {
        accessorKey: 'user.department.departmentName',
        header: 'Department',
        cell: ({ row }) => row.original.user?.employee.department?.departmentName || '-',
      },
      {
        accessorKey: 'loanAmount',
        header: 'Jumlah',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <span className="font-semibold text-primary">
              {formatCurrency(row.original.loanAmount)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'loanTenor',
        header: 'Tenor',
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.loanTenor} Bulan
          </span>
        ),
      },
      {
        accessorKey: 'monthlyInstallment',
        header: 'Cicilan/Bulan',
        cell: ({ row }) => (
          <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
            {row.original.monthlyInstallment 
              ? formatCurrency(row.original.monthlyInstallment)
              : '-'}
          </span>
        ),
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
            <Badge variant="outline" className="text-xs">
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

  // Update handleExport untuk include loan type
  const handleExport = () => {
    try {
      const exportData = data.map((loan) => ({
        'Nomor Pinjaman': loan.loanNumber,
        'Jenis Pinjaman': getLoanTypeLabel(loan.loanType),
        'Nama': loan.user?.name || '-',
        'No. Karyawan': loan.user?.employee.employeeNumber || '-',
        'Department': loan.user?.employee.department?.departmentName || '-',
        'Jumlah Pinjaman': loan.loanAmount,
        'Tenor (Bulan)': loan.loanTenor,
        'Bunga (%)': loan.interestRate || 0,
        'Cicilan/Bulan': loan.monthlyInstallment || 0,
        'Total Pembayaran': loan.totalRepayment || 0,
        'Status': statusMap[loan.status]?.label || loan.status,
        'Step Saat Ini': loan.currentStep ? stepMap[loan.currentStep] : '-',
        'Tanggal Submit': loan.submittedAt 
          ? format(new Date(loan.submittedAt), 'dd/MM/yyyy HH:mm', { locale: id })
          : '-',
        'Alasan Pinjaman': loan.loanPurpose,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Pinjaman');

      const fileName = `pinjaman_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success('Data berhasil diekspor');
    } catch (error) {
      toast.error('Gagal mengekspor data');
    }
  };

  // Update tableConfig untuk menambahkan filter loan type
  const tableConfig: DataTableConfig<LoanApplication> = {
    searchable: true,
    searchPlaceholder: 'Cari berdasarkan nama, email, no. pinjaman...',
    filterable: true,
    selectable: canApprove,
    filterFields: [
      {
        id: 'loanType',
        label: 'Jenis Pinjaman',
        type: 'select',
        placeholder: 'Semua Jenis',
        options: [
          { label: 'Semua Jenis', value: 'all' },
          { label: 'Peminjaman Uang', value: LoanType.CASH_LOAN },
          { label: 'Kredit Barang (Reimburse)', value: LoanType.GOODS_REIMBURSE },
          { label: 'Kredit Barang (Online)', value: LoanType.GOODS_ONLINE },
          { label: 'Kredit Barang (Handphone)', value: LoanType.GOODS_PHONE },
        ],
      },
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        placeholder: 'Semua Status',
        options: [
          { label: 'Semua Status', value: 'all' },
          { label: 'Submitted', value: LoanStatus.SUBMITTED },
          { label: 'Review DSP', value: LoanStatus.UNDER_REVIEW_DSP },
          { label: 'Review Ketua', value: LoanStatus.UNDER_REVIEW_KETUA },
          { label: 'Review Pengawas', value: LoanStatus.UNDER_REVIEW_PENGAWAS },
          { label: 'Menunggu Pencairan', value: LoanStatus.APPROVED_PENDING_DISBURSEMENT },
          { label: 'Proses Pencairan', value: LoanStatus.DISBURSEMENT_IN_PROGRESS },
          { label: 'Menunggu Otorisasi', value: LoanStatus.PENDING_AUTHORIZATION },
          { label: 'Telah Dicairkan', value: LoanStatus.DISBURSED },
          { label: 'Ditolak', value: LoanStatus.REJECTED },
        ],
      },
      {
        id: 'step',
        label: 'Step Approval',
        type: 'select',
        placeholder: 'Semua Step',
        options: [
          { label: 'Semua Step', value: 'all' },
          { label: 'Divisi Simpan Pinjam', value: LoanApprovalStep.DIVISI_SIMPAN_PINJAM },
          { label: 'Ketua', value: LoanApprovalStep.KETUA },
          { label: 'Pengawas', value: LoanApprovalStep.PENGAWAS },
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
      {/* Date Range Picker */}
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
                    size="sm"
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

      <LoanDetailDialog
        loan={selectedLoan}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onSuccess={fetchData}
        canApprove={
          canApprove &&
          selectedLoan?.status !== LoanStatus.DISBURSED &&
          selectedLoan?.status !== LoanStatus.REJECTED &&
          selectedLoan?.currentStep !== null
        }
        canRevise={hasRole('divisi_simpan_pinjam')} 
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