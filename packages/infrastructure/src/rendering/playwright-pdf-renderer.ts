import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import type { PdfPageSize, PdfRenderer } from '@catalog-studio/domain';

/**
 * Renderiza HTML a PDF con Chromium headless vía Playwright. Se lanza un
 * navegador por cada exportación (no vale la pena mantenerlo residente en
 * una app de escritorio de un solo usuario que genera catálogos
 * esporádicamente).
 */
export class PlaywrightPdfRenderer implements PdfRenderer {
  async renderHtmlToPdf(html: string, outputPath: string, pageSize?: PdfPageSize): Promise<void> {
    // El catálogo puede tener cientos de fotos de producto embebidas como
    // data URIs base64 — el HTML resultante puede pesar decenas/cientos de
    // MB. `page.setContent()` pasa el string entero por el protocolo CDP y,
    // en documentos así de grandes, el navegador termina cerrándose
    // ("Target page, context or browser has been closed"). Escribir a un
    // archivo temporal y navegar con `goto()` evita ese límite.
    const tempFile = path.join(os.tmpdir(), `catalog-studio-render-${randomUUID()}.html`);
    await fs.writeFile(tempFile, html, 'utf-8');

    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.goto(pathToFileURL(tempFile).toString(), { waitUntil: 'load', timeout: 120_000 });
      await page.pdf({
        path: outputPath,
        ...(pageSize ? { width: pageSize.width, height: pageSize.height } : { format: 'A4' }),
        printBackground: true,
        margin: { top: '0', bottom: '0', left: '0', right: '0' },
      });
    } finally {
      await browser.close();
      await fs.rm(tempFile, { force: true });
    }
  }
}
