'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { settingsService } from '@/services/setting.service';
import { GroupedSettings, CooperativeSetting, SettingCategory, SettingType } from '@/types/setting.types';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';

const categoryLabels: Record<SettingCategory, string> = {
  MEMBERSHIP: 'Keanggotaan',
  SAVINGS: 'Simpanan',
  LOAN: 'Pinjaman',
  INTEREST: 'Bunga',
  PENALTY: 'Denda',
  GENERAL: 'Umum',
};

const categoryDescriptions: Record<SettingCategory, string> = {
  MEMBERSHIP: 'Pengaturan terkait iuran dan keanggotaan koperasi',
  SAVINGS: 'Pengaturan terkait simpanan dan saldo anggota',
  LOAN: 'Pengaturan terkait pinjaman dan limit',
  INTEREST: 'Pengaturan terkait bunga pinjaman dan simpanan',
  PENALTY: 'Pengaturan terkait denda dan keterlambatan',
  GENERAL: 'Pengaturan umum sistem koperasi',
};

export default function SettingsPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [settings, setSettings] = useState<GroupedSettings>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editedValues, setEditedValues] = useState<Record<string, string>>({});
    const [activeTab, setActiveTab] = useState<SettingCategory>(SettingCategory.MEMBERSHIP);

    const canAccess = user?.roles?.some((role) =>
        ['ketua', 'divisi_simpan_pinjam'].includes(role)
    );

    const canEdit = canAccess;

    useEffect(() => {
        // Redirect if user doesn't have access
        if (!loading && !canAccess) {
            toast.error('Akses Ditolak', {
                description: 'Anda tidak memiliki izin untuk mengakses halaman ini',
            });
            router.push('/dashboard');
            return;
        }

        if (canAccess) {
            loadSettings();
        }
    }, [canAccess, router]);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await settingsService.getAll();
            setSettings(data);
        } catch (error: any) {
            toast.error('Gagal memuat pengaturan', {
                description: error.response?.data?.message || 'Terjadi kesalahan',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleValueChange = (key: string, value: string) => {
        setEditedValues((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSave = async () => {
        if (Object.keys(editedValues).length === 0) {
            toast.info('Tidak ada perubahan untuk disimpan');
            return;
        }

        try {
            setSaving(true);
            const settingsToUpdate = Object.entries(editedValues).map(([key, value]) => ({
                key,
                value,
        }));

        const results = await settingsService.bulkUpdate(settingsToUpdate);

        const successCount = results.filter((r: any) => r.success).length;
        const failCount = results.filter((r: any) => !r.success).length;

        if (failCount === 0) {
            toast.success('Pengaturan berhasil disimpan', {
                description: `${successCount} pengaturan berhasil diperbarui`,
            });
            setEditedValues({});
            await loadSettings();
        } else {
            toast.warning('Beberapa pengaturan gagal disimpan', {
                description: `${successCount} berhasil, ${failCount} gagal`,
            });
            // Show failed items
            results.forEach((r: any) => {
                if (!r.success) {
                    toast.error(`Gagal menyimpan ${r.key}`, {
                    description: r.error,
                    });
                }
            });
        }
        } catch (error: any) {
            toast.error('Gagal menyimpan pengaturan', {
                description: error.response?.data?.message || 'Terjadi kesalahan',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setEditedValues({});
        toast.info('Perubahan dibatalkan');
    };

    const renderSettingInput = (setting: CooperativeSetting) => {
        const value = editedValues[setting.key] ?? setting.value;
        const hasChanges = editedValues.hasOwnProperty(setting.key);

        if (!setting.isEditable || !canEdit) {
        return (
            <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">{setting.label}</Label>
                {!setting.isEditable && (
                <Badge variant="secondary" className="text-xs">
                    Read-only
                </Badge>
                )}
            </div>
            {setting.description && (
                <p className="text-xs text-muted-foreground">{setting.description}</p>
            )}
            <div className="flex items-center gap-2">
                <Input value={value} disabled className="max-w-md" />
                {setting.unit && (
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {setting.unit}
                </span>
                )}
            </div>
            </div>
        );
        }

        switch (setting.type) {
        case SettingType.BOOLEAN:
            return (
            <div className="space-y-2">
                <div className="flex items-center justify-between max-w-md">
                    <div className="space-y-0.5">
                        <Label className="text-sm font-medium">{setting.label}</Label>
                        {setting.description && (
                            <p className="text-xs text-muted-foreground">{setting.description}</p>
                        )}
                    </div>
                    <Switch
                        checked={value === 'true'}
                            onCheckedChange={(checked) =>
                            handleValueChange(setting.key, checked.toString())
                        }
                    />
                </div>
                {hasChanges && (
                    <p className="text-xs text-amber-600">
                        Perubahan belum disimpan
                    </p>
                )}
            </div>
            );

        case SettingType.NUMBER:
            return (
                <div className="space-y-2">
                    <Label className="text-sm font-medium">{setting.label}</Label>
                    {setting.description && (
                        <p className="text-xs text-muted-foreground">{setting.description}</p>
                    )}
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            value={value}
                            onChange={(e) => handleValueChange(setting.key, e.target.value)}
                            className="max-w-md"
                            min={setting.validation?.min}
                            max={setting.validation?.max}
                        />
                        {setting.unit && (
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {setting.unit}
                            </span>
                        )}
                    </div>
                    {hasChanges && (
                        <p className="text-xs text-amber-600">
                            Perubahan belum disimpan
                        </p>
                    )}
                    {setting.validation && (
                    <p className="text-xs text-muted-foreground">
                        {setting.validation.min !== undefined &&
                        `Min: ${setting.validation.min}`}
                        {setting.validation.max !== undefined &&
                        ` | Max: ${setting.validation.max}`}
                    </p>
                    )}
                </div>  
            );

        case SettingType.STRING:
        default:
            return (
                <div className="space-y-2">
                    <Label className="text-sm font-medium">{setting.label}</Label>
                    {setting.description && (
                        <p className="text-xs text-muted-foreground">{setting.description}</p>
                    )}
                    {setting.validation?.enum ? (
                        <select
                            value={value}
                            onChange={(e) => handleValueChange(setting.key, e.target.value)}
                            className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            {setting.validation.enum.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                            ))}
                        </select>
                        ) : (
                        <Input
                            value={value}
                            onChange={(e) => handleValueChange(setting.key, e.target.value)}
                            className="max-w-md"
                        />
                    )}
                    {hasChanges && (
                        <p className="text-xs text-amber-600">
                            Perubahan belum disimpan
                        </p>
                    )}
                </div>
            );
        }
    };

    if (loading) {
        return (
        <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
        );
    }

    const hasUnsavedChanges = Object.keys(editedValues).length > 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pengaturan Sistem</h1>
                    <p className="text-muted-foreground mt-2">
                        Kelola konfigurasi dan parameter sistem koperasi
                    </p>
                </div>
                {canEdit && hasUnsavedChanges && (
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleReset} disabled={saving}>
                        Batal
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Simpan Perubahan
                            </>
                        )}
                    </Button>
                </div>
                )}
            </div>

            {!canEdit && (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        Anda hanya dapat melihat pengaturan. Hubungi Ketua atau Divisi Simpan Pinjam
                        untuk melakukan perubahan.
                    </AlertDescription>
                </Alert>
            )}

            {hasUnsavedChanges && (
                <Alert variant={'destructive'}>
                    <AlertCircle />
                    <AlertDescription>
                        Anda memiliki {Object.keys(editedValues).length} perubahan yang belum
                        disimpan. Jangan lupa untuk menyimpan perubahan Anda.
                    </AlertDescription>
                </Alert>
            )}

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SettingCategory)}>
                <TabsList className="grid w-full grid-cols-6">
                {Object.values(SettingCategory).map((category) => (
                    <TabsTrigger key={category} value={category}>
                        {categoryLabels[category]}
                    </TabsTrigger>
                ))}
                </TabsList>

                {Object.entries(settings).map(([category, categorySettings]) => (
                <TabsContent key={category} value={category} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{categoryLabels[category as SettingCategory]}</CardTitle>
                            <CardDescription>
                                {categoryDescriptions[category as SettingCategory]}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {categorySettings.map((setting, index) => (
                            <div key={setting.id}>
                                {renderSettingInput(setting)}
                                {index < categorySettings.length - 1 && (
                                    <Separator className="mt-6" />
                                )}
                            </div>
                            ))}

                            {categorySettings.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                Tidak ada pengaturan dalam kategori ini
                            </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Last Updated Info */}
                    {categorySettings.some((s) => s.updatedByUser) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Riwayat Perubahan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-xs text-muted-foreground">
                                    {categorySettings
                                    .filter((s) => s.updatedByUser)
                                    .map((setting) => (
                                        <div key={setting.id} className="flex justify-between">
                                        <span>{setting.label}</span>
                                        <span>
                                            Diubah oleh {setting.updatedByUser?.name} pada{' '}
                                            {new Date(setting.updatedAt).toLocaleString('id-ID')}
                                        </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}