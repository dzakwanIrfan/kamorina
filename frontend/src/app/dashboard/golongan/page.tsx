"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Users } from "lucide-react";
import { FaRupiahSign } from "react-icons/fa6";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";

import { DataTableAdvanced } from "@/components/data-table/data-table-advanced";
import { ColumnActions } from "@/components/data-table/column-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GolonganFormDialog } from "@/components/golongan/golongan-form-dialog";
import { GolonganDetailDialog } from "@/components/golongan/golongan-detail-dialog";
import { DeleteGolonganDialog } from "@/components/golongan/delete-golongan-dialog";
import { LoanLimitMatrixDialog } from "@/components/golongan/loan-limit-matrix-dialog";
import { golonganService } from "@/services/golongan.service";
import {
  Golongan,
  CreateGolonganRequest,
  UpdateGolonganRequest,
} from "@/types/golongan.types";
import { PaginatedResponse } from "@/types/pagination.types";
import { handleApiError } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function GolonganPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  // Permissions
  const canCreate = user?.roles?.some((role) =>
    ["ketua", "divisi_simpan_pinjam"].includes(role),
  );
  const canEdit = user?.roles?.some((role) =>
    ["ketua", "divisi_simpan_pinjam"].includes(role),
  );
  const canDelete = user?.roles?.includes("ketua");

  // States
  const [data, setData] = useState<PaginatedResponse<Golongan> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoanLimitOpen, setIsLoanLimitOpen] = useState(false);
  const [selectedGolongan, setSelectedGolongan] = useState<Golongan | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Query params
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "golonganName";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "asc";

  // Update URL with query params
  const updateQueryParams = useCallback(
    (params: Record<string, string | number>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          newSearchParams.set(key, String(value));
        } else {
          newSearchParams.delete(key);
        }
      });

      router.push(`?${newSearchParams.toString()}`);
    },
    [router, searchParams],
  );

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await golonganService.getAll({
        page,
        limit,
        search,
        sortBy,
        sortOrder,
      });
      setData(response);
    } catch (error) {
      toast.error("Gagal memuat data", {
        description: handleApiError(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers
  const handlePageChange = (newPage: number) => {
    updateQueryParams({ page: newPage });
  };

  const handlePageSizeChange = (newLimit: number) => {
    updateQueryParams({ page: 1, limit: newLimit });
  };

  const handleSearch = (newSearch: string) => {
    updateQueryParams({ page: 1, search: newSearch });
  };

  const handleResetFilters = () => {
    router.push("/dashboard/golongan");
  };

  const handleCreate = () => {
    setSelectedGolongan(null);
    setIsFormOpen(true);
  };

  const handleEdit = (golongan: Golongan) => {
    setSelectedGolongan(golongan);
    setIsFormOpen(true);
  };

  const handleView = async (golongan: Golongan) => {
    try {
      const detailData = await golonganService.getById(golongan.id);
      setSelectedGolongan(detailData);
      setIsDetailOpen(true);
    } catch (error) {
      toast.error("Gagal memuat detail", {
        description: handleApiError(error),
      });
    }
  };

  const handleDelete = (golongan: Golongan) => {
    setSelectedGolongan(golongan);
    setIsDeleteOpen(true);
  };

  const handleLoanLimit = async (golongan: Golongan) => {
    try {
      const detailData = await golonganService.getById(golongan.id);
      setSelectedGolongan(detailData);
      setIsLoanLimitOpen(true);
    } catch (error) {
      toast.error("Gagal memuat detail", {
        description: handleApiError(error),
      });
    }
  };

  const handleFormSubmit = async (
    formData: CreateGolonganRequest | UpdateGolonganRequest,
  ) => {
    setIsSubmitting(true);
    try {
      if (selectedGolongan) {
        await golonganService.update(selectedGolongan.id, formData);
        toast.success("Berhasil", {
          description: "Golongan berhasil diupdate",
        });
      } else {
        await golonganService.create(formData as CreateGolonganRequest);
        toast.success("Berhasil", {
          description: "Golongan berhasil ditambahkan",
        });
      }
      setIsFormOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Gagal menyimpan", {
        description: handleApiError(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedGolongan) return;

    setIsSubmitting(true);
    try {
      await golonganService.delete(selectedGolongan.id);
      toast.success("Berhasil", {
        description: `Golongan "${selectedGolongan.golonganName}" berhasil dihapus`,
      });
      setIsDeleteOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Gagal menghapus", {
        description: handleApiError(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Columns definition
  const columns: ColumnDef<Golongan>[] = [
    {
      accessorKey: "golonganName",
      header: "Nama Golongan",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("golonganName")}</div>
      ),
    },
    {
      accessorKey: "description",
      header: "Deskripsi",
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate text-muted-foreground">
          {row.getValue("description") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "_count",
      header: "Jumlah Karyawan",
      cell: ({ row }) => {
        const count = row.original._count?.employees || 0;
        return (
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {count} karyawan
          </Badge>
        );
      },
    },
    {
      id: "loanLimits",
      header: "Plafond Pinjaman",
      cell: ({ row }) => {
        const count = row.original._count?.loanLimits || 0;
        return (
          <div className="flex items-center gap-2">
            <Badge
              variant={count > 0 ? "default" : "outline"}
              className="gap-1"
            >
              <FaRupiahSign className="h-3 w-3" />
              {count > 0 ? `${count} range` : "Belum diatur"}
            </Badge>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLoanLimit(row.original)}
                className="h-7"
              >
                Atur
              </Button>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Dibuat",
      cell: ({ row }) => {
        return (
          <div className="text-sm text-muted-foreground">
            {format(new Date(row.getValue("createdAt")), "dd MMM yyyy", {
              locale: id,
            })}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <ColumnActions
          onView={() => handleView(row.original)}
          onEdit={canEdit ? () => handleEdit(row.original) : undefined}
          onDelete={canDelete ? () => handleDelete(row.original) : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Golongan</h1>
          <p className="text-muted-foreground">
            Kelola golongan/klasifikasi karyawan dan plafond pinjaman
          </p>
        </div>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Golongan</CardTitle>
          <CardDescription>
            Total {data?.meta.total} golongan terdaftar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTableAdvanced
            columns={columns}
            data={data?.data || []}
            meta={data?.meta}
            config={{
              searchable: true,
              searchPlaceholder: "Cari golongan...",
              filterable: false,
              toolbarActions: canCreate ? [
                {
                  label: "Tambah Golongan",
                  icon: Plus,
                  onClick: handleCreate,
                }
              ] : undefined
            }}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSearch={handleSearch}
            onResetFilters={handleResetFilters}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <GolonganFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        golongan={selectedGolongan}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
      />

      <GolonganDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        golongan={selectedGolongan}
      />

      <DeleteGolonganDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        golongan={selectedGolongan}
        onConfirm={handleDeleteConfirm}
        isLoading={isSubmitting}
      />

      <LoanLimitMatrixDialog
        open={isLoanLimitOpen}
        onOpenChange={setIsLoanLimitOpen}
        golongan={selectedGolongan}
        onSuccess={fetchData}
      />
    </div>
  );
}
