/**
 * Canales IPC tipados, agrupados por módulo.
 * Cada módulo de negocio añade su propio bloque aquí a medida que se implementa.
 */
export const IpcChannel = {
  app: {
    healthCheck: 'app:health-check',
    imagesBaseUrl: 'app:images-base-url',
  },
  category: {
    list: 'category:list',
    create: 'category:create',
    update: 'category:update',
    delete: 'category:delete',
  },
  product: {
    list: 'product:list',
    create: 'product:create',
    update: 'product:update',
    delete: 'product:delete',
    reorder: 'product:reorder',
    selectImage: 'product:select-image',
  },
  settings: {
    get: 'settings:get',
    update: 'settings:update',
  },
  catalogImport: {
    selectFile: 'catalog-import:select-file',
    analyze: 'catalog-import:analyze',
    confirm: 'catalog-import:confirm',
  },
  catalogGeneration: {
    generatePdf: 'catalog-generation:generate-pdf',
  },
} as const;
