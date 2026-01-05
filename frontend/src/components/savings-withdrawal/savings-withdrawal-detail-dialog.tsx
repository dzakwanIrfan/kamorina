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
    SavingsWithdrawal,
    SavingsWithdrawalStatus,
    SavingsWithdrawalStep,
    ApproveSavingsWithdrawalDto,
} from '@/types/savings-withdrawal.types';
import { savingsWithdrawalService } from '@/services/savings-withdrawal.service';
import { handleApiError } from '@/lib/axios';
import { formatCurrency } from '@/lib/format';

interface SavingsWithdrawalDetailDialogProps {
    withdrawal: SavingsWithdrawal | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    canApprove?: boolean;
}

const statusMap = {
    [SavingsWithdrawalStatus.SUBMITTED]: {
        label: 'Submitted',
        variant: 'default' as const,
        icon: Clock
    },
    [SavingsWithdrawalStatus.UNDER_REVIEW_DSP]: {
        label: 'Review DSP',
        variant: 'default' as const,
        icon: Clock
    },
    [SavingsWithdrawalStatus.UNDER_REVIEW_KETUA]: {
        label: 'Review Ketua',
        variant: 'default' as const,
        icon: Clock
    },
    [SavingsWithdrawalStatus.APPROVED_WAITING_DISBURSEMENT]: {
        label: 'Menunggu Pencairan',
        variant: 'default' as const,
        icon: Clock
    },
    [SavingsWithdrawalStatus.DISBURSEMENT_IN_PROGRESS]: {
        label: 'Proses Pencairan',
        variant: 'default' as const,
        icon: Clock
    },
    [SavingsWithdrawalStatus.COMPLETED]: {
        label: 'Selesai',
        variant: 'default' as const,
        icon: CheckCircle2
    },
    [SavingsWithdrawalStatus.REJECTED]: {
        label: 'Ditolak',
        variant: 'destructive' as const,
        icon: XCircle
    },
    [SavingsWithdrawalStatus.CANCELLED]: {
        label: 'Dibatalkan',
        variant: 'destructive' as const,
        icon: XCircle
    },
};

const stepMap = {
    [SavingsWithdrawalStep.DIVISI_SIMPAN_PINJAM]: 'Divisi Simpan Pinjam',
    [SavingsWithdrawalStep.KETUA]: 'Ketua',
    [SavingsWithdrawalStep.SHOPKEEPER]: 'Shopkeeper',
    [SavingsWithdrawalStep.KETUA_AUTH]: 'Ketua (Otorisasi)',
};

