export interface PdfPageSize {
  /** p.ej. "210mm" */
  width: string;
  /** p.ej. "373.13mm" */
  height: string;
}

/**
 * Puerto del dominio para convertir HTML en un archivo PDF. Implementado en
 * `infrastructure` con Playwright — el dominio/aplicación nunca conocen
 * Playwright directamente.
 */
export interface PdfRenderer {
  renderHtmlToPdf(html: string, outputPath: string, pageSize?: PdfPageSize): Promise<void>;
}
