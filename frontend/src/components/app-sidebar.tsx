// frontend/src/components/app-sidebar.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Settings,
  ChevronsUpDown,
  LogOut,
  Building2,
  Shield,
  AlertCircle,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    requiresMemberVerified: false, // Always accessible
  },
  {
    title: 'Anggota',
    icon: Users,
    href: '/dashboard/members',
    requiresMemberVerified: true,
  },
  {
    title: 'Produk',
    icon: Package,
    href: '/dashboard/products',
    requiresMemberVerified: true,
  },
  {
    title: 'Transaksi',
    icon: FileText,
    href: '/dashboard/transactions',
    requiresMemberVerified: true,
  },
];

const managementItems = [
  {
    title: 'Member Applications',
    icon: FileText,
    href: '/dashboard/member-application',
    roles: ['ketua', 'divisi_simpan_pinjam', 'pengawas', 'payroll'],
    requiresMemberVerified: true,
  },
  {
    title: 'Employees',
    icon: Users,
    href: '/dashboard/employees',
    roles: ['ketua', 'divisi_simpan_pinjam'],
    requiresMemberVerified: true,
  },
  {
    title: 'Departments',
    icon: Building2,
    href: '/dashboard/departments',
    roles: ['ketua', 'divisi_simpan_pinjam', 'pengawas', 'bendahara', 'payroll'],
    requiresMemberVerified: true,
  },
  {
    title: 'Levels',
    icon: Shield,
    href: '/dashboard/levels',
    roles: ['ketua', 'divisi_simpan_pinjam', 'pengawas'],
    requiresMemberVerified: true,
  },
  {
    title: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
    roles: ['ketua', 'divisi_simpan_pinjam'],
    requiresMemberVerified: true,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const hasAccess = (roles?: string[]) => {
    if (!roles) return true;
    return user?.roles?.some((role) => roles.includes(role));
  };

  const isMemberVerified = user?.memberVerified || false;

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <Image src="/assets/logo.svg" alt="Logo" width={32} height={32} />
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Koperasi</span>
                  <span className="text-xs text-muted-foreground">Surya Niaga Kamorina</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Member Status Badge */}
        {!isMemberVerified && (
          <div className="px-3 py-2">
            <Alert variant="default" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Akun belum terverifikasi. Lengkapi pendaftaran anggota.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                const isDisabled = item.requiresMemberVerified && !isMemberVerified;
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild={!isDisabled}
                      isActive={isActive}
                      disabled={isDisabled}
                      className={isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      {isDisabled ? (
                        <div className="flex items-center gap-3">
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </div>
                      ) : (
                        <Link href={item.href}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Only show management menu if member is verified */}
        {isMemberVerified && (
          <SidebarGroup>
            <SidebarGroupLabel>Manajemen</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {managementItems
                  .filter((item) => hasAccess(item.roles))
                  .map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={item.href}>
                            <item.icon className="size-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                      {user ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">
                    <Users className="mr-2 h-4 w-4" />
                    <span>Profil Saya</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Pengaturan</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}