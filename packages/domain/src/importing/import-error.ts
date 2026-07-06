/**
 * Un producto (o región del documento) que no pudo interpretarse.
 * No detiene la importación completa — se acumula aquí para revisión manual.
 */
export interface ImportError {
  page: number | null;
  message: string;
  raw?: string;
}
