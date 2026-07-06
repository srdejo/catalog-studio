import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import type { PdfPageText } from './pdf-types';

// `require` no existe en ESM puro, pero el bundle final de Electron main es
// CJS (ver vite.config.ts) — createRequire con import.meta.url es el puente
// estándar para poder usar `require.resolve` desde código fuente en ESM.
const require = createRequire(import.meta.url);

/**
 * Extrae el texto de cada página del PDF con la posición (x, y) de cada
 * fragmento — necesario para reconstruir filas/columnas de una tabla de
 * productos, que es lo que un PDF realmente contiene (no hay "tabla" real,
 * solo texto posicionado). También expone el número de objeto real de cada
 * página (`pageObjNum`), usado por `pdf-page-images.ts` para resolver
 * imágenes por objeto exacto.
 */
export async function extractPdfPagesText(buffer: Buffer): Promise<PdfPageText[]> {
  // Import dinámico: pdfjs-dist es pesado y solo se necesita al importar PDFs.
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

  // pdfjs-dist necesita resolver su propio worker; al quedar `pdfjs-dist` externo
  // en el bundle (ver vite.config.ts), esto debe apuntar al archivo real en
  // node_modules en vez de dejar que intente resolverlo desde el bundle.
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
      require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs'),
    ).toString();
  }

  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;

  const pages: PdfPageText[] = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageWidth = page.view[2] - page.view[0];
    const pageHeight = page.view[3] - page.view[1];

    const items = content.items
      .filter(
        (item): item is import('pdfjs-dist/types/src/display/api').TextItem => 'str' in item,
      )
      .map((item) => ({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width,
        height: item.height || Math.abs(item.transform[0]),
      }))
      .filter((item) => item.text.trim().length > 0);

    pages.push({
      pageNumber,
      pageWidth,
      pageHeight,
      items,
      pageObjNum: page.ref?.num ?? -1,
    });
  }

  await doc.destroy();
  return pages;
}
