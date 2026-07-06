export interface GeneratePdfDto {
  month: string;
  year: string;
  /** Si se omite, se incluyen todos los productos activos. */
  productIds?: string[];
}

export interface GeneratePdfResultDto {
  canceled: boolean;
  filePath: string | null;
}
