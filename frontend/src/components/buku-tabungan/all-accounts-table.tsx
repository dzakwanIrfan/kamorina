"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Eye, RefreshCw, Archive } from "lucide-react";
import { toast } from "sonner";

import { DataTableAdvanced } from "@/components/data-table/data-table-advanced";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useAllAccounts } from "@/hooks/use-buku-tabungan";
import { departmentService } from "@/services/department.service";
import { bukuTabunganService } from "@/services/buku-tabungan.service";
import {
  SavingsAccountListItem,
  EmployeeType,
} from "@/types/buku-tabungan.types";
import { Department } from "@/types/department.types";
import { DataTableConfig } from "@/types/data-table.types";
import { formatCurrency, toNumber } from "@/lib/format";

const EMPLOYEE_TYPES = [
  { label: "Semua Tipe", value: "all" },
  { label: "Tetap", value: "TETAP" },
  { label: "Kontrak", value: "KONTRAK" },
];

export function AllAccountsTable() {
  const router = useRouter();
  const [departments, setDepartments] = useState<
    { label: string; value: string }[]
  >([{ label: "Semua Departemen", value: "all" }]);

  const {
    accounts,
    meta,
    isLoading,
    error,
    setPage,
    setLimit,
    setFilters: setQueryFilters,
    resetFilters,
    refetch,
    params,
  } = useAllAccounts();

  // Load departments for filter
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await departmentService.getAll({ limit: 100 });
        const deptOptions = [
          { label: "Semua Departemen", value: "all" },
          ...response.data.map((dept: Department) => ({
            label: dept.departmentName,
            value: dept.id,
          })),
        ];
        setDepartments(deptOptions);
      } catch {
        // Silent fail - use default
      }
    };
    loadDepartments();
  }, []);

  const handleViewDetail = (account: SavingsAccountListItem) => {
    // Navigate to detail page with userId
    router.push(`/dashboard/buku-tabungan/all/${account.userId}`);
  };

  const handleSearch = (search: string) => {
    setQueryFilters({ ...params, search: search || undefined, page: 1 });
  };

  const handleFiltersChange = (newFilters: Record<string, unknown>) => {
    const queryFilters: Record<string, unknown> = {};

    if (newFilters.departmentId && newFilters.departmentId !== "all") {
      queryFilters.departmentId = newFilters.departmentId;
    }
    if (newFilters.employeeType && newFilters.employeeType !== "all") {
      queryFilters.employeeType = newFilters.employeeType as EmployeeType;
    }

    setQueryFilters(queryFilters);
  };

  const handleResetFilters = () => {
    resetFilters();
  };

  const handleDownloadZip = async () => {
    const toastId = toast.loading("Mengunduh ZIP buku tabungan...");
    try {
      const blob = await bukuTabunganService.exportAllBukuTabungan();
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `Buku_Tabungan_All_${format(
        new Date(),
        "yyyyMMdd_HHmmss",
      )}.zip`;
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Download berhasil", { id: toastId });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Gagal mengunduh ZIP", { id: toastId });
    }
  };

  const columns: ColumnDef<SavingsAccountListItem>[] = useMemo(
    () => [
      {
        accessorKey: "user.employee.employeeNumber",
        header: "NIP",
        cell: ({ row }) => (
          <span className="text-sm font-mono">
            {row.original.user.employee.employeeNumber}
          </span>
        ),
      },
      {
        accessorKey: "user.employee.fullName",
        header: "Nama",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">
              {row.original.user.employee.fullName}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.original.user.email}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "user.employee.department.departmentName",
        header: "Departemen",
        cell: ({ row }) => (
          <Badge variant="outline">
            {row.original.user.employee.department.departmentName}
          </Badge>
        ),
      },
      {
        accessorKey: "user.employee.employeeType",
        header: "Tipe",
        cell: ({ row }) => {
          const type = row.original.user.employee.employeeType;
          return (
            <Badge variant={type === "TETAP" ? "default" : "secondary"}>
              {type}
            </Badge>
          );
        },
      },
      {
        accessorKey: "totalSaldo",
        header: "Total Saldo",
        cell: ({ row }) => {
          const value = toNumber(row.original.totalSaldo);
          return (
            <span className="font-semibold text-primary">
              {formatCurrency(value)}
            </span>
          );
        },
      },
      {
        accessorKey: "saldoPokok",
        header: "Simpanan Pokok",
        cell: ({ row }) => {
          const value = toNumber(row.original.saldoPokok);
          return <span className="text-sm">{formatCurrency(value)}</span>;
        },
      },
      {
        accessorKey: "saldoWajib",
        header: "Iuran Wajib",
        cell: ({ row }) => {
          const value = toNumber(row.original.saldoWajib);
          return <span className="text-sm">{formatCurrency(value)}</span>;
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetail(row.original)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Detail
          </Button>
        ),
      },
    ],
    [],
  );

  const tableConfig: DataTableConfig<SavingsAccountListItem> = {
    searchable: true,
    searchPlaceholder: "Cari nama atau NIP...",
    filterable: true,
    selectable: false,
    filterFields: [
      {
        id: "departmentId",
        label: "Departemen",
        type: "select",
        placeholder: "Pilih Departemen",
        options: departments,
      },
      {
        id: "employeeType",
        label: "Tipe Karyawan",
        type: "select",
        placeholder: "Pilih Tipe",
        options: EMPLOYEE_TYPES,
      },
    ],
    toolbarActions: [
      {
        label: "Refresh",
        icon: RefreshCw,
        onClick: () => refetch(),
        variant: "outline",
      },
      {
        label: "Download ZIP",
        icon: Archive,
        onClick: handleDownloadZip,
        variant: "outline",
        disabled: accounts.length === 0,
      },
    ],
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Semua Buku Tabungan</CardTitle>
        <CardDescription>
          Lihat dan kelola semua buku tabungan anggota koperasi
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTableAdvanced
          columns={columns}
          data={accounts}
          meta={meta}
          config={tableConfig}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          onSearch={handleSearch}
          onFiltersChange={handleFiltersChange}
          onResetFilters={handleResetFilters}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
}
