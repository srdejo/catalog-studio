import { promises as fs } from 'node:fs';
import path from 'node:path';
import { optimizeProductPhoto } from '../importers/image-optimizer';
import { hashImageBuffer } from '../importers/pdf-image-extractor';

/**
 * Guarda una imagen elegida a mano por el usuario (diálogo nativo) en
 * `data/images/`, aplicando la misma optimización que las fotos extraídas
 * de un PDF — mismo tamaño/calidad final para todo el catálogo.
 */
export async function saveProductImage(imagesDir: string, sourceFilePath: string): Promise<string> {
  const original = await fs.readFile(sourceFilePath);
  const optimized = await optimizeProductPhoto(original);
  const fileName = `upload-${hashImageBuffer(optimized)}.jpg`;
  await fs.mkdir(imagesDir, { recursive: true });
  await fs.writeFile(path.join(imagesDir, fileName), optimized);
  return fileName;
}
