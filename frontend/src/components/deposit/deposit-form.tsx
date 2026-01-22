"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import { FaRupiahSign } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { depositService } from "@/services/deposit.service";
import { handleApiError } from "@/lib/axios";
import { useDepositConfig } from "@/hooks/use-deposit-config";

interface DepositFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export function DepositForm({ onSuccess, onCancel }: DepositFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: config, isLoading: isLoadingConfig } = useDepositConfig();

  const formSchema = z.object({
    depositAmountCode: z.string().min(1, "Pilih jumlah setoran bulanan"),
    depositTenorCode: z.string().min(1, "Pilih jangka waktu"),
    agreedToTerms: z.boolean().refine((val) => val === true, {
      message: "Anda harus menyetujui syarat dan ketentuan",
    }),
  });

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      depositAmountCode: "",
      depositTenorCode: "",
      agreedToTerms: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      // Create directly
      await depositService.create({
        depositAmountCode: data.depositAmountCode,
        depositTenorCode: data.depositTenorCode,
        agreedToTerms: data.agreedToTerms,
      });

      toast.success("Pengajuan tabungan deposito berhasil disubmit! ");
      onSuccess();
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingConfig) {
    return (
      <Card className="w-full max-w-5xl mx-auto">
        <CardHeader className="space-y-1 px-4 sm:px-6">
          <Skeleton className="h-7 w-48 sm:w-64" />
          <Skeleton className="h-4 w-64 sm:w-96 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6 px-4 sm:px-6">
          <div>
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-20 sm:h-24 w-full" />
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 sm:h-24 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card className="w-full max-w-5xl mx-auto">
        <CardContent className="py-10 px-4 sm:px-6">
          <Alert variant="destructive">
            <AlertTitle>Gagal memuat konfigurasi</AlertTitle>
            <AlertDescription>
              Tidak dapat memuat opsi tabungan deposito. Silakan coba lagi
              nanti.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader className="space-y-1 px-4 sm:px-6">
        <CardTitle className="text-xl sm:text-2xl">
          Formulir Pengajuan Tabungan Deposito
        </CardTitle>
        <CardDescription className="text-sm">
          Pilih jumlah setoran bulanan dan jangka waktu menabung. Setoran akan
          dipotong otomatis dari gaji bulanan Anda.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Deposit Amount */}
            <FormField
              control={form.control}
              name="depositAmountCode"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <div className="flex flex-col">
                    <FormLabel className="text-base font-semibold">
                      Setoran Bulanan
                    </FormLabel>
                    <FormDescription className="text-xs sm:text-sm">
                      Jumlah uang yang akan dipotong dari gaji setiap bulan
                    </FormDescription>
                  </div>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
                    >
                      {config.amounts.map((option) => (
                        <div key={option.code}>
                          <RadioGroupItem
                            value={option.code}
                            id={option.code}
                            className="peer sr-only"
                          />
                          <label
                            htmlFor={option.code}
                            className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-card hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 dark:peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all p-3 sm:p-4 h-20 sm:h-24"
                          >
                            <FaRupiahSign className="mb-1 sm:mb-2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground peer-data-[state=checked]:text-primary" />
                            <span className="text-sm sm:text-base font-bold text-center leading-tight">
                              {option.label}
                            </span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                              /bulan
                            </span>
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Deposit Tenor */}
            <FormField
              control={form.control}
              name="depositTenorCode"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <div className="flex flex-col">
                    <FormLabel className="text-base font-semibold">
                      Jangka Waktu Menabung
                    </FormLabel>
                    <FormDescription className="text-xs sm:text-sm">
                      Berapa bulan Anda akan menabung dengan setoran bulanan
                    </FormDescription>
                  </div>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
                    >
                      {config.tenors.map((option) => (
                        <div key={option.code}>
                          <RadioGroupItem
                            value={option.code}
                            id={option.code}
                            className="peer sr-only"
                          />
                          <label
                            htmlFor={option.code}
                            className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-card hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 dark:peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all p-3 sm:p-4 h-20 sm:h-24"
                          >
                            <CalendarIcon className="mb-1 sm:mb-2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            <span className="text-sm sm:text-base font-bold">
                              {option.label}
                            </span>
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Terms and Conditions */}
            <FormField
              control={form.control}
              name="agreedToTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 sm:p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none flex-1">
                    <FormLabel className="text-xs sm:text-sm font-semibold">
                      DENGAN INI SAYA MENGAJUKAN TABUNGAN DEPOSITO DAN BERSEDIA
                      DIPOTONG GAJI
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Saya menyetujui bahwa setoran deposito akan dipotong
                      otomatis dari gaji bulanan saya sesuai jumlah dan jangka
                      waktu yang dipilih.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* Info Box */}
            <Alert className="bg-muted/50 dark:bg-muted/20">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle className="text-sm sm:text-base">
                Informasi Penting
              </AlertTitle>
              <AlertDescription className="text-xs sm:text-sm space-y-2 mt-2">
                <ul className="list-disc list-inside space-y-1. 5">
                  <li>
                    <strong>Setoran bulanan</strong> akan dipotong otomatis dari
                    gaji setiap bulan
                  </li>
                  <li>Pengajuan akan melalui 2 tahap approval: DSP → Ketua</li>
                  <li>
                    Setelah disetujui, pemotongan akan dimulai pada periode gaji
                    berikutnya
                  </li>
                  <li>
                    Suku bunga:{" "}
                    <strong>{config.interestRate}% per tahun</strong>
                  </li>
                  <li>
                    Dana beserta bunga dapat dicairkan setelah{" "}
                    <strong>jatuh tempo</strong>
                  </li>
                  <li>
                    Perubahan setoran atau tenor hanya bisa dilakukan dengan
                    mengajukan <strong>Perubahan Deposito</strong> (dikenakan
                    biaya admin)
                  </li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="w-full sm:flex-1 text-sm sm:text-base"
                >
                  Batal
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:flex-1 text-sm sm:text-base"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit Pengajuan
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
