import { dialog, type BrowserWindow, type IpcMain } from 'electron';
import {
  IpcChannel,
  type CreateProductDto,
  type UpdateProductDto,
  type ReorderProductDto,
} from '@catalog-studio/shared';
import type { ProductService } from '@catalog-studio/application';
import { saveProductImage } from '@catalog-studio/infrastructure';

export function registerProductIpc(
  ipcMain: IpcMain,
  service: ProductService,
  imagesDir: string,
  getWindow: () => BrowserWindow | null,
): void {
  ipcMain.handle(IpcChannel.product.list, () => service.list());
  ipcMain.handle(IpcChannel.product.create, (_event, input: CreateProductDto) => service.create(input));
  ipcMain.handle(IpcChannel.product.update, (_event, id: string, input: UpdateProductDto) =>
    service.update(id, input),
  );
  ipcMain.handle(IpcChannel.product.reorder, (_event, input: ReorderProductDto) =>
    service.reorder(input),
  );
  ipcMain.handle(IpcChannel.product.delete, (_event, id: string) => service.delete(id));

  ipcMain.handle(IpcChannel.product.selectImage, async () => {
    const win = getWindow();
    const options: Electron.OpenDialogOptions = {
      title: 'Selecciona la imagen del producto',
      filters: [{ name: 'Imágenes', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
      properties: ['openFile'],
    };
    const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
    if (result.canceled || result.filePaths.length === 0) return null;
    return saveProductImage(imagesDir, result.filePaths[0]);
  });
}
