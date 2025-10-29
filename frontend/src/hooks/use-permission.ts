'use client';

import { useAuthStore } from '@/store/auth.store';

export function usePermissions() {
  const { user } = useAuthStore();

  const hasRole = (roles: string | string[]) => {
    if (!user?.roles) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return user.roles.some((role) => roleArray.includes(role));
  };

  const hasAnyRole = (roles: string[]) => {
    if (!user?.roles) return false;
    return user.roles.some((role) => roles.includes(role));
  };

  const hasAllRoles = (roles: string[]) => {
    if (!user?.roles) return false;
    return roles.every((role) => user.roles?.includes(role));
  };

  return {
    user,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isKetua: hasRole('ketua'),
    isBendahara: hasRole('bendahara'),
    isPengawas: hasRole('pengawas'),
    isAnggota: hasRole('anggota'),
    isDivisiSimpanPinjam: hasRole('divisi_simpan_pinjam'),
    isPayroll: hasRole('payroll'),
  };
}