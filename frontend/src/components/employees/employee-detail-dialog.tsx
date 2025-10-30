'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { User, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { employeeService } from '@/services/employee.service';
import { Employee } from '@/types/employee.types';
import { toast } from 'sonner';

interface EmployeeDetailDialogProps {
  employeeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeDetailDialog({
  employeeId,
  open,
  onOpenChange,
}: EmployeeDetailDialogProps) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (employeeId && open) {
      fetchEmployeeDetail();
    }
  }, [employeeId, open]);

  const fetchEmployeeDetail = async () => {
    if (!employeeId) return;

    try {
      setIsLoading(true);
      const data = await employeeService.getById(employeeId);
      setEmployee(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memuat detail karyawan');
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Karyawan</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : employee ? (
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <Badge variant={employee.isActive ? 'default' : 'secondary'}>
                {employee.isActive ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Aktif
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    Tidak Aktif
                  </>
                )}
              </Badge>
            </div>

            {/* Employee Info */}
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Informasi Karyawan
              </h3>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nomor Karyawan</p>
                  <p className="font-medium">{employee.employeeNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Nama Lengkap</p>
                  <p className="font-medium">{employee.fullName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">
                    {employee.isActive ? 'Aktif' : 'Tidak Aktif'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Jumlah User</p>
                  <p className="font-medium">{employee._count?.users || 0} user</p>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Tanggal
              </h3>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Dibuat</p>
                  <p className="font-medium">
                    {format(new Date(employee.createdAt), 'dd MMMM yyyy HH:mm', {
                      locale: id,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Terakhir Diperbarui</p>
                  <p className="font-medium">
                    {format(new Date(employee.updatedAt), 'dd MMMM yyyy HH:mm', {
                      locale: id,
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Associated Users */}
            {employee.users && employee.users.length > 0 && (
              <div className="rounded-lg border p-4 space-y-3">
                <h3 className="font-semibold">User Terkait ({employee.users.length})</h3>
                <Separator />
                <div className="space-y-2">
                  {employee.users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted"
                    >
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant={user.memberVerified ? 'default' : 'secondary'}>
                        {user.memberVerified ? 'Member Verified' : 'Not Verified'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}