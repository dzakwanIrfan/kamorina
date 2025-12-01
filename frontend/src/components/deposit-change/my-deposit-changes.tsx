'use client';

import { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Eye, CheckCircle2, XCircle, Clock, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';

import { DataTableAdvanced } from '@/components/data-table/data-table-advanced';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DepositChangeDetailDialog } from './deposit-change-detail-dialog';

import { depositChangeService } from '@/services/deposit-change.service';
import {
  DepositChangeRequest,
  DepositChangeStatus,
  DepositChangeType,
} from '@/types/deposit-change.types';
import { DataTableConfig } from '@/types/data-table.types';
import {
  changeStatusMap,
  changeTypeMap,
  formatCurrency,
} from '@/lib/deposit-change-constants';

export function MyDepositChanges() {
  const [data, setData] = useState<DepositChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChange, setSelectedChange] = useState<DepositChangeRequest | null>(null);
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
      const response = await depositChangeService.getMyChangeRequests({
        page: meta.page,
        limit: meta.limit,
        search: searchValue || undefined,
        status: filters. status || undefined,
        changeType: filters.changeType || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setData(response.data);
      setMeta(response. meta);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetail = async (changeRequest: DepositChangeRequest) => {
    try {
      const fullDetail = await depositChangeService.getMyChangeRequestById(changeRequest.id);
      setSelectedChange(fullDetail);
      setDetailDialogOpen(true);
    } catch (error) {
      setSelectedChange(changeRequest);
      setDetailDialogOpen(true);
    }
  };

  const columns: ColumnDef<DepositChangeRequest>[] = useMemo(
    () => [
      {
        accessorKey: 'changeNumber',
        header: 'No.  Perubahan',
        cell: ({ row }) => (
          <span className="font-mono font-medium text-sm">
            {row.original.changeNumber}
          </span>
        ),
      },
      {
        accessorKey: 'depositApplication.depositNumber',
        header: 'No. Deposito',
        cell: ({ row }) => (
          <span className="font-mono text-sm text-muted-foreground">
            {row.original.depositApplication?. depositNumber || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'changeType',
        header: 'Jenis Perubahan',
        cell: ({ row }) => {
          const type = changeTypeMap[row.original.changeType];
          const TypeIcon = type?. icon || ArrowUpDown;
          return (
            <Badge variant="outline" className={type?.color}>
              <TypeIcon className="h-3 w-3 mr-1" />
              {type?.label || row.original.changeType}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'currentAmountValue',
        header: 'Jumlah Sebelum',
        cell: ({ row }) => (
          <span className="text-sm">
            {formatCurrency(row.original.currentAmountValue)}
          </span>
        ),
      },
      {
        accessorKey: 'newAmountValue',
        header: 'Jumlah Sesudah',
        cell: ({ row }) => (
          <span className="text-sm font-medium text-primary">
            {formatCurrency(row.original.newAmountValue)}
          </span>
        ),
      },
      {
        accessorKey: 'adminFee',
        header: 'Biaya Admin',
        cell: ({ row }) => (
          <span className="text-sm text-orange-600">
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
              {status?. label || row.original.status}
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
              {format(new Date(row.original.submittedAt), 'dd MMM yyyy', { locale: id })}
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

  const tableConfig: DataTableConfig<DepositChangeRequest> = {
    searchable: true,
    searchPlaceholder: 'Cari berdasarkan nomor perubahan atau deposito...',
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
          { label: 'Draft', value: DepositChangeStatus.DRAFT },
          { label: 'Submitted', value: DepositChangeStatus.SUBMITTED },
          { label: 'Disetujui', value: DepositChangeStatus.APPROVED },
          { label: 'Ditolak', value: DepositChangeStatus.REJECTED },
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
  };

  // Summary stats
  const pendingCount = data.filter(
    (d) =>
      d.status === DepositChangeStatus.SUBMITTED ||
      d.status === DepositChangeStatus.UNDER_REVIEW_DSP ||
      d.status === DepositChangeStatus.UNDER_REVIEW_KETUA
  ).length;

  const approvedCount = data.filter((d) => d.status === DepositChangeStatus.APPROVED). length;
  const rejectedCount = data.filter((d) => d.status === DepositChangeStatus.REJECTED).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menunggu Persetujuan</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Pengajuan sedang diproses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disetujui</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Perubahan berhasil</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ditolak</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">Pengajuan ditolak</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Perubahan Deposito</CardTitle>
          <CardDescription>Semua pengajuan perubahan deposito Anda</CardDescription>
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

      <DepositChangeDetailDialog
        changeRequest={selectedChange}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onSuccess={fetchData}
        canApprove={false}
      />
    </div>
  );
}