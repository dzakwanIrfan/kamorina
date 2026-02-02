"use client";

import { useState, useEffect, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { DataTableAdvanced } from "@/components/data-table/data-table-advanced";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { UserDetailDialog } from "@/components/users/user-detail-dialog";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { ColumnActions } from "@/components/data-table/column-actions";

import { userService } from "@/services/user.service";
import { departmentService } from "@/services/department.service";
import { usePermissions } from "@/hooks/use-permission";
import { User } from "@/types/user.types";
import { Department } from "@/types/department.types";
import { DataTableConfig } from "@/types/data-table.types";

export default function UsersPage() {
  const { hasRole } = usePermissions();

  const [data, setData] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);

  // Pagination state
  const [meta, setMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [filters, setFilters] = useState<Record<string, any>>({});
  const [searchValue, setSearchValue] = useState("");

  // Check permissions - only admins/DSP/ketua should manage users
  const canCreate =
    hasRole("ketua") || hasRole("divisi_simpan_pinjam") || hasRole("admin");
  const canEdit =
    hasRole("ketua") || hasRole("divisi_simpan_pinjam") || hasRole("admin");
  const canDelete = hasRole("ketua") || hasRole("admin"); // Restrict delete more?

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getAll({ limit: 100 });
      setDepartments(response.data);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const params: any = {
        page: meta.page,
        limit: meta.limit,
        search: searchValue || undefined,
        isActive:
          filters.isActive !== undefined
            ? filters.isActive === "true"
            : undefined,
        departmentId:
          filters.departmentId && filters.departmentId !== "all"
            ? filters.departmentId
            : undefined,
        role: filters.role && filters.role !== "all" ? filters.role : undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      const response = await userService.getAll(params);
      setData(response.data);
      setMeta(response.meta);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [meta.page, meta.limit, searchValue, filters]);

  const handleCreate = () => {
    setSelectedUser(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormDialogOpen(true);
  };

  const handleViewDetail = (user: User) => {
    setSelectedUser(user);
    setDetailDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    try {
      const result = await userService.delete(selectedUser.id);
      toast.success(result.message || "User berhasil dihapus");
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menghapus user");
    }
  };

  const columns: ColumnDef<User>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Nama User",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.name}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.email}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "roles",
        header: "Roles",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {row.original.roles &&
              row.original.roles.map((role) => (
                <Badge
                  key={role}
                  variant="outline"
                  className="capitalize text-xs"
                >
                  {role.replace(/_/g, " ")}
                </Badge>
              ))}
          </div>
        ),
      },
      {
        accessorKey: "employee.employeeNumber",
        header: "Karyawan Terkait",
        cell: ({ row }) =>
          row.original.employee ? (
            <div className="flex flex-col">
              <span>{row.original.employee.fullName}</span>
              <span className="text-xs text-muted-foreground">
                {row.original.employee.employeeNumber}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground text-xs italic">
              Tidak terhubung
            </span>
          ),
      },
      {
        accessorKey: "employee.department.departmentName",
        header: "Department",
        cell: ({ row }) =>
          row.original.employee?.department?.departmentName || "-",
      },
      {
        accessorKey: "employee.isActive",
        header: "Status Karyawan", // Status User is implicitly Active if created, but let's show Employee status
        cell: ({ row }) =>
          row.original.employee ? (
            <Badge
              variant={row.original.employee.isActive ? "default" : "secondary"}
            >
              {row.original.employee.isActive ? "Aktif" : "Tidak Aktif"}
            </Badge>
          ) : (
            "-"
          ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <ColumnActions
              onView={() => handleViewDetail(row.original)}
              onEdit={canEdit ? () => handleEdit(row.original) : undefined}
              onDelete={
                canDelete ? () => handleDelete(row.original) : undefined
              }
              canEdit={canEdit}
              canDelete={canDelete}
            />
          </div>
        ),
      },
    ],
    [canEdit, canDelete]
  );

  const tableConfig: DataTableConfig<User> = {
    searchable: true,
    searchPlaceholder: "Cari nama, email, atau NIK...",
    filterable: true,
    filterFields: [
      {
        id: "isActive",
        label: "Status Karyawan",
        type: "select",
        placeholder: "Semua Status",
        options: [
          { label: "Semua Status", value: "all" },
          { label: "Aktif", value: "true" },
          { label: "Tidak Aktif", value: "false" },
        ],
      },
      {
        id: "role",
        label: "Role",
        type: "select",
        placeholder: "Semua Role",
        options: [
          { label: "Semua Role", value: "all" },
          { label: "Anggota", value: "anggota" },
          { label: "Admin", value: "admin" },
          { label: "Ketua", value: "ketua" },
          { label: "DSP", value: "divisi_simpan_pinjam" },
          { label: "Pengawas", value: "pengawas" },
          // Can add more dynamically if needed, but these are standard
        ],
      },
      {
        id: "departmentId",
        label: "Department",
        type: "select",
        placeholder: "Semua Department",
        options: [
          { label: "Semua Department", value: "all" },
          ...departments.map((dept) => ({
            label: dept.departmentName,
            value: dept.id,
          })),
        ],
      },
    ],
    toolbarActions: canCreate
      ? [
          {
            label: "Tambah User",
            onClick: handleCreate,
            icon: Plus,
            variant: "default",
          },
        ]
      : undefined,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Kelola data user dan akses sistem
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DataTableAdvanced
            columns={columns}
            data={data}
            meta={meta}
            config={tableConfig}
            onPageChange={(page) => setMeta((prev) => ({ ...prev, page }))}
            onPageSizeChange={(limit) =>
              setMeta((prev) => ({ ...prev, limit, page: 1 }))
            }
            onSearch={setSearchValue}
            onFiltersChange={setFilters}
            onResetFilters={() => {
              setFilters({});
              setSearchValue("");
            }}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <UserFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        user={selectedUser}
        onSuccess={fetchData}
      />

      <UserDetailDialog
        user={selectedUser}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus User"
        description={`Apakah Anda yakin ingin menghapus user "${selectedUser?.name}"? Tindakan ini tidak dapat dibatalkan.`}
      />
    </div>
  );
}
