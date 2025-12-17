'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    CheckCircle2,
    XCircle,
    Clock,
    User,
    FileText,
    History,
    AlertTriangle,
    Calendar,
    Banknote,
} from 'lucide-react';
import { toast } from 'sonner';

import {
    DepositWithdrawal,
    DepositWithdrawalStatus,
    DepositWithdrawalStep,
    ApproveWithdrawalDto,
} from '@/types/deposit-withdrawal.types';
import { depositWithdrawalService } from '@/services/deposit-withdrawal.service';
import { handleApiError } from '@/lib/axios';
import { formatCurrency } from '@/lib/format';

interface WithdrawalDetailDialogProps {
    withdrawal: DepositWithdrawal | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    canApprove?: boolean;
}

const statusMap = {
    [DepositWithdrawalStatus.SUBMITTED]: {
        label: 'Submitted',
        variant: 'default' as const,
        icon: Clock
    },
    [DepositWithdrawalStatus.UNDER_REVIEW_DSP]: {
        label: 'Review DSP',
        variant: 'default' as const,
        icon: Clock
    },
    [DepositWithdrawalStatus.UNDER_REVIEW_KETUA]: {
        label: 'Review Ketua',
        variant: 'default' as const,
        icon: Clock
    },
    [DepositWithdrawalStatus.APPROVED_WAITING_DISBURSEMENT]: {
        label: 'Menunggu Pencairan',
        variant: 'default' as const,
        icon: Clock
    },
    [DepositWithdrawalStatus.DISBURSEMENT_IN_PROGRESS]: {
        label: 'Proses Pencairan',
        variant: 'default' as const,
        icon: Clock
    },
    [DepositWithdrawalStatus.COMPLETED]: {
        label: 'Selesai',
        variant: 'default' as const,
        icon: CheckCircle2
    },
    [DepositWithdrawalStatus.REJECTED]: {
        label: 'Ditolak',
        variant: 'destructive' as const,
        icon: XCircle
    },
    [DepositWithdrawalStatus.CANCELLED]: {
        label: 'Dibatalkan',
        variant: 'destructive' as const,
        icon: XCircle
    },
};

const stepMap = {
    [DepositWithdrawalStep.DIVISI_SIMPAN_PINJAM]: 'Divisi Simpan Pinjam',
    [DepositWithdrawalStep.KETUA]: 'Ketua',
    [DepositWithdrawalStep.SHOPKEEPER]: 'Shopkeeper',
    [DepositWithdrawalStep.KETUA_AUTH]: 'Ketua (Otorisasi)',
};

