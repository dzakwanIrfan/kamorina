'use client';

import { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Eye, CheckCircle2, XCircle, Clock, Plus, PiggyBank, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { DataTableAdvanced } from '@/components/data-table/data-table-advanced';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DepositDetailDialog } from '@/components/deposit/deposit-detail-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

import { depositService } from '@/services/deposit.service';
import { DepositApplication, DepositStatus } from '@/types/deposit.types';
import { DataTableConfig } from '@/types/data-table.types';
import { useBukuTabungan } from '@/hooks/use-buku-tabungan';

const statusMap = {
  [DepositStatus.DRAFT]: { label: 'Draft', variant: 'secondary' as const, icon: Clock },
  [DepositStatus.SUBMITTED]: { label: 'Submitted', variant: 'default' as const, icon: Clock },
  [DepositStatus.UNDER_REVIEW_DSP]: { label: 'Review DSP', variant: 'default' as const, icon: Clock },
  [DepositStatus. UNDER_REVIEW_KETUA]: { label: 'Review Ketua', variant: 'default' as const, icon: Clock },
  [DepositStatus.APPROVED]: { label: 'Disetujui', variant: 'default' as const, icon: CheckCircle2 },
  [DepositStatus.ACTIVE]: { label: 'Aktif', variant: 'default' as const, icon: CheckCircle2 },
  [DepositStatus.COMPLETED]: { label: 'Selesai', variant: 'default' as const, icon: CheckCircle2 },
  [DepositStatus.REJECTED]: { label: 'Ditolak', variant: 'destructive' as const, icon: XCircle },
  [DepositStatus.CANCELLED]: { label: 'Dibatalkan', variant: 'destructive' as const, icon: XCircle },
};

export function MyDeposits() {
  const router = useRouter();
  const [data, setData] = useState<DepositApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositApplication | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchData();
  }, [meta.page, meta.limit, searchValue, filters]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await depositService.getMyDeposits({
        page: meta.page,
        limit: meta.limit,
        search: searchValue || undefined,
        status: filters. status || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setData(response.data);
      setMeta(response.meta);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleViewDetail = (deposit: DepositApplication) => {
    setSelectedDeposit(deposit);
    setDetailDialogOpen(true);
  };

  const handleCreateNew = () => {
    router. push('/dashboard/deposits/create');
  };

  const handleRequestChange = (depositId: string) => {
    router.push(`/dashboard/deposit-changes/create/${depositId}`);
  };

  const handleViewChangeHistory = () => {
    router.push('/dashboard/deposit-changes');
  };

  // Check if deposit can be changed
  const canChangeDeposit = (status: DepositStatus) => {
    return status === DepositStatus.APPROVED || status === DepositStatus. ACTIVE;
  };

  const columns: ColumnDef<DepositApplication>[] = useMemo(
    () => [
      {
        accessorKey: 'depositNumber',
        header: 'No.  Deposito',
        cell: ({ row }) => (
          <span className="font-mono font-medium text-sm">
            {row.original.depositNumber}
          </span>
        ),
      },
      {
        accessorKey: 'amountValue',
        header: 'Jumlah Deposito',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <span className="font-semibold text-primary">
              {formatCurrency(row.original.amountValue)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'tenorMonths',
        header: 'Tenor',
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.tenorMonths} Bulan
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
        accessorKey: 'maturityDate',
        header: 'Jatuh Tempo',
        cell: ({ row }) => {
          if (!row.original.maturityDate) return '-';
          return (
            <span className="text-sm">
              {format(new Date(row.original.maturityDate), 'dd MMM yyyy', {
                locale: id,
              })}
            </span>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewDetail(row.original)}>
                <Eye className="h-4 w-4 mr-2" />
                Lihat Detail
              </DropdownMenuItem>
              {canChangeDeposit(row. original.status) && (
                <DropdownMenuItem onClick={() => handleRequestChange(row.original. id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Ajukan Perubahan
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  const tableConfig: DataTableConfig<DepositApplication> = {
    searchable: true,
    searchPlaceholder: 'Cari berdasarkan nomor deposito.. .',
    filterable: true,
    selectable: false,
    filterFields: [
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        placeholder: 'Semua Status',
        options: [
          { label: 'Semua Status', value: 'all' },
          { label: 'Draft', value: DepositStatus.DRAFT },
          { label: 'Submitted', value: DepositStatus. SUBMITTED },
          { label: 'Disetujui', value: DepositStatus.APPROVED },
          { label: 'Aktif', value: DepositStatus. ACTIVE },
          { label: 'Selesai', value: DepositStatus.COMPLETED },
          { label: 'Ditolak', value: DepositStatus.REJECTED },
        ],
      },
    ],
    toolbarActions: [
      {
        label: 'Riwayat Perubahan',
        icon: Edit,
        onClick: handleViewChangeHistory,
        variant: 'outline',
      },
      {
        label: 'Ajukan Deposito Baru',
        icon: Plus,
        onClick: handleCreateNew,
        variant: 'default',
      },
    ],
  };

  // Calculate total active deposits
  const totalActiveDeposits = data
    .filter((d) => d.status === DepositStatus.ACTIVE)
    .reduce((sum, d) => sum + Number(d.amountValue), 0);

  const { tabungan } = useBukuTabungan({
    includeTransactionSummary: true,
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposito</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meta.total}</div>
            <p className="text-xs text-muted-foreground">
              Semua pengajuan deposito
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deposito Aktif</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalActiveDeposits)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total dana yang didepositokan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tabungan</CardTitle>
            <PiggyBank className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(Number(tabungan?.summary.saldoSukarela))}
            </div>
            <p className="text-xs text-muted-foreground">
              Total saldo yang bisa diambil
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Deposito Saya</CardTitle>
          <CardDescription>
            Kelola dan pantau semua deposito Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTableAdvanced
            columns={columns}
            data={data}
            meta={meta}
            config={tableConfig}
            onPageChange={(page) => setMeta((prev) => ({ ...prev, page }))}
            onPageSizeChange={(limit) => setMeta((prev) => ({ ...prev, limit, page: 1 }))}
            onSearch={setSearchValue}
            onFiltersChange={setFilters}
            onResetFilters={() => setFilters({})}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <DepositDetailDialog
        deposit={selectedDeposit}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onSuccess={fetchData}
        canApprove={false}
      />
    </div>
  );
}