import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ImageStore } from '@catalog-studio/domain';

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

export class FileSystemImageStore implements ImageStore {
  constructor(private readonly imagesDir: string) {}

  async readAsDataUri(relativePath: string): Promise<string | null> {
    try {
      const fullPath = path.join(this.imagesDir, relativePath);
      const bytes = await fs.readFile(fullPath);
      const mime = MIME_BY_EXT[path.extname(relativePath).toLowerCase()] ?? 'image/jpeg';
      return `data:${mime};base64,${bytes.toString('base64')}`;
    } catch {
      return null; // imagen faltante/movida — no debe romper la generación del catálogo
    }
  }
}
