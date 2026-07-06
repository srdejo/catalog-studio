import { CATALOG_PAGE_SIZE_MM } from './page-size';

/**
 * CSS del catálogo impreso. Deliberadamente simple para esta primera versión
 * funcional — no busca ser pixel-perfect contra el diseño de referencia,
 * pero reutiliza la misma paleta/tipografía para que se sienta consistente.
 * Tamaño de página NO es A4 estándar — coincide con el aspecto real de
 * cover-base.png (ver page-size.ts) para que la portada se muestre completa
 * sin recortes; el mismo HTML se reutiliza para Playwright (PDF) y, en el
 * futuro, para una versión web del catálogo.
 */
export const catalogStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Arial', sans-serif; color: #18181B; }
  /*
   * Alto fijo (no min-height) + overflow:hidden: cada .page es exactamente
   * una página física del PDF. Si algo se desborda, se recorta en vez de
   * arrastrarse silenciosamente a la siguiente página sin su propio
   * header/footer (justo lo que pasaba antes con categorías muy largas).
   */
  .page { width: ${CATALOG_PAGE_SIZE_MM.width}mm; height: ${CATALOG_PAGE_SIZE_MM.height}mm; padding: 16mm; position: relative; overflow: hidden; }

  /*
   * cover-base.png (941x1672) es más angosta/alta que una página A4 — con
   * background-size:cover anclado arriba, la imagen se ajusta por ancho y
   * solo se recorta el sobrante de abajo (pie de contacto), nunca el
   * espacio en blanco reservado para el texto del catálogo.
   */
  .cover-page { padding: 0; background-size: cover; background-position: top center; background-repeat: no-repeat; position: relative; }
  .cover-page-fallback { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 16px; padding: 16mm; }
  .cover-title { font-size: 36px; font-weight: 800; letter-spacing: 0.02em; }
  .cover-subtitle { font-size: 18px; font-weight: 600; letter-spacing: 0.2em; opacity: 0.9; }

  /*
   * Espacio en blanco de la imagen real: entre el encabezado y el logo LEP
   * (aprox. 12%-39% de la altura de página). Se centra el bloque de texto
   * dentro de esa franja (en vez de un "top" fijo) para que quede holgado y
   * bien ubicado sin importar el alto exacto del contenido.
   */
  .cover-text-block { position: absolute; top: 12%; height: 27%; left: 0; right: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; color: #fff; text-align: center; }
  .cover-year-text { font-size: 34px; font-weight: 700; letter-spacing: 0.35em; padding-left: 0.35em; text-shadow: 0 2px 10px rgba(0,0,0,.4); }
  .cover-catalogo-text { font-size: 80px; line-height: 1; font-weight: 900; letter-spacing: 0.02em; font-family: Arial, sans-serif; text-shadow: 0 3px 16px rgba(0,0,0,.45); }
  .cover-divider { width: 55%; height: 2px; background: rgba(255,255,255,0.85); }
  .cover-month-text { font-size: 30px; font-weight: 700; letter-spacing: 0.4em; padding-left: 0.4em; text-shadow: 0 2px 10px rgba(0,0,0,.4); }

  /*
   * Índice y páginas de productos comparten fondo gris de página (para que
   * el gris del banner del header/footer no contraste con el fondo) y no
   * llevan el padding genérico de .page — el header/footer van pegados al
   * borde físico de la página; el padding lateral se aplica dentro de cada
   * fila (header/body/footer) por separado.
   */
  .index-page, .products-page { display: flex; flex-direction: column; padding: 0; background: #E5E5E5; }

  .page-header-banner { display: block; width: 100%; height: auto; }
  .page-header-text { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 8px 16mm; border-bottom: 2px solid #0A0A0B; }
  .page-header-title { font-size: 17px; font-weight: 800; letter-spacing: -0.01em; }
  .page-header-company { font-size: 10.5px; color: #9CA3AF; font-weight: 600; }

  .page-body { flex: 1; padding: 12px 16mm; overflow: hidden; }

  /* Sin fila de texto debajo: el banner queda pegado al borde inferior de
     la página; el número de página es una insignia discreta sobre la
     esquina del banner en vez de ocupar su propia fila. */
  .page-footer { position: relative; }
  .page-footer-banner { display: block; width: 100%; height: auto; }
  .page-footer-number { position: absolute; right: 16mm; bottom: 4px; font-size: 9px; font-family: 'Courier New', monospace; font-weight: 700; color: #9CA3AF; }

  .index-title { font-size: 24px; font-weight: 800; margin-bottom: 16px; }
  .index-row { display: flex; align-items: baseline; gap: 8px; padding: 8px 0; border-bottom: 1px solid #ECECEE; font-size: 14px; }
  .index-row-name { font-weight: 600; }
  .index-row-dots { flex: 1; border-bottom: 1px dotted #D4D4D8; }
  .index-row-count { color: #71717A; font-size: 12px; }

  /* Tarjetas blancas con sombra sobre el fondo gris de la página. */
  .products-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .product-card { background: #fff; border: 1px solid #ECECEE; border-radius: 10px; padding: 8px; break-inside: avoid; box-shadow: 0 1px 3px rgba(16,24,40,.08), 0 1px 2px rgba(16,24,40,.04); }
  /* aspect-ratio 4/3 (no 1:1): con 3 filas por página, una imagen cuadrada
     no deja suficiente alto para nombres de 2 líneas sin desbordar. */
  .product-card-image { width: 100%; aspect-ratio: 4 / 3; background: #fff; border-radius: 6px; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 6px; }
  .product-card-image img { width: 100%; height: 100%; object-fit: contain; }
  .product-card-image-placeholder { font-size: 28px; font-weight: 700; color: #D4D4D8; }

  /* El código es el dato clave para hacer el pedido — insignia grande y
     bien visible arriba de la tarjeta, no un dato chico junto al nombre. */
  .product-card-code-badge { display: inline-flex; align-items: baseline; gap: 5px; border: 1.5px solid #18181B; border-radius: 8px; padding: 4px 9px; margin-bottom: 8px; }
  .product-card-code-label { font-size: 10px; font-weight: 700; letter-spacing: 0.02em; }
  .product-card-code-value { font-size: 17px; font-weight: 900; font-family: 'Courier New', monospace; }

  .product-card-name { font-size: 10.5px; font-weight: 600; margin: 3px 0; line-height: 1.25; max-height: 2.5em; overflow: hidden; }

  /* Tres niveles de precio: premium (rojo), mayorista (negro), detalle (gris,
     usa el mayorista como respaldo cuando no hay precio detalle propio). */
  .product-card-prices { display: flex; justify-content: space-between; gap: 6px; margin-top: 6px; padding-top: 6px; border-top: 1px solid #ECECEE; }
  .price-block { display: flex; flex-direction: column; align-items: flex-start; }
  .price-label { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: #9CA3AF; }
  .price-amount { font-size: 13px; font-weight: 800; }
  .price-premium .price-amount { color: #DC2626; }
  .price-mayorista .price-amount { color: #18181B; }
  .price-detalle .price-amount { color: #71717A; }
`;
