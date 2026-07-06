export type ProductDiffStatus = 'new' | 'updated' | 'unchanged' | 'error';

export interface ProductDiffDto {
  code: string;
  status: ProductDiffStatus;
  name: string;
  changedFields: string[];
  /** Solo para 'updated': valores antes/después de los campos que cambiaron. */
  before: Record<string, string | number | null> | null;
  after: Record<string, string | number | null> | null;
}

export interface ImportErrorDto {
  page: number | null;
  message: string;
  raw?: string;
}

export interface ImportSummaryDto {
  newCount: number;
  updatedCount: number;
  unchangedCount: number;
  errorCount: number;
}

export interface ImportPreviewDto {
  importId: string;
  fileName: string;
  summary: ImportSummaryDto;
  items: ProductDiffDto[];
  errors: ImportErrorDto[];
}

export interface ConfirmImportDto {
  importId: string;
  /** Si se omite, se aplican todos los items con status 'new' o 'updated'. */
  codes?: string[];
}

export interface ConfirmImportResultDto {
  createdCount: number;
  updatedCount: number;
}
