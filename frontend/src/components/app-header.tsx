'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ThemeToggle } from '@/components/theme-toggle';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';

export function AppHeader() {
  const pathname = usePathname();

  // Generate breadcrumb from pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);

    // Regex to detect UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Map untuk label yang lebih readable
    const labelMap: Record<string, string> = {
      dashboard: 'Dashboard',
      members: 'Anggota',
      products: 'Produk',
      transactions: 'Transaksi',
      departments: 'Departemen',
      settings: 'Pengaturan',
      profile: 'Profil',
      'buku-tabungan': 'Buku Tabungan',
      all: 'Semua',
      loans: 'Pinjaman',
      deposits: 'Deposito',
      approvals: 'Persetujuan',
      employees: 'Karyawan',
      levels: 'Level',
      golongan: 'Golongan',
      'member-application': 'Aplikasi Anggota',
      'deposit-changes': 'Perubahan Deposito',
      'deposit-options': 'Opsi Deposito',
      amounts: 'Jumlah',
      tenors: 'Tenor',
      disbursement: 'Pencairan',
      authorization: 'Otorisasi',
    };

    // Filter out UUID segments
    const filteredPaths = paths.filter(path => !uuidRegex.test(path));

    return filteredPaths.map((path, index) => {
      // Build href from original paths up to this point
      const originalIndex = paths.indexOf(path);
      const href = `/${paths.slice(0, originalIndex + 1).join('/')}`;
      const label = labelMap[path] || path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
      const isLast = index === filteredPaths.length - 1;

      return {
        href,
        label,
        isLast,
      };
    });
  };


  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex flex-1 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <Fragment key={crumb.href}>
                <BreadcrumbItem>
                  {crumb.isLast ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href}>
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!crumb.isLast && <BreadcrumbSeparator />}
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center gap-2 px-4">
        <ThemeToggle />
      </div>
    </header>
  );
}