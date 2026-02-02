/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(
  prefix: string,
  extension: string = "xlsx",
): string {
  const timestamp = new Date().getTime();
  return `${prefix}_${timestamp}.${extension}`;
}
