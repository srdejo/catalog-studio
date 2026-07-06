/**
 * Tamaño de página del catálogo, en milímetros. No es A4 estándar a propósito:
 * se ajusta al aspecto real de `cover-base.png` (941x1672px) para que la
 * portada se muestre completa (logos arriba, pie de contacto abajo) sin que
 * `background-size: cover` tenga que recortar nada por diferencia de aspecto.
 * Todas las páginas del documento comparten este mismo tamaño.
 */
const PAGE_WIDTH_MM = 210;
const COVER_ASPECT_RATIO = 1672 / 941; // alto / ancho de cover-base.png

export const CATALOG_PAGE_SIZE_MM = {
  width: PAGE_WIDTH_MM,
  height: Math.round(PAGE_WIDTH_MM * COVER_ASPECT_RATIO * 100) / 100,
};
