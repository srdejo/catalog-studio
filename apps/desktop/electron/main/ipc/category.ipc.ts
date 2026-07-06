import type { IpcMain } from 'electron';
import { IpcChannel, type CreateCategoryDto, type UpdateCategoryDto } from '@catalog-studio/shared';
import type { CategoryService } from '@catalog-studio/application';

export function registerCategoryIpc(ipcMain: IpcMain, service: CategoryService): void {
  ipcMain.handle(IpcChannel.category.list, () => service.list());
  ipcMain.handle(IpcChannel.category.create, (_event, input: CreateCategoryDto) => service.create(input));
  ipcMain.handle(IpcChannel.category.update, (_event, id: string, input: UpdateCategoryDto) =>
    service.update(id, input),
  );
  ipcMain.handle(IpcChannel.category.delete, (_event, id: string) => service.delete(id));
}
