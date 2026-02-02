"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileSpreadsheet, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { SaldoSummaryCard } from "@/components/buku-tabungan/saldo-summary-card";
import { UserTransactionList } from "@/components/buku-tabungan/user-transaction-list";

import { bukuTabunganService } from "@/services/buku-tabungan.service";
import { BukuTabunganResponse } from "@/types/buku-tabungan.types";
import { formatCurrency, toNumber } from "@/lib/format";
import { downloadBlob, generateFilename } from "@/lib/download";

interface AccountDetailPageProps {
  params: Promise<{ userId: string }>;
}

export default function AccountDetailPage({ params }: AccountDetailPageProps) {
  const { userId } = use(params);
  const router = useRouter();

  const [tabungan, setTabungan] = useState<BukuTabunganResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTabungan = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use admin endpoint to get specific user's account
      const response = await bukuTabunganService.getAccountByUserId(userId, {
        includeTransactionSummary: true,
      });
      setTabungan(response);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const message =
          err.response?.data?.message || "Gagal memuat data tabungan";

        if (status === 403) {
          setError("Anda tidak memiliki akses ke halaman ini");
        } else if (status === 404) {
          setError("Buku tabungan tidak ditemukan");
        } else {
          setError(message);
        }
        toast.error(message);
      } else {
        setError("Terjadi kesalahan");
        toast.error("Terjadi kesalahan");
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTabungan();
  }, [fetchTabungan]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await bukuTabunganService.exportTabunganByUserId(userId);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            Detail Buku Tabungan
          </h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <Button onClick={() => fetchTabungan()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tabungan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            Detail Buku Tabungan
          </h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Alert>
              <AlertDescription>Data tabungan tidak ditemukan</AlertDescription>
            </Alert>
            <Button
              onClick={() => router.back()}
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userName =
    tabungan.account.user.employee?.fullName || tabungan.account.user.name;

  return (
    <div className="space-y-6">
      {/* Header with back button and user name */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{userName}</h1>
          <p className="text-muted-foreground">Detail Buku Tabungan Anggota</p>
        </div>
      </div>
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

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Anggota</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Nama</p>
              <p className="font-medium">{userName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <p className="font-medium">{tabungan.account.user.email}</p>
            </div>
            {tabungan.account.user.employee && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">NIP</p>
                  <p className="font-medium font-mono">
                    {tabungan.account.user.employee.employeeNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Departemen
                  </p>
                  <Badge variant="outline">
                    {tabungan.account.user.employee.department
                      ?.departmentName || "-"}
                  </Badge>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Saldo Summary */}
      <SaldoSummaryCard summary={tabungan.summary} />

      {/* Transaction Summary if available */}
      {tabungan.transactionSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">
                  Iuran Pendaftaran
                </p>
                <p className="font-semibold text-green-600">
                  {formatCurrency(
                    toNumber(tabungan.transactionSummary.totalIuranPendaftaran),
                  )}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">
                  Iuran Bulanan
                </p>
                <p className="font-semibold text-green-600">
                  {formatCurrency(
                    toNumber(tabungan.transactionSummary.totalIuranBulanan),
                  )}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">
                  Tabungan Deposito
                </p>
                <p className="font-semibold text-green-600">
                  {formatCurrency(
                    toNumber(tabungan.transactionSummary.totalTabunganDeposito),
                  )}
                </p>
              </div>
              {/* <div className="text-center p-4 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground mb-1">SHU</p>
                                <p className="font-semibold text-green-600">
                                    {formatCurrency(
                                        toNumber(tabungan.transactionSummary.totalShu)
                                    )}
                                </p>
                            </div> */}
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Bunga</p>
                <p className="font-semibold text-green-600">
                  {formatCurrency(
                    toNumber(tabungan.transactionSummary.totalBunga),
                  )}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">
                  Total Penarikan
                </p>
                <p className="font-semibold text-red-600">
                  {formatCurrency(
                    toNumber(tabungan.transactionSummary.totalPenarikan),
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History Table */}
      <UserTransactionList userId={userId} />
    </div>
  );
}
