import type { ImportedCatalog } from './imported-catalog';

/**
 * Estrategia de importación de catálogos de proveedores. Cada formato
 * (PDF, Excel, CSV...) tiene su propia implementación en `infrastructure`.
 *
 * Nota: usa una ruta de archivo (no `File`, que es una API de navegador)
 * porque la importación corre íntegramente en el proceso `main` de Electron.
 */
export interface CatalogImporter {
  supports(filePath: string): boolean;
  import(filePath: string): Promise<ImportedCatalog>;
}
