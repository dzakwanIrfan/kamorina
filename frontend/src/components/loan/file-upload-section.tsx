'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Loader2, FileText, X } from 'lucide-react';

interface FileUploadSectionProps {
  uploadedFiles: string[];
  isUploading: boolean;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  disabled?: boolean;
}

export function FileUploadSection({
  uploadedFiles,
  isUploading,
  onFileUpload,
  onRemoveFile,
  disabled,
}: FileUploadSectionProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">Lampiran Dokumen</label>
        <p className="text-sm text-muted-foreground">
          Upload maksimal 5 file (PDF, DOC, XLS, JPG, PNG). Maksimal 10MB per file.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isUploading || uploadedFiles.length >= 5 || disabled}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </>
          )}
        </Button>
        <Badge variant="secondary">{uploadedFiles.length} / 5 file</Badge>
      </div>

      <input
        id="file-upload"
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
        onChange={onFileUpload}
        className="hidden"
      />

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm truncate max-w-[300px]">
                  {file.split('/').pop()}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveFile(index)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}