"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, AlertCircle, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { loanService } from "@/services/loan.service";
import { loanRepaymentService } from "@/services/loan-repayment.service";
import { LoanStatus, LoanApplication } from "@/types/loan.types";
import { RepaymentCalculation } from "@/types/loan-repayment.types";

const formatIDR = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const formSchema = z.object({
  loanApplicationId: z.string().min(1, {
    message: "Silakan pilih pinjaman yang akan dilunasi",
  }),
  isAgreedByMember: z.boolean().refine((val) => val === true, {
    message: "Anda harus menyetujui syarat dan ketentuan pelunasan",
  }),
});

interface CreateRepaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateRepaymentDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateRepaymentDialogProps) {
  const [step, setStep] = useState<"select-loan" | "confirm">("select-loan");
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState(false);
  const [calculation, setCalculation] = useState<RepaymentCalculation | null>(
    null
  );
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInstallmentsOpen, setIsInstallmentsOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isAgreedByMember: false,
    },
  });

  // Fetch active loans when dialog opens
  useEffect(() => {
    if (open) {
      fetchActiveLoans();
      setStep("select-loan");
      setCalculation(null);
      form.reset();
    }
  }, [open]);

  const fetchActiveLoans = async () => {
    try {
      setIsLoadingLoans(true);
      const response = await loanService.getMyLoans({
        status: LoanStatus.DISBURSED,
        limit: 100,
      });
      setLoans(response.data);
    } catch (error) {
      console.error("Error fetching loans:", error);
      toast.error("Gagal memuat data pinjaman aktif");
    } finally {
      setIsLoadingLoans(false);
    }
  };

  const handleLoanSelect = async (loanId: string) => {
    form.setValue("loanApplicationId", loanId);
    if (loanId) {
      try {
        setIsCalculating(true);
        const calc = await loanRepaymentService.getRepaymentCalculation(loanId);
        setCalculation(calc);
      } catch (error) {
        console.error("Error calculating repayment:", error);
        toast.error("Gagal menghitung jumlah pelunasan");
        setCalculation(null);
      } finally {
        setIsCalculating(false);
      }
    } else {
      setCalculation(null);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      await loanRepaymentService.createRepayment(values);
      toast.success("Pengajuan pelunasan berhasil dibuat");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error submitting repayment:", error);
      toast.error(
        error.response?.data?.message || "Gagal membuat pengajuan pelunasan"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedLoanId = form.watch("loanApplicationId");
  const selectedLoan = loans.find((l) => l.id === selectedLoanId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajukan Pelunasan Pinjaman</DialogTitle>
          <DialogDescription>
            Pilih pinjaman yang ingin dilunasi.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="loanApplicationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pilih Pinjaman</FormLabel>
                  <Select
                    onValueChange={(value) => handleLoanSelect(value)}
                    defaultValue={field.value}
                    disabled={isLoadingLoans || isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingLoans
                              ? "Memuat..."
                              : "Pilih pinjaman aktif"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loans.map((loan) => (
                        <SelectItem key={loan.id} value={loan.id}>
                          {loan.loanNumber} - {loan.loanType.replace("_", " ")}{" "}
                          ({formatIDR(loan.loanAmount)})
                        </SelectItem>
                      ))}
                      {loans.length === 0 && !isLoadingLoans && (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Tidak ada pinjaman aktif
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isCalculating && (
              <div className="flex items-center justify-center py-4 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengambil informasi pelunasan...
              </div>
            )}

            {calculation && selectedLoan && (
              <>
                {/* Accordion untuk Tabel Cicilan */}
                {selectedLoan.loanInstallments &&
                  selectedLoan.loanInstallments.length > 0 && (
                    <Collapsible
                      open={isInstallmentsOpen}
                      onOpenChange={setIsInstallmentsOpen}
                      className="space-y-2"
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                          type="button"
                        >
                          <span className="font-semibold">
                            Informasi Cicilan (
                            {selectedLoan.loanInstallments.length} bulan)
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              isInstallmentsOpen ? "rotate-180" : ""
                            }`}
                          />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-2">
                        <div className="rounded-md border overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[50px] text-center">
                                  No
                                </TableHead>
                                <TableHead>Jatuh Tempo</TableHead>
                                <TableHead className="text-right">
                                  Jumlah
                                </TableHead>
                                <TableHead className="text-center">
                                  Status
                                </TableHead>
                                <TableHead>Tanggal Bayar</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedLoan.loanInstallments.map(
                                (installment) => (
                                  <TableRow key={installment.id}>
                                    <TableCell className="text-center font-medium">
                                      {installment.installmentNumber}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {format(
                                        new Date(installment.dueDate),
                                        "dd MMMM yyyy",
                                        { locale: id }
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                      {formatIDR(installment.amount)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {installment.isPaid ? (
                                        <Badge
                                          variant="default"
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          Lunas
                                        </Badge>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="text-muted-foreground"
                                        >
                                          Belum Lunas
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {installment.paidAt ? (
                                        <span className="text-muted-foreground">
                                          {format(
                                            new Date(installment.paidAt),
                                            "dd MMM yyyy HH:mm",
                                            { locale: id }
                                          )}
                                        </span>
                                      ) : (
                                        "-"
                                      )}
                                    </TableCell>
                                  </TableRow>
                                )
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                {/* Ringkasan Informasi Pelunasan */}
                <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
                  <h4 className="font-semibold text-sm flex items-center">
                    <span className="bg-primary/10 text-primary p-1 rounded mr-2">
                      <Check className="h-4 w-4" />
                    </span>
                    Ringkasan Informasi Pelunasan
                  </h4>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block">
                        Total Pinjaman
                      </span>
                      <span className="font-medium">
                        {formatIDR(calculation.totalLoanAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">
                        Total Terbayar
                      </span>
                      <span className="font-medium">
                        {calculation.totalPaid !== null || NaN
                          ? formatIDR(calculation.totalPaid)
                          : "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">
                        Sisa Angsuran
                      </span>
                      <span className="font-medium">
                        {calculation.remainingInstallments} bulan
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">
                        Total Yang Harus Dibayar
                      </span>
                      <span className="font-bold text-lg text-primary">
                        {formatIDR(calculation.remainingAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {calculation && (
              <FormField
                control={form.control}
                name="isAgreedByMember"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Saya menyetujui jumlah pelunasan ini
                      </FormLabel>
                      <FormDescription>
                        Dengan mencentang ini, saya mengajukan permohonan
                        pelunasan pinjaman dan jika disetujui proses pelunasan
                        saya bersedia melunasi dengan potong gaji.
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={
                  !calculation || !form.formState.isValid || isSubmitting
                }
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Ajukan Pelunasan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
