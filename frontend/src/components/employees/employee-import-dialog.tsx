'use client';

import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

import { employeeService } from '@/services/employee.service';

interface EmployeeImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EmployeeImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: EmployeeImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: Array<{ row: number; employeeNumber: string; error: string }>;
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('File harus berformat CSV');
        return;
      }
      setFile(selectedFile);
      setImportResult(null);
      setValidationErrors([]);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await employeeService.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employee-template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Template berhasil diunduh');
    } catch (error: any) {
      toast.error('Gagal mengunduh template');
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Pilih file CSV terlebih dahulu');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setValidationErrors([]);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const result = await employeeService.importFromCSV(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!result.success) {
        // Validation errors
        setValidationErrors(result.errors || []);
        toast.error('Validasi CSV gagal');
      } else if (result.data) {
        // Import completed
        setImportResult(result.data);
        
        if (result.data.failed === 0) {
          toast.success(`Berhasil mengimport ${result.data.success} karyawan`);
          onSuccess();
          setTimeout(() => {
            onOpenChange(false);
            resetForm();
          }, 2000);
        } else {
          toast.warning(
            `Import selesai: ${result.data.success} berhasil, ${result.data.failed} gagal`
          );
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengimport data');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setImportResult(null);
    setValidationErrors([]);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      onOpenChange(false);
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Data Karyawan</DialogTitle>
          <DialogDescription>
            Upload file CSV untuk mengimport data karyawan secara massal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download Section */}
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertTitle>Format CSV</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>File CSV harus memiliki kolom berikut:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>employeeNumber</strong>: Nomor Induk Karyawan (Maksimal 10 digit)</li>
                <li><strong>fullName</strong>: Nama lengkap karyawan</li>
                <li><strong>isActive</strong>: Status (Aktif / Tidak Aktif)</li>
              </ul>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="mt-2"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </AlertDescription>
          </Alert>

          {/* File Upload Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">File CSV</label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isUploading}
                className="flex-1 text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
              />
              {file && !isUploading && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetForm}
                  title="Hapus file"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {file && (
              <p className="text-sm text-muted-foreground">
                File dipilih: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Mengimport data...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Validasi</AlertTitle>
              <AlertDescription>
                <ScrollArea className="h-[200px] mt-2">
                  <ul className="space-y-1 text-sm">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </ScrollArea>
              </AlertDescription>
            </Alert>
          )}

          {/* Import Results */}
          {importResult && (
            <div className="space-y-3">
              <Alert variant={importResult.failed === 0 ? 'default' : 'destructive'}>
                {importResult.failed === 0 ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>Hasil Import</AlertTitle>
                <AlertDescription>
                  <div className="flex gap-4 mt-2">
                    <Badge variant="default" className="bg-green-600">
                      Berhasil: {importResult.success}
                    </Badge>
                    <Badge variant="destructive">
                      Gagal: {importResult.failed}
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Error Detail:</label>
                  <ScrollArea className="h-[150px] rounded-md border p-3">
                    <div className="space-y-2">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">Baris {error.row}</span> 
                          {' '}({error.employeeNumber}): {error.error}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            {importResult ? 'Tutup' : 'Batal'}
          </Button>
          {!importResult && (
            <Button
              onClick={handleImport}
              disabled={!file || isUploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Mengimport...' : 'Import'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}