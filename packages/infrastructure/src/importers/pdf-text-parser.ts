import type { ImportError, ImportedProduct } from '@catalog-studio/domain';
import type { PdfPageText } from './pdf-types';

/** Punto de referencia (típicamente la posición del código) desde donde
 * buscar la imagen del producto más cercana en la misma página/columna. */
export interface PdfImageAnchor {
  page: number;
  x: number;
  y: number;
}

export type ParsedProductCandidate = Omit<ImportedProduct, 'imagePath'> & {
  imageAnchor?: PdfImageAnchor;
};

export interface PdfTextParseResult {
  products: ParsedProductCandidate[];
  errors: ImportError[];
}

/**
 * Estrategia de interpretación del texto ya posicionado de un PDF.
 * Cada proveedor puede tener un layout de tabla distinto — esta interfaz
 * permite añadir `JapaniRacerPdfTextParser`, `HondaPdfTextParser`, etc. en el
 * futuro, seleccionados automáticamente por `supports()`.
 */
export interface PdfTextParser {
  readonly name: string;
  supports(pages: PdfPageText[]): boolean;
  parse(pages: PdfPageText[]): PdfTextParseResult;
}
