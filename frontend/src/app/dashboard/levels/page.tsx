"use client";

import { useState, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Plus,
  AlertCircle,
  Shield,
  Trash2,
  Download,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DataTableAdvanced } from "@/components/data-table/data-table-advanced";
import { ColumnActions } from "@/components/data-table/column-actions";
import { LevelFormDialog } from "@/components/levels/level-form-dialog";
import { LevelUsersDialog } from "@/components/levels/level-users-dialog";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";

import { useAuthStore } from "@/store/auth.store";
import { levelService } from "@/services/level.service";
import { handleApiError } from "@/lib/axios";
import { Level, QueryLevelParams } from "@/types/level.types";
import { PaginatedResponse } from "@/types/pagination.types";
import { DataTableConfig } from "@/types/data-table.types";

// Define default query params
const DEFAULT_QUERY_PARAMS: QueryLevelParams = {
  page: 1,
  limit: 10,
  search: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

export default function LevelsPage() {
  const { user } = useAuthStore();
  const [levels, setLevels] = useState<PaginatedResponse<Level>>({
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [queryParams, setQueryParams] =
    useState<QueryLevelParams>(DEFAULT_QUERY_PARAMS);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [selectedForBulkDelete, setSelectedForBulkDelete] = useState<Level[]>(
    []
  );

  // Check permissions - hanya ketua yang bisa CRUD levels
  const canCreate = user?.roles?.includes("ketua");
  const canEdit = user?.roles?.includes("ketua");
  const canDelete = user?.roles?.includes("ketua");

  // Fetch levels
  const fetchLevels = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await levelService.getAll(queryParams);
      setLevels(response);
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  // Handlers
  const handleSearch = (search: string) => {
    setQueryParams((prev) => ({ ...prev, search, page: 1 }));
  };

  const handleFiltersChange = (filters: Record<string, any>) => {
    setQueryParams((prev) => ({
      ...prev,
      ...filters,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    // Reset to default query params
    setQueryParams(DEFAULT_QUERY_PARAMS);
  };

  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (limit: number) => {
    setQueryParams((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleCreate = () => {
    setSelectedLevel(null);
    setIsFormOpen(true);
  };

  const handleEdit = (level: Level) => {
    setSelectedLevel(level);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (level: Level) => {
    setSelectedLevel(level);
    setIsDeleteOpen(true);
  };

  const handleBulkDelete = (selectedRows: Level[]) => {
    // Filter out default "anggota" level
    const deletableRows = selectedRows.filter(
      (level) => level.levelName !== "anggota"
    );

    if (deletableRows.length === 0) {
      toast.error('Level "anggota" tidak dapat dihapus');
      return;
    }

    if (deletableRows.length < selectedRows.length) {
      toast.warning('Level "anggota" akan dilewati dari penghapusan');
    }

    setSelectedForBulkDelete(deletableRows);
    setIsBulkDeleteOpen(true);
  };

  const handleManageUsers = (level: Level) => {
    setSelectedLevel(level);
    setIsUsersOpen(true);
  };

  const handleExport = (selectedRows: Level[]) => {
    const dataToExport = selectedRows.length > 0 ? selectedRows : levels.data;

    const csv = [
      ["ID", "Level Name", "Description", "User Count", "Created At"],
      ...dataToExport.map((level) => [
        level.id,
        level.levelName,
        level.description || "-",
        level._count?.userRoles || 0,
        format(new Date(level.createdAt), "dd/MM/yyyy"),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `levels-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success(`Exported ${dataToExport.length} levels`);
  };

  const handleSubmit = async (data: {
    levelName: string;
    description?: string;
  }) => {
    try {
      setIsSubmitting(true);

      if (selectedLevel) {
        await levelService.update(selectedLevel.id, data);
        toast.success("Level berhasil diupdate");
      } else {
        await levelService.create(data);
        toast.success("Level berhasil ditambahkan");
      }

      setIsFormOpen(false);
      setSelectedLevel(null);
      fetchLevels();
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLevel) return;

    try {
      setIsDeleting(true);
      const response = await levelService.delete(selectedLevel.id);
      toast.success(response.message);
      setIsDeleteOpen(false);
      setSelectedLevel(null);
      fetchLevels();
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      setIsDeleting(true);

      const results = await Promise.allSettled(
        selectedForBulkDelete.map((level) => levelService.delete(level.id))
      );

      const successCount = results.filter(
        (r) => r.status === "fulfilled"
      ).length;
      const failCount = results.filter((r) => r.status === "rejected").length;

      if (successCount > 0) {
        toast.success(`${successCount} levels berhasil dihapus`);
      }

      if (failCount > 0) {
        toast.error(
          `${failCount} levels gagal dihapus (mungkin masih memiliki user)`
        );
      }

      setIsBulkDeleteOpen(false);
      setSelectedForBulkDelete([]);
      fetchLevels();
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // Get badge color based on level name
  const getLevelBadgeVariant = (
    levelName: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    const colorMap: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      ketua: "default",
      bendahara: "secondary",
      pengawas: "outline",
      anggota: "secondary",
    };
    return colorMap[levelName.toLowerCase()] || "outline";
  };

  // DataTable Config
  const tableConfig: DataTableConfig<Level> = {
    searchable: true,
    searchPlaceholder: "Cari level...",
    filterable: true,
    filterFields: [
      {
        id: "levelName",
        label: "Level Name",
        type: "select",
        placeholder: "Pilih level",
        options: [
          { label: "Ketua", value: "ketua" },
          { label: "Bendahara", value: "bendahara" },
          { label: "Pengawas", value: "pengawas" },
          { label: "Anggota", value: "anggota" },
          { label: "Divisi Simpan Pinjam", value: "divisi_simpan_pinjam" },
          { label: "Payroll", value: "payroll" },
        ],
      },
      {
        id: "startDate",
        label: "Dari Tanggal",
        type: "date",
        placeholder: "Pilih tanggal mulai",
      },
      {
        id: "endDate",
        label: "Sampai Tanggal",
        type: "date",
        placeholder: "Pilih tanggal akhir",
      },
    ],
    selectable: canDelete,
    bulkActions: canDelete
      ? [
          {
            label: "Delete Selected",
            icon: Trash2,
            variant: "destructive",
            onClick: handleBulkDelete,
          },
          {
            label: "Export Selected",
            icon: Download,
            variant: "outline",
            onClick: handleExport,
          },
        ]
      : [
          {
            label: "Export Selected",
            icon: Download,
            variant: "outline",
            onClick: handleExport,
          },
        ],
    toolbarActions: canCreate
      ? [
          {
            label: "Tambah Level",
            icon: Plus,
            onClick: handleCreate,
          },
        ]
      : [],
  };

  // Table columns
  const columns: ColumnDef<Level>[] = [
    {
      accessorKey: "levelName",
      header: "Nama Level",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium capitalize">
              {row.original.levelName}
            </span>
            {row.original.levelName === "anggota" && (
              <span className="text-xs text-muted-foreground">
                Level Default
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Deskripsi",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground line-clamp-2">
          {row.original.description || "-"}
        </span>
      ),
    },
    {
      accessorKey: "_count.userRoles",
      header: "Jumlah User",
      cell: ({ row }) => (
        <Badge variant={getLevelBadgeVariant(row.original.levelName)}>
          {row.original._count?.userRoles || 0} User
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Tanggal Dibuat",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.createdAt), "dd MMM yyyy", {
            locale: localeId,
          })}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const isDefaultLevel = row.original.levelName === "anggota";
        return (
          <ColumnActions
            onEdit={canEdit ? () => handleEdit(row.original) : undefined}
            onDelete={
              canDelete && !isDefaultLevel
                ? () => handleDeleteClick(row.original)
                : undefined
            }
            canEdit={canEdit}
            canDelete={canDelete && !isDefaultLevel}
            extraActions={[
              {
                label: "Atur User",
                icon: UserCog,
                onClick: () => handleManageUsers(row.original),
              },
            ]}
          />
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Levels</h1>
          <p className="text-muted-foreground">
            Kelola level/role pengguna sistem
          </p>
        </div>
      </div>

      {/* Warning for non-privileged users */}
      {!canCreate && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Hanya Ketua yang dapat mengelola levels. Anda hanya memiliki akses
            untuk melihat data.
          </AlertDescription>
        </Alert>
      )}

      {/* Info about default level */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Level <strong>"anggota"</strong> adalah level default dan tidak dapat
          dihapus. Setiap user baru otomatis mendapat level ini.
        </AlertDescription>
      </Alert>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Level</CardTitle>
          <CardDescription>
            Total {levels.meta.total} level terdaftar dalam sistem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTableAdvanced
            columns={columns}
            data={levels.data}
            meta={levels.meta}
            config={tableConfig}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSearch={handleSearch}
            onFiltersChange={handleFiltersChange}
            onResetFilters={handleResetFilters}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <LevelFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        level={selectedLevel}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />

      <LevelUsersDialog
        open={isUsersOpen}
        onOpenChange={setIsUsersOpen}
        level={selectedLevel}
        onUpdate={fetchLevels}
      />

      <DeleteConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        title="Hapus Level"
        description={`Apakah Anda yakin ingin menghapus level "${selectedLevel?.levelName}"? Aksi ini tidak dapat dibatalkan dan akan mempengaruhi user yang memiliki level ini.`}
        isLoading={isDeleting}
      />

      <DeleteConfirmationDialog
        open={isBulkDeleteOpen}
        onOpenChange={setIsBulkDeleteOpen}
        onConfirm={handleBulkDeleteConfirm}
        title="Hapus Multiple Levels"
        description={`Apakah Anda yakin ingin menghapus ${selectedForBulkDelete.length} levels? Aksi ini tidak dapat dibatalkan. Level yang masih memiliki user tidak akan dihapus.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
