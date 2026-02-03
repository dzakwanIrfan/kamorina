"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Wallet,
  History,
  TrendingUp,
  PiggyBank,
  Coins,
  RefreshCw,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { useBukuTabungan } from "@/hooks/use-buku-tabungan";
import { SaldoSummaryCard } from "@/components/buku-tabungan/saldo-summary-card";
import { TransactionSummaryCard } from "@/components/buku-tabungan/transaction-summary-card";
import { TransactionList } from "@/components/buku-tabungan/transaction-list";
import { EmptyState } from "@/components/buku-tabungan/empty-state";
import { formatCurrency } from "@/lib/format";
import { useState } from "react";
import { bukuTabunganService } from "@/services/buku-tabungan.service";
import { downloadBlob, generateFilename } from "@/lib/download";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
  colorClass?: string;
}

function StatCard({
  title,
  value,
  icon,
  description,
  colorClass = "text-primary",
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`${colorClass}`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 mb-1" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

export function MyBukuTabungan() {
  const searchParams = useSearchParams();
  const [isExporting, setIsExporting] = useState(false);

  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // Get active tab from URL or default to "overview"
  const activeTab = searchParams.get("tab") || "overview";

  const { tabungan, isLoading, notFound, refetch } = useBukuTabungan({
    includeTransactionSummary: true,
  });

  // Function to handle tab change
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await bukuTabunganService.exportTabunganByUserId(user?.id!);
      const filename = generateFilename("Buku_Tabungan");
      downloadBlob(blob, filename);
      toast.success("Buku tabungan berhasil diekspor");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Gagal mengekspor buku tabungan");
    } finally {
      setIsExporting(false);
    }
  };

  // Show empty state if account not found
  if (!isLoading && notFound) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Buku Tabungan</h2>
          </div>
        </div>

        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Buku Tabungan</h2>
        </div>
        {/* <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button> */}
        <Button
          onClick={handleExport}
          disabled={isExporting || !tabungan}
          className="gap-2"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
          {isExporting ? "Mengekspor..." : "Export Buku Tabungan"}
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : tabungan ? (
          <>
            <StatCard
              title="Total Saldo"
              value={formatCurrency(tabungan.summary.totalSaldo)}
              icon={<Wallet className="h-4 w-4" />}
              description="Saldo keseluruhan"
              colorClass="text-primary"
            />
            <StatCard
              title="Saldo yang Bisa Diambil"
              value={formatCurrency(tabungan.summary.saldoSukarela)}
              icon={<Coins className="h-4 w-4" />}
              description="Tabungan Deposito"
              colorClass="text-blue-600"
            />
            <StatCard
              title="Saldo Pasif"
              value={formatCurrency(
                Number(tabungan.summary.saldoWajib) +
                  Number(tabungan.summary.saldoPokok),
              )}
              icon={<PiggyBank className="h-4 w-4" />}
              description="Iuran wajib"
              colorClass="text-green-600"
            />
            <StatCard
              title="Bunga Deposito"
              value={formatCurrency(tabungan.summary.bungaDeposito)}
              icon={<TrendingUp className="h-4 w-4" />}
              description="Akumulasi bunga"
              colorClass="text-orange-600"
            />
          </>
        ) : null}
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Ringkasan
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Riwayat Transaksi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <SaldoSummaryCard
              summary={tabungan?.summary}
              isLoading={isLoading}
            />
            <TransactionSummaryCard
              summary={tabungan?.transactionSummary}
              isLoading={isLoading}
              title="Ringkasan Total Transaksi"
            />
          </div>

          {/* Account Info */}
          {tabungan?.account && (
            <Card>
              <CardHeader>
                <CardTitle>Informasi Akun</CardTitle>
                <CardDescription>Detail akun tabungan Anda</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Nama</p>
                    <p className="font-medium">{tabungan.account.user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{tabungan.account.user.email}</p>
                  </div>
                  {tabungan.account.user.employee && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          No. Karyawan
                        </p>
                        <p className="font-medium">
                          {tabungan.account.user.employee.employeeNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Departemen
                        </p>
                        <p className="font-medium">
                          {tabungan.account.user.employee.department
                            ?.departmentName || "-"}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
