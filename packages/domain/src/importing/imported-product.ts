/**
 * Producto tal como lo extrajo un `CatalogImporter`, antes de compararlo
 * contra la base de datos local. Todavía no es un `Product` del dominio.
 */
export interface ImportedProduct {
  code: string;
  name: string;
  description: string | null;
  price: number;
  premiumPrice: number | null;
  imagePath: string | null;
  categoryName: string | null;
  /** Página de origen (1-indexed), útil para el reporte de errores/depuración. */
  sourcePage: number;
}