export function SavingsWithdrawalDetailDialog({
    withdrawal,
    open,
    onOpenChange,
    onSuccess,
    canApprove = false,
}: SavingsWithdrawalDetailDialogProps) {
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
            const dto: ApproveSavingsWithdrawalDto = {
                decision,
                notes: notes.trim() || undefined,
            };

            await savingsWithdrawalService.processApproval(withdrawal.id, dto);

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
                    <DialogTitle>Detail Penarikan Tabungan</DialogTitle>
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
                                        <p className="font-medium">{withdrawal.user?.employee?.employeeNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Department</p>
                                        <p className="font-medium">
                                            {withdrawal.user?.employee?.department?.departmentName || '-'}
                                        </p>
                                    </div>
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

                                {withdrawal.hasEarlyDepositPenalty && (
                                    <div className="rounded-lg border border-orange-500 bg-orange-50 dark:bg-orange-950/20 p-3 space-y-2">
                                        <div className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span className="font-semibold text-sm">Pinalti Deposito Belum Jatuh Tempo</span>
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

                                {withdrawal.user?.employee?.bankAccountNumber && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Rekening Tujuan:</span>
                                        <span className="font-mono font-medium">
                                            {withdrawal.user.employee.bankAccountNumber}
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
                                {withdrawal.disbursement && (
                                    <div>
                                        <p className="text-muted-foreground">Tanggal Pencairan</p>
                                        <p className="font-medium">
                                            {format(new Date(withdrawal.disbursement.disbursementDate), 'dd MMMM yyyy', { locale: id })}
                                            {withdrawal.disbursement.disbursementTime && ` ${withdrawal.disbursement.disbursementTime}`}
                                        </p>
                                    </div>
                                )}
                                {withdrawal.authorization && (
                                    <div>
                                        <p className="text-muted-foreground">Tanggal Otorisasi</p>
                                        <p className="font-medium">
                                            {format(new Date(withdrawal.authorization.authorizationDate), 'dd MMMM yyyy', { locale: id })}
                                            {withdrawal.authorization.authorizationTime && ` ${withdrawal.authorization.authorizationTime}`}
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
                        {withdrawal.status === SavingsWithdrawalStatus.REJECTED && withdrawal.rejectionReason && (
                            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 space-y-2">
                                <h3 className="font-semibold text-destructive">Alasan Penolakan</h3>
                                <p className="text-sm">{withdrawal.rejectionReason}</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="timeline" className="space-y-6 mt-6">
                        {/* Approval Timeline */}
                        <div className="space-y-4">
                            {(() => {
                                const timelineSteps = [
                                    {
                                        id: 'dsp',
                                        step: SavingsWithdrawalStep.DIVISI_SIMPAN_PINJAM,
                                        label: stepMap[SavingsWithdrawalStep.DIVISI_SIMPAN_PINJAM],
                                        type: 'approval'
                                    },
                                    {
                                        id: 'ketua',
                                        step: SavingsWithdrawalStep.KETUA,
                                        label: stepMap[SavingsWithdrawalStep.KETUA],
                                        type: 'approval'
                                    },
                                    {
                                        id: 'shopkeeper',
                                        step: SavingsWithdrawalStep.SHOPKEEPER,
                                        label: 'Pencairan Dana (Shopkeeper)',
                                        type: 'disbursement'
                                    },
                                    {
                                        id: 'auth',
                                        step: SavingsWithdrawalStep.KETUA_AUTH,
                                        label: 'Otorisasi Final (Ketua)',
                                        type: 'authorization'
                                    }
                                ];

                                return timelineSteps.map((item, index) => {
                                    const isLast = index === timelineSteps.length - 1;
                                    let status: 'completed' | 'rejected' | 'current' | 'waiting' = 'waiting';
                                    let data: any = null;
                                    let date: string | null = null;
                                    let timeString: string | undefined = undefined;
                                    let actorName: string | null = null;
                                    let notes: string | null = null;

                                    // Determine status and data based on step type
                                    if (item.type === 'approval') {
                                        const approval = withdrawal.approvals.find(a => a.step === item.step);
                                        if (approval) {
                                            status = approval.decision === 'APPROVED' ? 'completed' : 'rejected';
                                            data = approval;
                                            date = approval.decidedAt;
                                            actorName = approval.approver?.name || '-';
                                            notes = approval.notes;
                                        } else if (withdrawal.currentStep === item.step && withdrawal.status !== SavingsWithdrawalStatus.REJECTED) {
                                            status = 'current';
                                        } else if (withdrawal.status === SavingsWithdrawalStatus.REJECTED) {
                                            status = 'waiting'; // effectively cancelled
                                        }
                                    } else if (item.type === 'disbursement') {
                                        if (withdrawal.disbursement) {
                                            status = 'completed';
                                            data = withdrawal.disbursement;
                                            date = withdrawal.disbursement.disbursementDate;
                                            timeString = withdrawal.disbursement.disbursementTime;
                                            actorName = withdrawal.disbursement.processedByUser.name;
                                            notes = withdrawal.disbursement.notes;
                                        } else if (withdrawal.currentStep === SavingsWithdrawalStep.SHOPKEEPER && withdrawal.status !== SavingsWithdrawalStatus.REJECTED) {
                                            status = 'current';
                                        }
                                    } else if (item.type === 'authorization') {
                                        if (withdrawal.authorization) {
                                            status = 'completed';
                                            data = withdrawal.authorization;
                                            date = withdrawal.authorization.authorizationDate;
                                            timeString = withdrawal.authorization.authorizationTime;
                                            actorName = withdrawal.authorization.authorizedByUser.name;
                                            notes = withdrawal.authorization.notes;
                                        } else if (withdrawal.currentStep === SavingsWithdrawalStep.KETUA_AUTH && withdrawal.status !== SavingsWithdrawalStatus.REJECTED) {
                                            status = 'current';
                                        }
                                    }

                                    const isCompleted = status === 'completed';
                                    const isRejected = status === 'rejected';
                                    const isCurrent = status === 'current';
                                    const isWaiting = status === 'waiting';

                                    return (
                                        <div key={item.id} className="relative">
                                            <div className="flex items-start gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div
                                                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${isCompleted
                                                            ? 'border-green-500 bg-green-50 text-green-600 dark:bg-green-950'
                                                            : isRejected
                                                                ? 'border-red-500 bg-red-50 text-red-600 dark:bg-red-950'
                                                                : isCurrent
                                                                    ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950'
                                                                    : 'border-gray-300 bg-gray-50 text-gray-400 dark:bg-gray-900'
                                                            }`}
                                                    >
                                                        {isRejected ? (
                                                            <XCircle className="h-5 w-5" />
                                                        ) : item.type === 'disbursement' ? (
                                                            <Banknote className="h-5 w-5" />
                                                        ) : isCompleted ? (
                                                            <CheckCircle2 className="h-5 w-5" />
                                                        ) : (
                                                            <Clock className={`h-5 w-5 ${isCurrent ? 'animate-pulse' : ''}`} />
                                                        )}
                                                    </div>
                                                    {!isLast && (
                                                        <div
                                                            className={`mt-2 h-full w-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                                                }`}
                                                            style={{ minHeight: '40px' }}
                                                        />
                                                    )}
                                                </div>

                                                <div className="flex-1 space-y-1 pb-8">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className={`font-semibold ${isWaiting ? 'text-muted-foreground' : ''}`}>
                                                            {item.label}
                                                        </h4>
                                                        {isCurrent && (
                                                            <Badge variant="outline" className="gap-1 border-blue-200 bg-blue-50 text-blue-700">
                                                                <Clock className="h-3 w-3" />
                                                                Sedang Proses
                                                            </Badge>
                                                        )}
                                                        {isCompleted && (
                                                            <Badge variant="default" className="gap-1 bg-green-600">
                                                                <CheckCircle2 className="h-3 w-3" />
                                                                Selesai
                                                            </Badge>
                                                        )}
                                                        {isRejected && (
                                                            <Badge variant="destructive" className="gap-1">
                                                                <XCircle className="h-3 w-3" />
                                                                Ditolak
                                                            </Badge>
                                                        )}
                                                        {isWaiting && (
                                                            <Badge variant="outline" className="text-muted-foreground">
                                                                Menunggu
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {!isWaiting && (
                                                        <>
                                                            {actorName && (
                                                                <p className="text-sm text-muted-foreground">
                                                                    oleh {actorName}
                                                                </p>
                                                            )}

                                                            {date && (
                                                                <p className="text-sm text-muted-foreground">
                                                                    {timeString ? (
                                                                        <>
                                                                            {format(new Date(date), 'dd MMMM yyyy', { locale: id })} {timeString}
                                                                        </>
                                                                    ) : (
                                                                        format(new Date(date), 'dd MMMM yyyy HH:mm', { locale: id })
                                                                    )}
                                                                </p>
                                                            )}

                                                            {notes && (
                                                                <p className="text-sm mt-2 p-2 bg-muted rounded">
                                                                    {notes}
                                                                </p>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Action Buttons for Approvers */}
                {canApprove &&
                    [
                        SavingsWithdrawalStatus.SUBMITTED,
                        SavingsWithdrawalStatus.UNDER_REVIEW_DSP,
                        SavingsWithdrawalStatus.UNDER_REVIEW_KETUA,
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