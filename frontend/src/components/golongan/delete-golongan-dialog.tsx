'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Golongan } from '@/types/golongan.types';
import { Loader2 } from 'lucide-react';

interface DeleteGolonganDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  golongan: Golongan | null;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export function DeleteGolonganDialog({
  open,
  onOpenChange,
  golongan,
  onConfirm,
  isLoading = false,
}: DeleteGolonganDialogProps) {
  if (!golongan) return null;

  const employeeCount = golongan._count?.employees || 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Golongan</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              Apakah Anda yakin ingin menghapus golongan{' '}
              <span className="font-semibold">{golongan.golonganName}</span>?
            </span>
            {employeeCount > 0 && (
              <span className="block text-destructive font-medium">
                ⚠️ Golongan ini memiliki {employeeCount} karyawan. Hapus atau pindahkan
                karyawan terlebih dahulu sebelum menghapus golongan.
              </span>
            )}
            {employeeCount === 0 && (
              <span className="block">
                Tindakan ini tidak dapat dibatalkan dan akan menghapus data golongan
                secara permanen.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading || employeeCount > 0}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              'Hapus'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}