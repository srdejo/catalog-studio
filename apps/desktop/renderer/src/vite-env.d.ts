/// <reference types="vite/client" />

import type {
  CategoryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  ProductDto,
  CreateProductDto,
  UpdateProductDto,
  SettingsDto,
  UpdateSettingsDto,
  ImportPreviewDto,
  ConfirmImportDto,
  ConfirmImportResultDto,
  GeneratePdfDto,
  GeneratePdfResultDto,
} from '@catalog-studio/shared';

interface HealthCheckResult {
  ok: boolean;
  timestamp: string;
}

interface CatalogStudioApi {
  app: {
    healthCheck: () => Promise<HealthCheckResult>;
  };
  category: {
    list: () => Promise<CategoryDto[]>;
    create: (input: CreateCategoryDto) => Promise<CategoryDto>;
    update: (id: string, input: UpdateCategoryDto) => Promise<CategoryDto>;
    delete: (id: string) => Promise<void>;
  };
  product: {
    list: () => Promise<ProductDto[]>;
    create: (input: CreateProductDto) => Promise<ProductDto>;
    update: (id: string, input: UpdateProductDto) => Promise<ProductDto>;
    delete: (id: string) => Promise<void>;
  };
  settings: {
    get: () => Promise<SettingsDto>;
    update: (input: UpdateSettingsDto) => Promise<SettingsDto>;
  };
  catalogImport: {
    selectFile: () => Promise<string | null>;
    analyze: (filePath: string) => Promise<ImportPreviewDto>;
    confirm: (input: ConfirmImportDto) => Promise<ConfirmImportResultDto>;
  };
  catalogGeneration: {
    generatePdf: (input: GeneratePdfDto) => Promise<GeneratePdfResultDto>;
  };
}

declare global {
  interface Window {
    api: CatalogStudioApi;
  }
}

export {};