export function WithdrawalDetailDialog({
    withdrawal,
    open,
    onOpenChange,
    onSuccess,
    canApprove = false,
}: WithdrawalDetailDialogProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [notes, setNotes] = useState('');
    const [activeTab, setActiveTab] = useState('details');

    if (!withdrawal) return null;

    const status = statusMap[withdrawal.status];
    const StatusIcon = status.icon;

    const handleProcess = async (decision: 'APPROVED' | 'REJECTED') => {
        if (!withdrawal) return;

        try {
            setIsProcessing(true);
            const dto: ApproveWithdrawalDto = {
                decision,
                notes: notes.trim() || undefined,
            };

            await depositWithdrawalService.processApproval(withdrawal.id, dto);

            toast.success(
                decision === 'APPROVED'
                    ? 'Penarikan berhasil disetujui'
                    : 'Penarikan berhasil ditolak'
            );

            onSuccess?.();
            onOpenChange(false);
            setNotes('');
        } catch (error: any) {
            toast.error(handleApiError(error));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Detail Penarikan Deposito</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="details">
                            <FileText className="h-4 w-4 mr-2" />
                            Detail
                        </TabsTrigger>
                        <TabsTrigger value="timeline">
                            <History className="h-4 w-4 mr-2" />
                            Timeline Proses
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-6 mt-6">
                        {/* Status */}
                        <div className="flex items-center justify-between">
                            <Badge variant={status.variant} className="flex items-center gap-2">
                                <StatusIcon className="h-4 w-4" />
                                {status.label}
                            </Badge>
                            {withdrawal.currentStep && (
                                <Badge variant="outline">
                                    Step: {stepMap[withdrawal.currentStep]}
                                </Badge>
                            )}
                        </div>

                        {/* Withdrawal Number */}
                        <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Nomor Penarikan</p>
                            <p className="text-lg font-bold font-mono">{withdrawal.withdrawalNumber}</p>
                        </div>

                        {/* User Info */}
                        {withdrawal.user && (
                            <div className="rounded-lg border p-4 space-y-3">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Informasi Pemohon
                                </h3>
                                <Separator />
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Nama</p>
                                        <p className="font-medium">{withdrawal.user.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Email</p>
                                        <p className="font-medium">{withdrawal.user.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">No. Karyawan</p>
                                        <p className="font-medium">{withdrawal.user.employee.employeeNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Department</p>
                                        <p className="font-medium">
                                            {withdrawal.user.employee.department?.departmentName || '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Deposit Info */}
                        {withdrawal.depositApplication && (
                            <div className="rounded-lg border p-4 space-y-3">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Banknote className="h-4 w-4" />
                                    Informasi Deposito
                                </h3>
                                <Separator />
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Nomor Deposito</p>
                                        <p className="font-mono font-medium">
                                            {withdrawal.depositApplication.depositNumber}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Saldo Terkumpul</p>
                                        <p className="font-semibold">
                                            {formatCurrency(withdrawal.depositApplication.collectedAmount)}
                                        </p>
                                    </div>
                                    {withdrawal.depositApplication.maturityDate && (
                                        <div>
                                            <p className="text-muted-foreground">Jatuh Tempo</p>
                                            <p className="font-medium">
                                                {format(
                                                    new Date(withdrawal.depositApplication.maturityDate),
                                                    'dd MMM yyyy',
                                                    { locale: id }
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Withdrawal Details */}
                        <div className="rounded-lg border p-4 space-y-3">
                            <h3 className="font-semibold">Detail Penarikan</h3>
                            <Separator />
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Jumlah Penarikan:</span>
                                    <span className="text-lg font-bold">
                                        {formatCurrency(withdrawal.withdrawalAmount)}
                                    </span>
                                </div>

                                {withdrawal.isEarlyWithdrawal && (
                                    <div className="rounded-lg border border-orange-500 bg-orange-50 dark:bg-orange-950/20 p-3 space-y-2">
                                        <div className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span className="font-semibold text-sm">Penarikan Sebelum Jatuh Tempo</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-orange-800 dark:text-orange-200">
                                                Pinalti ({withdrawal.penaltyRate}%):
                                            </span>
                                            <span className="font-semibold text-orange-600">
                                                -{formatCurrency(withdrawal.penaltyAmount)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <Separator />

                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Yang Diterima:</span>
                                    <span className="text-xl font-bold text-green-600">
                                        {formatCurrency(withdrawal.netAmount)}
                                    </span>
                                </div>

                                {withdrawal.bankAccountNumber && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Rekening Tujuan:</span>
                                        <span className="font-mono font-medium">
                                            {withdrawal.bankAccountNumber}
                                        </span>
                                    </div>
                                )}

                                {withdrawal.notes && (
                                    <div className="text-sm">
                                        <p className="text-muted-foreground mb-1">Catatan:</p>
                                        <p className="p-2 bg-muted rounded">{withdrawal.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="rounded-lg border p-4 space-y-3">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Tanggal Penting
                            </h3>
                            <Separator />
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {withdrawal.submittedAt && (
                                    <div>
                                        <p className="text-muted-foreground">Tanggal Submit</p>
                                        <p className="font-medium">
                                            {format(new Date(withdrawal.submittedAt), 'dd MMMM yyyy HH:mm', {
                                                locale: id,
                                            })}
                                        </p>
                                    </div>
                                )}
                                {withdrawal.completedAt && (
                                    <div>
                                        <p className="text-muted-foreground">Tanggal Selesai</p>
                                        <p className="font-medium">
                                            {format(new Date(withdrawal.completedAt), 'dd MMMM yyyy HH:mm', {
                                                locale: id,
                                            })}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Rejection Reason */}
                        {withdrawal.status === DepositWithdrawalStatus.REJECTED && withdrawal.rejectionReason && (
                            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 space-y-2">
                                <h3 className="font-semibold text-destructive">Alasan Penolakan</h3>
                                <p className="text-sm">{withdrawal.rejectionReason}</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="timeline" className="space-y-6 mt-6">
                        {/* Approval Timeline */}
                        <div className="space-y-4">
                            {withdrawal.approvals.map((approval, index) => {
                                const isLast = index === withdrawal.approvals.length - 1;
                                const isPending = !approval.decision;
                                const isApproved = approval.decision === 'APPROVED';
                                const isRejected = approval.decision === 'REJECTED';

                                return (
                                    <div key={approval.id} className="relative">
                                        <div className="flex items-start gap-4">
                                            <div className="flex flex-col items-center">
                                                <div
                                                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${isApproved
                                                        ? 'border-green-500 bg-green-50 text-green-600 dark:bg-green-950'
                                                        : isRejected
                                                            ? 'border-red-500 bg-red-50 text-red-600 dark:bg-red-950'
                                                            : 'border-gray-300 bg-gray-50 text-gray-400 dark:bg-gray-900'
                                                        }`}
                                                >
                                                    {isApproved ? (
                                                        <CheckCircle2 className="h-5 w-5" />
                                                    ) : isRejected ? (
                                                        <XCircle className="h-5 w-5" />
                                                    ) : (
                                                        <Clock className="h-5 w-5" />
                                                    )}
                                                </div>
                                                {!isLast && (
                                                    <div
                                                        className={`mt-2 h-full w-0.5 ${isApproved ? 'bg-green-500' : 'bg-gray-200'
                                                            }`}
                                                        style={{ minHeight: '40px' }}
                                                    />
                                                )}
                                            </div>

                                            <div className="flex-1 space-y-1 pb-8">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-semibold">{stepMap[approval.step]}</h4>
                                                    {isPending && (
                                                        <Badge variant="outline" className="gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            Menunggu
                                                        </Badge>
                                                    )}
                                                    {isApproved && (
                                                        <Badge variant="default" className="gap-1 bg-green-600">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Disetujui
                                                        </Badge>
                                                    )}
                                                    {isRejected && (
                                                        <Badge variant="destructive" className="gap-1">
                                                            <XCircle className="h-3 w-3" />
                                                            Ditolak
                                                        </Badge>
                                                    )}
                                                </div>

                                                {approval.approver && (
                                                    <p className="text-sm text-muted-foreground">
                                                        oleh {approval.approver.name}
                                                    </p>
                                                )}

                                                {approval.decidedAt && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {format(new Date(approval.decidedAt), 'dd MMMM yyyy HH:mm', {
                                                            locale: id,
                                                        })}
                                                    </p>
                                                )}

                                                {approval.notes && (
                                                    <p className="text-sm mt-2 p-2 bg-muted rounded">{approval.notes}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Disbursement Info */}
                            {withdrawal.disbursement && (
                                <div className="relative">
                                    <div className="flex items-start gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950">
                                                <Banknote className="h-5 w-5" />
                                            </div>
                                            {withdrawal.authorization && (
                                                <div className="mt-2 h-full w-0.5 bg-blue-500" style={{ minHeight: '40px' }} />
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-1 pb-8">
                                            <h4 className="font-semibold">Pencairan Dana (Shopkeeper)</h4>
                                            <p className="text-sm text-muted-foreground">
                                                oleh {withdrawal.disbursement.processedByUser.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(
                                                    new Date(withdrawal.disbursement.transactionDate),
                                                    'dd MMMM yyyy HH:mm',
                                                    { locale: id }
                                                )}
                                            </p>
                                            {withdrawal.disbursement.notes && (
                                                <p className="text-sm mt-2 p-2 bg-muted rounded">
                                                    {withdrawal.disbursement.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Authorization Info */}
                            {withdrawal.authorization && (
                                <div className="relative">
                                    <div className="flex items-start gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-green-500 bg-green-50 text-green-600 dark:bg-green-950">
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <h4 className="font-semibold">Otorisasi Final (Ketua)</h4>
                                            <p className="text-sm text-muted-foreground">
                                                oleh {withdrawal.authorization.authorizedByUser.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(
                                                    new Date(withdrawal.authorization.authorizationDate),
                                                    'dd MMMM yyyy HH:mm',
                                                    { locale: id }
                                                )}
                                            </p>
                                            {withdrawal.authorization.notes && (
                                                <p className="text-sm mt-2 p-2 bg-muted rounded">
                                                    {withdrawal.authorization.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Action Buttons for Approvers */}
                {canApprove &&
                    [
                        DepositWithdrawalStatus.SUBMITTED,
                        DepositWithdrawalStatus.UNDER_REVIEW_DSP,
                        DepositWithdrawalStatus.UNDER_REVIEW_KETUA,
                    ].includes(withdrawal.status) &&
                    withdrawal.currentStep && (
                        <>
                            <Separator />
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="notes">Catatan (Opsional)</Label>
                                    <Textarea
                                        id="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Tambahkan catatan..."
                                        className="mt-2"
                                        rows={3}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        variant="destructive"
                                        onClick={() => handleProcess('REJECTED')}
                                        disabled={isProcessing}
                                        className="flex-1"
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Tolak
                                    </Button>
                                    <Button
                                        onClick={() => handleProcess('APPROVED')}
                                        disabled={isProcessing}
                                        className="flex-1"
                                    >
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Setujui
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
            </DialogContent>
        </Dialog>
    );
}