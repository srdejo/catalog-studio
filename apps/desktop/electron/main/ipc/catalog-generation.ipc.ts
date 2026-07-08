import { dialog, type BrowserWindow, type IpcMain } from 'electron';
import { IpcChannel, type GeneratePdfDto, type GeneratePdfResultDto } from '@catalog-studio/shared';
import type { GenerateCatalogService } from '@catalog-studio/application';

export function registerCatalogGenerationIpc(
  ipcMain: IpcMain,
  service: GenerateCatalogService,
  getWindow: () => BrowserWindow | null,
): void {
  ipcMain.handle(
    IpcChannel.catalogGeneration.generatePdf,
    async (_event, input: GeneratePdfDto): Promise<GeneratePdfResultDto> => {
      const win = getWindow();
      const options: Electron.SaveDialogOptions = {
        title: 'Guardar catálogo en PDF',
        defaultPath: `Catalogo_${input.month}_${input.year}.pdf`,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      };
      const result = win ? await dialog.showSaveDialog(win, options) : await dialog.showSaveDialog(options);

      if (result.canceled || !result.filePath) {
        return { canceled: true, filePath: null };
      }

      await service.generate({
        month: input.month,
        year: input.year,
        outputPath: result.filePath,
        productIds: input.productIds,
        visiblePrices: input.visiblePrices,
      });
      return { canceled: false, filePath: result.filePath };
    },
  );
}
