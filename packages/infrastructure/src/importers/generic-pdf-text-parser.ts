import type { ImportedProduct } from '@catalog-studio/domain';
import type { PdfPageText, PdfTextItem } from './pdf-types';
import type { PdfTextParser, PdfTextParseResult } from './pdf-text-parser';

const Y_TOLERANCE = 3;
// Código: alfanumérico con guiones/slashes, debe tener al menos un dígito para no
// confundirse con una palabra normal del nombre del producto.
const CODE_REGEX = /^([A-Z][A-Z0-9\-/]{1,14}|\d[A-Z0-9\-/]{1,14})(?=\s)/i;
// Un "token de precio" al final de la línea: con separador de miles ($12.345)
// o con signo $ explícito ($999). Deliberadamente estricto para no confundir
// números sueltos del nombre (p.ej. "2T", "1/4") con precios.
const TRAILING_PRICE_TOKEN = /^\$?\d{1,3}(?:[.,]\d{3})+$|^\$\d+$/;

function groupIntoLines(items: PdfTextItem[]): PdfTextItem[][] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: PdfTextItem[][] = [];

  for (const item of sorted) {
    const line = lines.find((l) => Math.abs(l[0].y - item.y) <= Y_TOLERANCE);
    if (line) {
      line.push(item);
    } else {
      lines.push([item]);
    }
  }

  return lines.map((line) => line.sort((a, b) => a.x - b.x));
}

function parseMoney(token: string): number {
  const digitsOnly = token.replace(/[^\d]/g, '');
  return digitsOnly ? Number(digitsOnly) : 0;
}

/**
 * Parser de línea "genérico": asume que cada fila de producto es una sola
 * línea de texto con el patrón `CÓDIGO  NOMBRE...  PRECIO  [PRECIO_CON_IVA]`.
 * Es un mejor esfuerzo (best-effort) pensado como fallback cuando no hay un
 * parser específico para el proveedor — se reemplaza/complementa con
 * parsers dedicados (p.ej. `JapaniRacerPdfTextParser`) en el futuro.
 */
export class GenericPdfTextParser implements PdfTextParser {
  readonly name = 'generic';

  supports(): boolean {
    // Fallback universal: siempre puede intentarlo si nada más aplica.
    return true;
  }

  parse(pages: PdfPageText[]): PdfTextParseResult {
    const products: Omit<ImportedProduct, 'imagePath'>[] = [];
    const errors: PdfTextParseResult['errors'] = [];

    for (const page of pages) {
      const lines = groupIntoLines(page.items);

      for (const lineItems of lines) {
        const line = lineItems
          .map((i) => i.text)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (line.length < 4) continue;

        const codeMatch = line.match(CODE_REGEX);
        if (!codeMatch) continue; // no parece una fila de producto (título, pie de página, etc.)

        // Solo se buscan precios en la cola de la línea, después del código —
        // así los dígitos del propio código nunca se confunden con un precio.
        const tokens = line.slice(codeMatch[0].length).trim().split(/\s+/);
        const priceTokens: string[] = [];
        while (tokens.length > 0 && TRAILING_PRICE_TOKEN.test(tokens[tokens.length - 1])) {
          priceTokens.unshift(tokens.pop()!);
        }

        if (priceTokens.length === 0) {
          errors.push({
            page: page.pageNumber,
            message: 'No fue posible identificar el precio del producto.',
            raw: line,
          });
          continue;
        }

        const code = codeMatch[1];
        const namePart = tokens.join(' ').trim();

        if (!namePart) {
          errors.push({
            page: page.pageNumber,
            message: 'No fue posible identificar el nombre del producto.',
            raw: line,
          });
          continue;
        }

        const price = parseMoney(priceTokens[0]);
        const premiumPrice = priceTokens.length > 1 ? parseMoney(priceTokens[1]) : null;

        products.push({
          code,
          name: namePart,
          description: null,
          price,
          premiumPrice,
          // La categoría normalmente viene de encabezados de sección, no de la
          // fila del producto — un parser específico de proveedor la detecta.
          categoryName: null,
          sourcePage: page.pageNumber,
        });
      }
    }

    return { products, errors };
  }
}
