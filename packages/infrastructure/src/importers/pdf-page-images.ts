import type { PdfPageImage } from './pdf-types';
import {
  extractContentStreamText,
  extractImageObject,
  findObjectBody,
  parsePageContentsRefs,
  parsePageXObjectMap,
} from './pdf-object-store';

type Matrix = [number, number, number, number, number, number];

function multiply(m: Matrix, n: Matrix): Matrix {
  return [
    m[0] * n[0] + m[1] * n[2],
    m[0] * n[1] + m[1] * n[3],
    m[2] * n[0] + m[3] * n[2],
    m[2] * n[1] + m[3] * n[3],
    m[4] * n[0] + m[5] * n[2] + n[4],
    m[4] * n[1] + m[5] * n[3] + n[5],
  ];
}

/**
 * Quita cadenas literales `(...)` y hexadecimales `<...>` del content stream
 * antes de tokenizar — sus operandos no nos interesan (texto, colores) y
 * podrían contener espacios/paréntesis que confundirían un tokenizador
 * ingenuo basado en `split(/\s+/)`.
 */
function stripStringOperands(contentStream: string): string {
  return contentStream
    .replace(/\((?:[^()\\]|\\.)*\)/g, ' ')
    .replace(/<[0-9A-Fa-f\s]+>/g, ' ');
}

interface DoInvocation {
  resourceName: string;
  ctm: Matrix;
}

/**
 * Interpreta el content stream de una página (operadores `q`/`Q`/`cm`/`Do`)
 * para saber, en orden, qué XObject se pintó y con qué transformación —
 * necesario para ubicar la posición real de cada imagen sin depender de
 * pdfjs (que no expone el nombre de recurso original, solo un id interno).
 */
function parseDoInvocations(contentStream: string): DoInvocation[] {
  const clean = stripStringOperands(contentStream);
  const tokens = clean.split(/\s+/).filter(Boolean);

  const invocations: DoInvocation[] = [];
  let ctm: Matrix = [1, 0, 0, 1, 0, 0];
  const stack: Matrix[] = [];
  const numberBuffer: number[] = [];
  let lastName: string | null = null;

  for (const token of tokens) {
    if (token === 'q') {
      stack.push(ctm);
    } else if (token === 'Q') {
      ctm = stack.pop() ?? ctm;
    } else if (token === 'cm') {
      if (numberBuffer.length >= 6) {
        ctm = multiply(numberBuffer.slice(-6) as Matrix, ctm);
      }
      numberBuffer.length = 0;
    } else if (token.startsWith('/')) {
      lastName = token.slice(1);
      numberBuffer.length = 0;
    } else if (token === 'Do') {
      if (lastName) invocations.push({ resourceName: lastName, ctm });
    } else {
      const value = Number(token);
      if (!Number.isNaN(value)) numberBuffer.push(value);
      else numberBuffer.length = 0;
    }
  }

  return invocations;
}

/**
 * Extrae las fotos de producto de una página con su posición real (x, y) y
 * sus bytes exactos, resolviendo cada `Do` a su objeto de imagen real —
 * soporta imágenes reutilizadas entre productos sin desalinearse (a
 * diferencia de emparejar por orden de aparición en el archivo).
 */
export function extractPageImages(
  buffer: Buffer,
  text: string,
  pageObjNum: number,
  minPhotoPx = 700,
  maxPhotoPx = 2000,
): PdfPageImage[] {
  const pageDict = findObjectBody(text, pageObjNum);
  if (!pageDict) return [];

  const xObjectMap = parsePageXObjectMap(pageDict);
  if (xObjectMap.size === 0) return [];

  const contentsRefs = parsePageContentsRefs(pageDict);
  const contentStream = contentsRefs.map((ref) => extractContentStreamText(buffer, text, ref)).join('\n');

  const invocations = parseDoInvocations(contentStream);
  const images: PdfPageImage[] = [];
  const objectCache = new Map<number, ReturnType<typeof extractImageObject>>();

  for (const { resourceName, ctm } of invocations) {
    const objNum = xObjectMap.get(resourceName);
    if (objNum === undefined) continue;

    if (!objectCache.has(objNum)) {
      objectCache.set(objNum, extractImageObject(buffer, text, objNum));
    }
    const imageObject = objectCache.get(objNum);
    if (!imageObject) continue; // no es una imagen JPEG soportada (fondo vectorial, etc.)

    const isProductPhotoSize =
      imageObject.width >= minPhotoPx &&
      imageObject.width <= maxPhotoPx &&
      imageObject.height >= minPhotoPx &&
      imageObject.height <= maxPhotoPx;
    if (!isProductPhotoSize) continue;

    images.push({
      x: ctm[4],
      y: ctm[5],
      width: Math.abs(ctm[0]),
      height: Math.abs(ctm[3]),
      bytes: imageObject.bytes,
    });
  }

  return images;
}
