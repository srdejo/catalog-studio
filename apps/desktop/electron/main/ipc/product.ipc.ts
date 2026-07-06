import type { IpcMain } from 'electron';
import { IpcChannel, type CreateProductDto, type UpdateProductDto } from '@catalog-studio/shared';
import type { ProductService } from '@catalog-studio/application';

export function registerProductIpc(ipcMain: IpcMain, service: ProductService): void {
  ipcMain.handle(IpcChannel.product.list, () => service.list());
  ipcMain.handle(IpcChannel.product.create, (_event, input: CreateProductDto) => service.create(input));
  ipcMain.handle(IpcChannel.product.update, (_event, id: string, input: UpdateProductDto) =>
    service.update(id, input),
  );
  ipcMain.handle(IpcChannel.product.delete, (_event, id: string) => service.delete(id));
}
