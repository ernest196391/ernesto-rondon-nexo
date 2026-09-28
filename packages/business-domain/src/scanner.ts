import type { ScanResult } from "./types";

export function normalizeBarcode(raw: string): string {
  return raw.trim().replace(/\s+/g, "");
}

export function createScanResult(raw: string, source: ScanResult["source"], format?: string, scannedAt = new Date().toISOString()): ScanResult {
  const value = normalizeBarcode(raw);
  if (!value) throw new Error("Empty barcode");
  return { value, source, format, scannedAt };
}

export function matchesProductBarcode(productBarcodes: string[], scan: ScanResult): boolean {
  return productBarcodes.some((code) => normalizeBarcode(code) === scan.value);
}
