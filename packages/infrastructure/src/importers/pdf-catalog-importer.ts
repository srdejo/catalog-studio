import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { CatalogImporter, ImportedCatalog } from '@catalog-studio/domain';
import { extractPdfPagesText } from './pdf-text-extractor';
import { extractPageImages } from './pdf-page-images';
import { hashImageBuffer } from './pdf-image-extractor';
import { GenericPdfTextParser } from './generic-pdf-text-parser';
import { JapaniRacerPdfTextParser } from './japani-racer-pdf-text-parser';
import type { PdfTextParser, ParsedProductCandidate } from './pdf-text-parser';
import type { PdfPageImage, PdfPageText } from './pdf-types';

interface UsablePageImage extends PdfPageImage {
  used: boolean;
}

/**
 * Importador de catálogos en PDF. Delega la interpretación del texto en una
 * lista de `PdfTextParser` (el primero cuyo `supports()` sea true gana),
 * de modo que en el futuro un parser específico de proveedor
 * (`JapaniRacerPdfTextParser`, etc.) puede anteponerse al genérico sin tocar
 * esta clase.
 */
export class PdfCatalogImporter implements CatalogImporter {
  constructor(
    private readonly imagesDir: string,
    private readonly textParsers: PdfTextParser[] = [
      new JapaniRacerPdfTextParser(),
      new GenericPdfTextParser(),
    ],
  ) {}

  supports(filePath: string): boolean {
    return filePath.toLowerCase().endsWith('.pdf');
  }

  async import(filePath: string): Promise<ImportedCatalog> {
    const buffer = await fs.readFile(filePath);
    const pages = await extractPdfPagesText(buffer);

    const parser = this.textParsers.find((p) => p.supports(pages));
    if (!parser) {
      return {
        products: [],
        errors: [{ page: null, message: 'Ningún parser de texto pudo interpretar este PDF.' }],
      };
    }

    const { products: parsedProducts, errors } = parser.parse(pages);

    // Resuelve, página por página, qué objeto de imagen real usa cada `Do`
    // del content stream — a diferencia de emparejar por orden de aparición
    // en el archivo, esto es correcto incluso cuando una foto se reutiliza
    // entre varios productos.
    const text = buffer.toString('latin1');
    const imagesByPage = new Map<number, UsablePageImage[]>();
    for (const page of pages) {
      const images = extractPageImages(buffer, text, page.pageObjNum);
      imagesByPage.set(
        page.pageNumber,
        images.map((img) => ({ ...img, used: false })),
      );
    }

    const products = await this.assignImages(parsedProducts, pages, imagesByPage);
    return { products, errors };
  }

  /**
   * Para cada producto con `imageAnchor` (la posición de su código), busca la
   * imagen más cercana por debajo, en la misma columna de la página —
   * confirmado contra el catálogo real: la foto del producto se dibuja justo
   * debajo del código y antes de los precios.
   */
  private async assignImages(
    candidates: ParsedProductCandidate[],
    pages: PdfPageText[],
    imagesByPage: Map<number, UsablePageImage[]>,
  ): Promise<ImportedCatalog['products']> {
    const pageWidthByNumber = new Map(pages.map((p) => [p.pageNumber, p.pageWidth]));
    let ensuredDir = false;

    const results: ImportedCatalog['products'] = [];
    for (const candidate of candidates) {
      const { imageAnchor, ...product } = candidate;
      let imagePath: string | null = null;

      if (imageAnchor) {
        const pageWidth = pageWidthByNumber.get(imageAnchor.page) ?? 0;
        const sameColumn = (imgX: number) =>
          (imgX < pageWidth / 2) === (imageAnchor.x < pageWidth / 2);

        const nearby = (imagesByPage.get(imageAnchor.page) ?? []).filter(
          (img) => !img.used && sameColumn(img.x) && img.y < imageAnchor.y,
        );
        // La más cercana por debajo del código = mayor `y` entre las candidatas.
        const match = nearby.sort((a, b) => b.y - a.y)[0];

        if (match) {
          match.used = true;
          if (!ensuredDir) {
            await fs.mkdir(this.imagesDir, { recursive: true });
            ensuredDir = true;
          }
          const fileName = `import-${hashImageBuffer(match.bytes)}.jpg`;
          await fs.writeFile(path.join(this.imagesDir, fileName), match.bytes);
          imagePath = fileName;
        }
      }

      results.push({ ...product, imagePath });
    }

    return results;
  }
}
