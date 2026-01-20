"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "@/types/user.types";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface UserDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export function UserDetailDialog({
  open,
  onOpenChange,
  user,
}: UserDetailDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Detail User</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="account">Info Akun</TabsTrigger>
            <TabsTrigger value="employee">Data Karyawan</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Nama
                </span>
                <p className="font-medium">{user.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Email
                </span>
                <p className="font-medium">{user.email}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">
                  NIK
                </span>
                <p className="font-medium">{user.nik || "-"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Tempat / Tgl Lahir
                </span>
                <p className="font-medium">
                  {user.birthPlace || "-"} /{" "}
                  {user.dateOfBirth
                    ? format(new Date(user.dateOfBirth), "dd MMMM yyyy", {
                        locale: id,
                      })
                    : "-"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Roles
                </span>
                <div className="flex flex-wrap gap-1">
                  {user.roles &&
                    user.roles.map((role) => (
                      <Badge
                        key={role}
                        variant="secondary"
                        className="capitalize"
                      >
                        {role.replace(/_/g, " ")}
                      </Badge>
                    ))}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Status Verifikasi
                </span>
                <div className="flex gap-2">
                  <Badge
                    variant={user.emailVerified ? "default" : "destructive"}
                  >
                    {user.emailVerified ? "Email Verified" : "Email Unverified"}
                  </Badge>
                  <Badge
                    variant={user.memberVerified ? "default" : "secondary"}
                  >
                    {user.memberVerified ? "Member Verified" : "Member Pending"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Bergabung Sejak
                </span>
                <p className="font-medium">
                  {format(new Date(user.createdAt), "dd MMMM yyyy", {
                    locale: id,
                  })}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="employee" className="space-y-4 pt-4">
            {user.employee ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Nomor Karyawan
                  </span>
                  <p className="font-medium">{user.employee.employeeNumber}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Nama Karyawan
                  </span>
                  <p className="font-medium">{user.employee.fullName}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Department
                  </span>
                  <p className="font-medium">
                    {user.employee.department?.departmentName || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Golongan
                  </span>
                  <p className="font-medium">
                    {user.employee.golongan?.golonganName || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Tipe
                  </span>
                  <p className="font-medium">{user.employee.employeeType}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    No. Rekening
                  </span>
                  <p className="font-medium">
                    {user.employee.bankAccountNumber} (
                    {user.employee.bankAccountName})
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    Status Karyawan
                  </span>
                  <Badge
                    variant={user.employee.isActive ? "default" : "destructive"}
                  >
                    {user.employee.isActive ? "Aktif" : "Tidak Aktif"}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                Tidak ada data karyawan terhubung
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
