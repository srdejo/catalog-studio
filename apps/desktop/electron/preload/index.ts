import { contextBridge, ipcRenderer } from 'electron';
import {
  IpcChannel,
  type CreateCategoryDto,
  type UpdateCategoryDto,
  type CreateProductDto,
  type UpdateProductDto,
  type UpdateSettingsDto,
  type ConfirmImportDto,
  type GeneratePdfDto,
  type ReorderProductDto,
} from '@catalog-studio/shared';

const api = {
  app: {
    healthCheck: () => ipcRenderer.invoke(IpcChannel.app.healthCheck),
    imagesBaseUrl: (): Promise<string> => ipcRenderer.invoke(IpcChannel.app.imagesBaseUrl),
  },
  category: {
    list: () => ipcRenderer.invoke(IpcChannel.category.list),
    create: (input: CreateCategoryDto) => ipcRenderer.invoke(IpcChannel.category.create, input),
    update: (id: string, input: UpdateCategoryDto) =>
      ipcRenderer.invoke(IpcChannel.category.update, id, input),
    delete: (id: string) => ipcRenderer.invoke(IpcChannel.category.delete, id),
  },
  product: {
    list: () => ipcRenderer.invoke(IpcChannel.product.list),
    create: (input: CreateProductDto) => ipcRenderer.invoke(IpcChannel.product.create, input),
    update: (id: string, input: UpdateProductDto) =>
      ipcRenderer.invoke(IpcChannel.product.update, id, input),
    delete: (id: string) => ipcRenderer.invoke(IpcChannel.product.delete, id),
    reorder: (input: ReorderProductDto) => ipcRenderer.invoke(IpcChannel.product.reorder, input),
    selectImage: (): Promise<string | null> => ipcRenderer.invoke(IpcChannel.product.selectImage),
  },
  settings: {
    get: () => ipcRenderer.invoke(IpcChannel.settings.get),
    update: (input: UpdateSettingsDto) => ipcRenderer.invoke(IpcChannel.settings.update, input),
  },
  catalogImport: {
    selectFile: () => ipcRenderer.invoke(IpcChannel.catalogImport.selectFile),
    analyze: (filePath: string) => ipcRenderer.invoke(IpcChannel.catalogImport.analyze, filePath),
    confirm: (input: ConfirmImportDto) => ipcRenderer.invoke(IpcChannel.catalogImport.confirm, input),
  },
  catalogGeneration: {
    generatePdf: (input: GeneratePdfDto) =>
      ipcRenderer.invoke(IpcChannel.catalogGeneration.generatePdf, input),
  },
};

contextBridge.exposeInMainWorld('api', api);

export type CatalogStudioApi = typeof api;
