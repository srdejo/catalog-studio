import { app, BrowserWindow, ipcMain, protocol, net } from 'electron';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
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

const IMAGE_PROTOCOL = 'app-image';

// Debe registrarse antes de `app.whenReady()`. Un esquema privilegiado permite
// que <img src="app-image://..."> cargue igual en dev (renderer servido por
// http://localhost) y en producción (renderer servido por file://) — a
// diferencia de file://, que Chromium bloquea cuando la página viene de http.
protocol.registerSchemesAsPrivileged([
  { scheme: IMAGE_PROTOCOL, privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

// Repo root: apps/desktop/dist-electron/main -> ../../../ = raíz del monorepo,
// consistente con el `file:../../data/catalog.db` de Prisma.
const IMAGES_DIR = path.resolve(__dirname, '../../../../data/images');

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

// __dirname es dist-electron/main tanto en dev como en producción
// (vite-plugin-electron compila ahí en los dos casos).
const APP_ICON = path.resolve(__dirname, '../../build/icon.png');

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: APP_ICON,
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

registerHealthIpc(ipcMain, `${IMAGE_PROTOCOL}://images`);
registerCategoryIpc(ipcMain, categoryService);
registerProductIpc(ipcMain, productService, IMAGES_DIR, () => mainWindow);
registerSettingsIpc(ipcMain, settingsService);
registerCatalogImportIpc(ipcMain, catalogImportService, () => mainWindow);
registerCatalogGenerationIpc(ipcMain, generateCatalogService, () => mainWindow);

app.whenReady().then(async () => {
  // WAL + busy_timeout deben quedar activos antes de que cualquier IPC toque
  // la base — si no, escrituras seguidas (p.ej. confirmar una importación
  // grande) pueden chocar con lecturas concurrentes y SQLite falla de
  // inmediato en vez de esperar.
  await ensureDatabaseReady();

  protocol.handle(IMAGE_PROTOCOL, (request) => {
    const fileName = decodeURIComponent(new URL(request.url).pathname.replace(/^\/+/, ''));
    return net.fetch(pathToFileURL(path.join(IMAGES_DIR, fileName)).toString());
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
