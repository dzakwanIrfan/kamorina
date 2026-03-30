'use client';

import { useState, useEffect, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Plus, Download, Wallet, HeartHandshake } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTableAdvanced } from '@/components/data-table/data-table-advanced';
import { LoanTypeBadge } from '@/components/loan/loan-type-badge';

import { useAuthStore } from '@/store/auth.store';
import { loanService } from '@/services/loan.service';
import { socialFundService } from '@/services/social-fund.service';
import { handleApiError } from '@/lib/axios';
import { LoanApplication, LoanType, QueryLoanParams } from '@/types/loan.types';
import { PaginatedResponse } from '@/types/pagination.types';
import { DataTableConfig } from '@/types/data-table.types';
import { statusMap } from '@/lib/loan-constants';
import { formatCurrency } from '@/lib/loan-utils';

const DEFAULT_QUERY_PARAMS: QueryLoanParams = {
  page: 1,
  limit: 10,
  search: '',
  sortOrder: 'desc',
  loanType: LoanType.EXCESS_LOAN,
};

export default function ExcessLoanPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<PaginatedResponse<LoanApplication>>({
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
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [queryParams, setQueryParams] = useState<QueryLoanParams>(DEFAULT_QUERY_PARAMS);

  const canCreate = user?.roles?.some((role) =>
    ['ketua', 'divisi_simpan_pinjam'].includes(role),
  );

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [balanceRes, listRes] = await Promise.all([
        socialFundService.getBalance(),
        loanService.getAllLoans(queryParams),
      ]);
      setCurrentBalance(balanceRes.currentBalance);
      setData(listRes);
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

  const handleResetFilters = () => {
    setQueryParams(DEFAULT_QUERY_PARAMS);
  };

  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (limit: number) => {
    setQueryParams((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    setQueryParams((prev) => ({
      ...prev,
      startDate: range.from?.toISOString(),
      endDate: range.to?.toISOString(),
      page: 1,
    }));
  };

  const handleCreate = () => {
    router.push('/dashboard/social-fund/excess-loan/create');
  };

  const handleExport = (selectedRows: LoanApplication[]) => {
    const dataToExport = selectedRows.length > 0 ? selectedRows : data.data;

    const csv = [
      ['No. Pinjaman', 'Tanggal', 'Anggota', 'NIK', 'Jumlah', 'Tenor', 'Cicilan/Bulan', 'Status', 'Tujuan'],
      ...dataToExport.map((item) => [
        item.loanNumber,
        format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm'),
        item.user?.employee?.fullName || '-',
        item.user?.nik || '-',
        item.loanAmount,
        `${item.loanTenor} bulan`,
        item.monthlyInstallment || 0,
        statusMap[item.status]?.label || item.status,
        `"${item.loanPurpose}"`,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pinjaman-excess-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`Exported ${dataToExport.length} data`);
  };

  const tableConfig: DataTableConfig<LoanApplication> = {
    searchable: true,
    searchPlaceholder: 'Cari nama anggota atau no. pinjaman...',
    filterable: false,
    dateRangeFilter: true,
    selectable: false,
    bulkActions: [
      {
        label: 'Export',
        icon: Download,
        variant: 'outline',
        onClick: handleExport,
      },
    ],
    toolbarActions: canCreate
      ? [{ label: 'Buat Pinjaman Excess', icon: Plus, onClick: handleCreate }]
      : [],
  };

  const columns: ColumnDef<LoanApplication>[] = [
    {
      accessorKey: 'loanNumber',
      header: 'No. Pinjaman',
      cell: ({ row }) => (
        <span className="text-sm font-mono">{row.original.loanNumber}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Tanggal',
      cell: ({ row }) => (
        <span className="text-sm">
          {format(new Date(row.original.createdAt), 'dd MMM yyyy', {
            locale: localeId,
          })}
        </span>
      ),
    },
    {
      accessorKey: 'user',
      header: 'Anggota',
      cell: ({ row }) => {
        const member = row.original.user;
        if (!member) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{member.employee?.fullName || member.name}</span>
            <span className="text-xs text-muted-foreground">
              {member.nik || '-'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'loanAmount',
      header: 'Jumlah',
      cell: ({ row }) => (
        <span className="font-semibold">
          {formatCurrency(row.original.loanAmount)}
        </span>
      ),
    },
    {
      accessorKey: 'loanTenor',
      header: 'Tenor',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.loanTenor} bulan</span>
      ),
    },
    {
      accessorKey: 'monthlyInstallment',
      header: 'Cicilan/Bulan',
      cell: ({ row }) => (
        <span className="text-sm">
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
        if (!status) return row.original.status;
        return (
          <Badge variant={status.variant}>{status.label}</Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pinjaman Excess</h1>
          <p className="text-muted-foreground">
            Pinjaman tanpa bunga dari dana sosial koperasi
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardDescription>Saldo Dana Sosial</CardDescription>
              <CardTitle className="text-2xl">
                {formatCurrency(currentBalance)}
              </CardTitle>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950/30">
              <HeartHandshake className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <CardDescription>Total Pinjaman Excess</CardDescription>
              <CardTitle className="text-2xl">{data.meta.total} pinjaman</CardTitle>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pinjaman Excess</CardTitle>
          <CardDescription>
            Total {data.meta.total} pinjaman tercatat
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
            onDateRangeChange={handleDateRangeChange}
            onResetFilters={handleResetFilters}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
