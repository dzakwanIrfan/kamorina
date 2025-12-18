"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  ChevronsUpDown,
  LogOut,
  Building2,
  Shield,
  AlertCircle,
  AlignVerticalJustifyEnd,
  CheckCircle2,
  Banknote,
  PiggyBank,
  Wallet,
  Clock,
  Edit,
  BookOpen,
  TrendingDown,
} from "lucide-react";
import { FaRupiahSign } from "react-icons/fa6";

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
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import Image from "next/image";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    requiresMemberVerified: false,
  },
  {
    title: "Buku Tabungan",
    icon: BookOpen,
    href: "/dashboard/buku-tabungan",
    requiresMemberVerified: true,
  },
  {
    title: "Tabungan Saya",
    icon: PiggyBank,
    href: "/dashboard/deposits",
    requiresMemberVerified: true,
  },
  {
    title: "Perubahan Tabungan",
    icon: Edit,
    href: "/dashboard/deposit-changes",
    requiresMemberVerified: true,
  },
  {
    title: "Penarikan Tabungan",
    icon: TrendingDown,
    href: "/dashboard/savings-withdrawals",
    requiresMemberVerified: true,
  },
  {
    title: "Pinjaman Saya",
    icon: FaRupiahSign,
    href: "/dashboard/loans",
    requiresMemberVerified: true,
  },
];

const managementGroups = [
  {
    label: "Manajemen Tabungan",
    items: [
      {
        title: "Approval Deposito",
        icon: PiggyBank,
        href: "/dashboard/deposits/approvals",
        roles: ["ketua", "divisi_simpan_pinjam"],
        requiresMemberVerified: true,
      },
      {
        title: "Perubahan Deposito",
        icon: Edit,
        href: "/dashboard/deposit-changes/approvals",
        roles: ["ketua", "divisi_simpan_pinjam"],
        requiresMemberVerified: true,
      },
      {
        title: "Approval Penarikan",
        icon: TrendingDown,
        href: "/dashboard/savings-withdrawals/approvals",
        roles: ["ketua", "divisi_simpan_pinjam"],
        requiresMemberVerified: true,
      },
      {
        title: "Pencairan Tabungan",
        icon: Banknote,
        href: "/dashboard/savings-withdrawals/disbursement",
        roles: ["shopkeeper"],
        requiresMemberVerified: true,
      },
      {
        title: "Otorisasi Tabungan",
        icon: Shield,
        href: "/dashboard/savings-withdrawals/authorization",
        roles: ["ketua"],
        requiresMemberVerified: true,
      },
      {
        title: "Opsi Jumlah Deposito",
        icon: Wallet,
        href: "/dashboard/deposit-options/amounts",
        roles: ["ketua", "divisi_simpan_pinjam"],
        requiresMemberVerified: true,
      },
      {
        title: "Opsi Tenor Deposito",
        icon: Clock,
        href: "/dashboard/deposit-options/tenors",
        roles: ["ketua", "divisi_simpan_pinjam"],
        requiresMemberVerified: true,
      },
      {
        title: "Semua Buku Tabungan",
        icon: BookOpen,
        href: "/dashboard/buku-tabungan/all",
        roles: ["ketua", "divisi_simpan_pinjam", "pengawas"],
        requiresMemberVerified: true,
      },
    ],
  },
  {
    label: "Manajemen Pinjaman",
    items: [
      {
        title: "Approval Pinjaman",
        icon: CheckCircle2,
        href: "/dashboard/loans/approvals",
        roles: ["ketua", "divisi_simpan_pinjam", "pengawas"],
        requiresMemberVerified: true,
      },
      {
        title: "Pencairan Pinjaman",
        icon: Banknote,
        href: "/dashboard/loans/disbursement",
        roles: ["shopkeeper"],
        requiresMemberVerified: true,
      },
      {
        title: "Otorisasi Pinjaman",
        icon: Shield,
        href: "/dashboard/loans/authorization",
        roles: ["ketua"],
        requiresMemberVerified: true,
      },
    ],
  },
  {
    label: "Administrasi & Master Data",
    items: [
      {
        title: "Pengajuan Anggota",
        icon: FileText,
        href: "/dashboard/member-application",
        roles: ["ketua", "divisi_simpan_pinjam", "pengawas", "payroll"],
        requiresMemberVerified: true,
      },
      {
        title: "Karyawan",
        icon: Users,
        href: "/dashboard/employees",
        roles: ["ketua", "divisi_simpan_pinjam"],
        requiresMemberVerified: true,
      },
      {
        title: "Departemen",
        icon: Building2,
        href: "/dashboard/departments",
        roles: [
          "ketua",
          "divisi_simpan_pinjam",
          "pengawas",
          "bendahara",
          "payroll",
        ],
        requiresMemberVerified: true,
      },
      {
        title: "Jabatan",
        icon: Shield,
        href: "/dashboard/levels",
        roles: ["ketua", "divisi_simpan_pinjam", "pengawas"],
        requiresMemberVerified: true,
      },
      {
        title: "Golongan",
        icon: AlignVerticalJustifyEnd,
        href: "/dashboard/golongan",
        roles: [
          "ketua",
          "divisi_simpan_pinjam",
          "pengawas",
          "bendahara",
          "payroll",
        ],
        requiresMemberVerified: true,
      },
      {
        title: "Pengaturan",
        icon: Settings,
        href: "/dashboard/settings",
        roles: ["ketua", "divisi_simpan_pinjam"],
        requiresMemberVerified: true,
      },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const hasAccess = (roles?: string[]) => {
    if (!roles) return true;
    return user?.roles?.some((role) => roles.includes(role));
  };

  const isMemberVerified = user?.memberVerified || false;
  const isAdmin = user?.roles.find(
    (role) =>
      role === "ketua" ||
      role === "divisi_simpan_pinjam" ||
      role === "pengawas" ||
      role === "bendahara" ||
      role === "payroll" ||
      role === "shopkeeper"
  );

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <Image
                  src="/assets/logo.svg"
                  alt="Logo"
                  width={32}
                  height={32}
                />
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Koperasi</span>
                  <span className="text-xs text-muted-foreground">
                    Surya Niaga Kamorina
                  </span>
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
                const isDisabled =
                  item.requiresMemberVerified && !isMemberVerified;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild={!isDisabled}
                      isActive={isActive}
                      disabled={isDisabled}
                      className={
                        isDisabled ? "opacity-50 cursor-not-allowed" : ""
                      }
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
        {/* Management Menus - Grouped */}
        {isMemberVerified &&
          isAdmin &&
          managementGroups.map((group) => {
            const visibleItems = group.items.filter((item) =>
              hasAccess(item.roles)
            );

            if (visibleItems.length === 0) return null;

            return (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleItems.map((item) => {
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
            );
          })}
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
                    <AvatarImage
                      src={user?.avatar || ""}
                      alt={user?.name}
                      className="object-cover object-center"
                    />
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                      {user ? getInitials(user.name) : "U"}
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
