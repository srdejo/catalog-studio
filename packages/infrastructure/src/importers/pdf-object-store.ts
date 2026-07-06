import { inflateSync } from 'node:zlib';

/**
 * Utilidades de bajo nivel para ubicar objetos indirectos de un PDF por su
 * número exacto, directamente sobre los bytes crudos del archivo — sin un
 * parser PDF completo (xref/trailer), suficiente para lo que necesitamos:
 * resolver referencias `/Nombre N 0 R` a su contenido real.
 *
 * Dos gotchas encontrados al calibrar contra un catálogo real:
 * 1. Buscar el literal `"${n} 0 obj"` con `indexOf` sin límite de palabra
 *    puede matchear dentro de otro número (p.ej. buscar "5 0 obj" matchea
 *    dentro de "15 0 obj"). Se usa un límite de dígito con lookbehind.
 * 2. Un PDF con actualizaciones incrementales repite números de objeto —
 *    la versión vigente es la que aparece MÁS AL FINAL del archivo, no la
 *    primera. Por eso se busca siempre la última ocurrencia.
 */

export interface PdfImageObject {
  bytes: Buffer;
  width: number;
  height: number;
}

interface ObjectMarker {
  /** Índice justo después de "obj" (donde empieza el cuerpo del objeto). */
  bodyStart: number;
}

function findLastObjectMarker(text: string, objNum: number): ObjectMarker | null {
  const regex = new RegExp(`(?<!\\d)${objNum}\\s+0\\s+obj`, 'g');
  let match: RegExpExecArray | null;
  let last: RegExpExecArray | null = null;
  while ((match = regex.exec(text)) !== null) {
    last = match;
  }
  if (!last) return null;
  return { bodyStart: last.index + last[0].length };
}

/**
 * Busca `objNum 0 obj ... endobj` (la ocurrencia vigente) y devuelve el
 * texto entre medio. No intenta balancear `<<`/`>>` — el propio `endobj` es
 * un marcador de fin confiable en PDFs válidos.
 */
function findObjectBody(text: string, objNum: number): string | null {
  const marker = findLastObjectMarker(text, objNum);
  if (!marker) return null;
  const end = text.indexOf('endobj', marker.bodyStart);
  if (end === -1) return null;
  return text.slice(marker.bodyStart, end);
}

/**
 * Extrae y decodifica el stream de un objeto imagen (`/Subtype /Image`),
 * soportando el caso común `/Filter [/FlateDecode /DCTDecode]` (JPEG
 * comprimido con Flate encima) descubierto al validar contra un catálogo
 * real — sin esto, los bytes no arrancan con el marcador JPEG y la imagen
 * se pierde silenciosamente.
 */
export function extractImageObject(buffer: Buffer, text: string, objNum: number): PdfImageObject | null {
  const marker = findLastObjectMarker(text, objNum);
  if (!marker) return null;

  const streamKeywordIndex = text.indexOf('stream', marker.bodyStart);
  const endobjIndex = text.indexOf('endobj', marker.bodyStart);
  if (streamKeywordIndex === -1 || (endobjIndex !== -1 && endobjIndex < streamKeywordIndex)) {
    return null; // objeto sin stream (no es una imagen con datos propios)
  }

  const dict = text.slice(marker.bodyStart, streamKeywordIndex);
  if (!/\/Subtype\s*\/Image/.test(dict)) return null;

  const width = Number(dict.match(/\/Width\s+(\d+)/)?.[1] ?? 0);
  const height = Number(dict.match(/\/Height\s+(\d+)/)?.[1] ?? 0);

  // "stream" va seguido de CRLF o LF antes de los bytes reales.
  let streamStart = streamKeywordIndex + 'stream'.length;
  if (text[streamStart] === '\r') streamStart++;
  if (text[streamStart] === '\n') streamStart++;

  const lengthMatch = dict.match(/\/Length\s+(\d+)(?!\s+\d+\s+R)/);
  let rawBytes: Buffer;
  if (lengthMatch) {
    const length = Number(lengthMatch[1]);
    rawBytes = buffer.subarray(streamStart, streamStart + length);
  } else {
    const endIndex = text.indexOf('endstream', streamStart);
    if (endIndex === -1) return null;
    rawBytes = buffer.subarray(streamStart, endIndex);
  }

  if (!/\/DCTDecode/.test(dict)) return null; // solo soportamos JPEG por ahora

  let jpegBytes = rawBytes;
  if (/\/FlateDecode/.test(dict)) {
    try {
      jpegBytes = inflateSync(rawBytes);
    } catch {
      return null;
    }
  }

  if (jpegBytes.length <= 2 || jpegBytes[0] !== 0xff || jpegBytes[1] !== 0xd8) return null;

  return { bytes: Buffer.from(jpegBytes), width, height };
}

/**
 * Diccionario `/Resources /XObject` de una página, mapeando el nombre del
 * recurso (p.ej. "X3") a su número de objeto indirecto real.
 */
export function parsePageXObjectMap(pageDict: string): Map<string, number> {
  const map = new Map<string, number>();
  const xObjectMatch = pageDict.match(/\/XObject\s*<<([\s\S]*?)>>/);
  if (!xObjectMatch) return map;

  const entryRegex = /\/(\w+)\s+(\d+)\s+0\s+R/g;
  let entry: RegExpExecArray | null;
  while ((entry = entryRegex.exec(xObjectMatch[1])) !== null) {
    map.set(entry[1], Number(entry[2]));
  }
  return map;
}

/** Números de objeto referenciados por `/Contents` (uno o un arreglo). */
export function parsePageContentsRefs(pageDict: string): number[] {
  const arrayMatch = pageDict.match(/\/Contents\s*\[([^\]]*)\]/);
  if (arrayMatch) {
    return [...arrayMatch[1].matchAll(/(\d+)\s+0\s+R/g)].map((m) => Number(m[1]));
  }
  const singleMatch = pageDict.match(/\/Contents\s+(\d+)\s+0\s+R/);
  return singleMatch ? [Number(singleMatch[1])] : [];
}

/** Decodifica el content stream de una página (normalmente FlateDecode). */
export function extractContentStreamText(buffer: Buffer, text: string, objNum: number): string {
  const marker = findLastObjectMarker(text, objNum);
  if (!marker) return '';

  const streamKeywordIndex = text.indexOf('stream', marker.bodyStart);
  if (streamKeywordIndex === -1) return '';
  const dict = text.slice(marker.bodyStart, streamKeywordIndex);

  let streamStart = streamKeywordIndex + 'stream'.length;
  if (text[streamStart] === '\r') streamStart++;
  if (text[streamStart] === '\n') streamStart++;

  const lengthMatch = dict.match(/\/Length\s+(\d+)(?!\s+\d+\s+R)/);
  let rawBytes: Buffer;
  if (lengthMatch) {
    const length = Number(lengthMatch[1]);
    rawBytes = buffer.subarray(streamStart, streamStart + length);
  } else {
    const endIndex = text.indexOf('endstream', streamStart);
    if (endIndex === -1) return '';
    rawBytes = buffer.subarray(streamStart, endIndex);
  }

  if (/\/FlateDecode/.test(dict)) {
    try {
      return inflateSync(rawBytes).toString('latin1');
    } catch {
      return '';
    }
  }
  return rawBytes.toString('latin1');
}

export { findObjectBody };
