'use client';

import { useState, useEffect, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CheckCircle2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

import { DataTableAdvanced } from '@/components/data-table/data-table-advanced';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProcessDisbursementDialog } from '@/components/loan/process-disbursement-dialog';
import { BulkProcessDisbursementDialog } from '@/components/loan/bulk-process-disbursement-dialog';
import { LoanDetailDialog } from '@/components/loan/loan-detail-dialog';

import { loanService } from '@/services/loan.service';
import { LoanApplication, LoanStatus } from '@/types/loan.types';
import { DataTableConfig } from '@/types/data-table.types';
import { getLoanTypeLabel } from '@/lib/loan-utils';
import { Badge } from '../ui/badge';

export function DisbursementList() {
  const [data, setData] = useState<LoanApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [disbursementDialogOpen, setDisbursementDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    fetchData();
  }, [meta.page, meta.limit, searchValue]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await loanService.getPendingDisbursement({
        page: meta.page,
        limit: meta.limit,
        search: searchValue || undefined,
        sortBy: 'approvedAt',
        sortOrder: 'asc',
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

  const handleViewDetail = (loan: LoanApplication) => {
    setSelectedLoan(loan);
    setDetailDialogOpen(true);
  };

  const handleProcessDisbursement = (loan: LoanApplication) => {
    setSelectedLoan(loan);
    setDisbursementDialogOpen(true);
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
          <Badge variant="outline" className="text-xs">
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
        accessorKey: 'bankAccountNumber',
        header: 'No. Rekening',
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.bankAccountNumber}
          </span>
        ),
      },
      {
        accessorKey: 'approvedAt',
        header: 'Tanggal Disetujui',
        cell: ({ row }) => {
          if (!row.original.approvedAt) return '-';
          return (
            <span className="text-sm">
              {format(new Date(row.original.approvedAt), 'dd MMM yyyy', {
                locale: id,
              })}
            </span>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDetail(row.original)}
            >
              Detail
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleProcessDisbursement(row.original)}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Proses
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const tableConfig: DataTableConfig<LoanApplication> = {
    searchable: true,
    searchPlaceholder: 'Cari berdasarkan nama, no. pinjaman, no. rekening...',
    filterable: false,
    selectable: true,
    bulkActions: [
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
    ],
  };

  return (
    <div className="space-y-6">
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

      <ProcessDisbursementDialog
        loan={selectedLoan}
        open={disbursementDialogOpen}
        onOpenChange={setDisbursementDialogOpen}
        onSuccess={fetchData}
      />

      <BulkProcessDisbursementDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        selectedIds={selectedIds}
        onSuccess={fetchData}
      />
    </div>
  );
}