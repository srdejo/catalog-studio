import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PrismaCategoryRepository,
  PrismaProductRepository,
  PrismaSettingsRepository,
  PdfCatalogImporter,
  PlaywrightPdfRenderer,
  FileSystemImageStore,
  ensureDatabaseReady,
} from '@catalog-studio/infrastructure';
import {
  CategoryService,
  ProductService,
  SettingsService,
  CatalogImportService,
  GenerateCatalogService,
} from '@catalog-studio/application';
import { registerHealthIpc } from './ipc/health.ipc';
import { registerCategoryIpc } from './ipc/category.ipc';
import { registerProductIpc } from './ipc/product.ipc';
import { registerSettingsIpc } from './ipc/settings.ipc';
import { registerCatalogImportIpc } from './ipc/catalog-import.ipc';
import { registerCatalogGenerationIpc } from './ipc/catalog-generation.ipc';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Repo root: apps/desktop/dist-electron/main -> ../../../ = raíz del monorepo,
// consistente con el `file:../../data/catalog.db` de Prisma.
const IMAGES_DIR = path.resolve(__dirname, '../../../../data/images');

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
}

// Composition root: la única capa que conoce Prisma, los servicios y Electron a la vez.
const categoryRepository = new PrismaCategoryRepository();
const productRepository = new PrismaProductRepository();

const settingsRepository = new PrismaSettingsRepository();

const categoryService = new CategoryService(categoryRepository);
const productService = new ProductService(productRepository);
const settingsService = new SettingsService(settingsRepository);
const catalogImportService = new CatalogImportService(productRepository, categoryRepository, [
  new PdfCatalogImporter(IMAGES_DIR),
]);
const generateCatalogService = new GenerateCatalogService(
  productRepository,
  categoryRepository,
  settingsRepository,
  new FileSystemImageStore(IMAGES_DIR),
  new PlaywrightPdfRenderer(),
);

registerHealthIpc(ipcMain);
registerCategoryIpc(ipcMain, categoryService);
registerProductIpc(ipcMain, productService);
registerSettingsIpc(ipcMain, settingsService);
registerCatalogImportIpc(ipcMain, catalogImportService, () => mainWindow);
registerCatalogGenerationIpc(ipcMain, generateCatalogService, () => mainWindow);

app.whenReady().then(async () => {
  // WAL + busy_timeout deben quedar activos antes de que cualquier IPC toque
  // la base — si no, escrituras seguidas (p.ej. confirmar una importación
  // grande) pueden chocar con lecturas concurrentes y SQLite falla de
  // inmediato en vez de esperar.
  await ensureDatabaseReady();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
