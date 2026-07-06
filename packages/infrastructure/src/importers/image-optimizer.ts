/**
 * Redimensiona y recomprime una foto de producto al tamaño real en que se
 * ve en la tarjeta del catálogo (unos 87mm de ancho ≈ 330px a 96dpi; se usa
 * el doble para que también se vea nítida a mayor densidad de impresión).
 * Las fotos originales del PDF del proveedor vienen a resolución completa
 * (1200px+, ~80KB) — sin este paso, un catálogo de 1000+ productos pesa
 * decenas de MB solo en imágenes.
 */
const MAX_WIDTH_PX = 640;
const JPEG_QUALITY = 75;

export async function optimizeProductPhoto(bytes: Buffer): Promise<Buffer> {
  try {
    const sharp = (await import('sharp')).default;
    return await sharp(bytes)
      .resize({ width: MAX_WIDTH_PX, withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();
  } catch {
    // Si la imagen viene corrupta o sharp falla, se guarda tal cual en vez
    // de perder la foto — no es crítico que quede sin optimizar.
    return bytes;
  }
}
