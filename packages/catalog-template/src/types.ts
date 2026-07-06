import type { CategoryDto, ProductDto, SettingsDto } from '@catalog-studio/shared';

/**
 * Producto listo para maquetar: igual a `ProductDto` pero con la imagen ya
 * resuelta como data URI (o null) — este paquete es puro React/HTML, nunca
 * toca el sistema de archivos, así que la conversión ocurre antes, en
 * `application`/`infrastructure`.
 */
export interface ProductForTemplate extends ProductDto {
  imageDataUri: string | null;
}

export interface CatalogTemplateData {
  settings: SettingsDto;
  logoDataUri: string | null;
  /**
   * Portada de marca fija (p.ej. `cover-base.png`) sobre la que se
   * superponen el año y el mes — el resto del diseño de la portada
   * (logos, título "CATALOGO", pie de contacto) ya viene incrustado en la
   * imagen y no cambia entre exportaciones.
   */
  coverImageDataUri: string | null;
  /** Banner fijo (`header.png`) que se repite arriba de cada página de índice/productos. */
  headerImageDataUri: string | null;
  /** Banner fijo (`footer.png`) que se repite abajo de cada página de índice/productos. */
  footerImageDataUri: string | null;
  month: string;
  year: string;
  categories: CategoryDto[];
  products: ProductForTemplate[];
}
