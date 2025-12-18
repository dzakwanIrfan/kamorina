'use client';

import { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Eye, CheckCircle2, Clock, Plus } from 'lucide-react';
import { FaRupiahSign } from "react-icons/fa6";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { DataTableAdvanced } from '@/components/data-table/data-table-advanced';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoanDetailDialog } from '@/components/loan/loan-detail-dialog';

import { loanService } from '@/services/loan.service';
import { LoanApplication, LoanStatus, LoanType } from '@/types/loan.types';
import { DataTableConfig } from '@/types/data-table.types';
import { statusMap } from '@/lib/loan-constants';
import { formatCurrency, getLoanTypeLabel } from '@/lib/loan-utils';

export function MyLoans() {
  const router = useRouter();
  const [data, setData] = useState<LoanApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);
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
      const response = await loanService.getMyLoans({
        page: meta.page,
        limit: meta.limit,
        search: searchValue || undefined,
        status: filters.status || undefined,
        loanType: filters.loanType || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setData(response.data);
      console.log("response", response.data)
      setMeta(response.meta);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetail = (loan: LoanApplication) => {
    setSelectedLoan(loan);
    setDetailDialogOpen(true);
  };

  const handleCreateNew = () => {
    router.push('/dashboard/loans/create');
  };

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
          <Badge variant="outline" className="text-xs">
            {getLoanTypeLabel(row.original.loanType)}
          </Badge>
        ),
      },
      {
        accessorKey: 'loanAmount',
        header: 'Jumlah',
        cell: ({ row }) => (
          <span className="font-semibold text-primary">
            {formatCurrency(row.original.loanAmount)}
          </span>
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
        accessorKey: 'submittedAt',
        header: 'Tanggal Pengajuan',
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

  const tableConfig: DataTableConfig<LoanApplication> = {
    searchable: true,
    searchPlaceholder: 'Cari berdasarkan nomor pinjaman...',
    filterable: true,
    selectable: false,
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
          { label: 'Draft', value: LoanStatus.DRAFT },
          { label: 'Submitted', value: LoanStatus.SUBMITTED },
          { label: 'Telah Dicairkan', value: LoanStatus.DISBURSED },
          { label: 'Ditolak', value: LoanStatus.REJECTED },
        ],
      },
    ],
    toolbarActions: [
      {
        label: 'Ajukan Pinjaman Baru',
        icon: Plus,
        onClick: handleCreateNew,
        variant: 'default',
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pinjaman</CardTitle>
            <FaRupiahSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meta.total}</div>
            <p className="text-xs text-muted-foreground">
              Semua pengajuan pinjaman
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pinjaman Aktif</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.filter((l) => l.status === LoanStatus.DISBURSED).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Pinjaman yang telah dicairkan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dalam Proses</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {data.filter((l) => 
                l.status !== LoanStatus.DISBURSED && 
                l.status !== LoanStatus.REJECTED &&
                l.status !== LoanStatus.DRAFT
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Menunggu approval
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pinjaman Saya</CardTitle>
          <CardDescription>
            Kelola dan pantau semua pengajuan pinjaman Anda
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

      <LoanDetailDialog
        loan={selectedLoan}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onSuccess={fetchData}
        canApprove={false}
      />
    </div>
  );
}