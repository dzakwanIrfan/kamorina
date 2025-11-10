'use client';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Golongan } from '@/types/golongan.types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Users, Calendar, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GolonganDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  golongan: Golongan | null;
}

export function GolonganDetailDialog({
  open,
  onOpenChange,
  golongan,
}: GolonganDetailDialogProps) {
  if (!golongan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detail Golongan</DialogTitle>
          <DialogDescription>
            Informasi lengkap tentang golongan {golongan.golonganName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Nama Golongan</p>
                <p className="text-base font-semibold">{golongan.golonganName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  <Users className="inline h-4 w-4 mr-1" />
                  Jumlah Karyawan
                </p>
                <p className="text-base font-semibold">
                  {golongan._count?.employees || 0} karyawan
                </p>
              </div>
            </div>

            {golongan.description && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  <FileText className="inline h-4 w-4 mr-1" />
                  Deskripsi
                </p>
                <p className="text-sm">{golongan.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Dibuat
                </p>
                <p className="text-sm">
                  {format(new Date(golongan.createdAt), 'dd MMMM yyyy HH:mm', {
                    locale: id,
                  })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Terakhir Diupdate
                </p>
                <p className="text-sm">
                  {format(new Date(golongan.updatedAt), 'dd MMMM yyyy HH:mm', {
                    locale: id,
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Employees List */}
          {golongan.employees && golongan.employees.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Daftar Karyawan</h4>
                  <Badge variant="secondary">
                    {golongan.employees.length} dari {golongan._count?.employees || 0}
                  </Badge>
                </div>
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  <div className="space-y-3">
                    {golongan.employees.map((employee) => (
                      <div
                        key={employee.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{employee.fullName}</p>
                          <p className="text-xs text-muted-foreground">
                            {employee.employeeNumber}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              employee.employeeType === 'TETAP' ? 'default' : 'secondary'
                            }
                          >
                            {employee.employeeType}
                          </Badge>
                          {employee.isActive ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}