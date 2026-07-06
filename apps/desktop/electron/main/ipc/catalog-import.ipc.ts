import { dialog, type BrowserWindow, type IpcMain } from 'electron';
import { IpcChannel, type ConfirmImportDto } from '@catalog-studio/shared';
import type { CatalogImportService } from '@catalog-studio/application';

export function registerCatalogImportIpc(
  ipcMain: IpcMain,
  service: CatalogImportService,
  getWindow: () => BrowserWindow | null,
): void {
  ipcMain.handle(IpcChannel.catalogImport.selectFile, async () => {
    const win = getWindow();
    const options: Electron.OpenDialogOptions = {
      title: 'Selecciona el catálogo en PDF',
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
      properties: ['openFile'],
    };
    const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle(IpcChannel.catalogImport.analyze, (_event, filePath: string) =>
    service.analyze(filePath),
  );

  ipcMain.handle(IpcChannel.catalogImport.confirm, (_event, input: ConfirmImportDto) =>
    service.confirm(input),
  );
}
