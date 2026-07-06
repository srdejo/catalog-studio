import type { PdfPageText, PdfTextItem } from './pdf-types';
import type { PdfTextParser, PdfTextParseResult } from './pdf-text-parser';

const PRICE_REGEX = /^\$\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?$/;
// Palabras de unidad que a veces quedan en su propia línea cuando el nombre
// del producto se ajusta (word-wrap) dentro de la tarjeta.
const UNIT_WORDS = new Set(['UND', 'PAQUETE', 'BULTO', 'KIT', 'JGO', 'PAR', 'CAJA', 'GALON']);

type ItemKind = 'code' | 'price' | 'unit' | 'name';

function classify(text: string): ItemKind {
  const trimmed = text.trim();
  if (PRICE_REGEX.test(trimmed)) return 'price';
  if (UNIT_WORDS.has(trimmed.toUpperCase())) return 'unit';
  // Un código no tiene espacios (es un solo token) y siempre incluye al
  // menos un dígito (p. ej. "AJR47"); esto evita confundir con un código
  // fragmentos de nombre sin espacio pero solo con letras, como "TAPON-PAR"
  // cuando el nombre del producto se ajusta (word-wrap) en varias líneas.
  if (!/\s/.test(trimmed) && trimmed.length <= 14 && /\d/.test(trimmed)) return 'code';
  return 'name';
}

function parseMoney(token: string): number {
  const digitsOnly = token.replace(/[^\d]/g, '');
  return digitsOnly ? Number(digitsOnly) : 0;
}

interface PendingProduct {
  code: string;
  codeX: number;
  codeY: number;
  prices: number[];
  nameParts: string[];
}

function flushPending(
  pending: PendingProduct | null,
  pageNumber: number,
  products: PdfTextParseResult['products'],
  errors: PdfTextParseResult['errors'],
): void {
  if (!pending) return;

  if (pending.prices.length === 0 || pending.nameParts.length === 0) {
    errors.push({
      page: pageNumber,
      message: 'No fue posible completar el producto (falta precio o nombre).',
      raw: `${pending.code} ${pending.nameParts.join(' ')} ${pending.prices.join(' ')}`.trim(),
    });
    return;
  }

  // Dos precios: el mayor es el precio mayorista, el menor es el precio
  // premium (especial). Confirmado contra el catálogo real — si solo hay
  // uno, se usa para ambos. El precio "detalle" no viene en este PDF.
  const sorted = [...pending.prices].sort((a, b) => a - b);
  const price = sorted.length > 1 ? sorted[sorted.length - 1] : sorted[0];
  const premiumPrice = sorted[0];

  products.push({
    code: pending.code,
    name: pending.nameParts.join(' ').trim(),
    description: null,
    price,
    premiumPrice,
    categoryName: null,
    sourcePage: pageNumber,
    // La imagen del producto se dibuja justo debajo del código (confirmado
    // contra el catálogo real) — este ancla permite que `PdfCatalogImporter`
    // busque la imagen más cercana por debajo, en la misma columna.
    imageAnchor: { page: pageNumber, x: pending.codeX, y: pending.codeY },
  });
}

/**
 * Parser específico para el catálogo de LEP Distribuciones / Japani Racer.
 * A diferencia de una tabla de una fila por producto, este PDF dibuja una
 * grilla de tarjetas de 2 columnas por página, donde código, precio(s) y
 * nombre son líneas de texto separadas dentro de cada tarjeta (por eso el
 * `GenericPdfTextParser` no sirve aquí). Ver `PdfTextParser` para cómo se
 * añaden parsers de otros proveedores sin tocar `PdfCatalogImporter`.
 */
export class JapaniRacerPdfTextParser implements PdfTextParser {
  readonly name = 'japani-racer';

  supports(pages: PdfPageText[]): boolean {
    return pages.some((page) => page.items.some((item) => /japani/i.test(item.text)));
  }

  parse(pages: PdfPageText[]): PdfTextParseResult {
    const products: PdfTextParseResult['products'] = [];
    const errors: PdfTextParseResult['errors'] = [];

    for (const page of pages) {
      const columnSplitX = page.pageWidth / 2;
      const columns: [PdfTextItem[], PdfTextItem[]] = [[], []];

      for (const item of page.items) {
        columns[item.x < columnSplitX ? 0 : 1].push(item);
      }

      for (const columnItems of columns) {
        const sorted = [...columnItems].sort((a, b) => b.y - a.y);
        let pending: PendingProduct | null = null;

        for (const item of sorted) {
          const kind = classify(item.text);
          const text = item.text.trim();

          if (kind === 'code') {
            flushPending(pending, page.pageNumber, products, errors);
            pending = { code: text, codeX: item.x, codeY: item.y, prices: [], nameParts: [] };
            continue;
          }

          if (!pending) continue; // texto suelto antes del primer código (encabezado, etc.)

          if (kind === 'price') {
            pending.prices.push(parseMoney(text));
          } else {
            // 'unit' o 'name': ambos se acumulan como parte del nombre visible.
            pending.nameParts.push(text);
          }
        }

        flushPending(pending, page.pageNumber, products, errors);
      }
    }

    return { products, errors };
  }
}
