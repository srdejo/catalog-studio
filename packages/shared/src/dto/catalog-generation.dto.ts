export type PriceKey = 'premiumPrice' | 'price' | 'detailPrice';

export interface GeneratePdfDto {
  month: string;
  year: string;
  /** Si se omite, se incluyen todos los productos activos. */
  productIds?: string[];
  /** Si se omite, se muestran los 3 precios. */
  visiblePrices?: PriceKey[];
}

export interface GeneratePdfResultDto {
  canceled: boolean;
  filePath: string | null;
}
