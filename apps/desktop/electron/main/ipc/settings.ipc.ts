import type { IpcMain } from 'electron';
import { IpcChannel, type UpdateSettingsDto } from '@catalog-studio/shared';
import type { SettingsService } from '@catalog-studio/application';

export function registerSettingsIpc(ipcMain: IpcMain, service: SettingsService): void {
  ipcMain.handle(IpcChannel.settings.get, () => service.get());
  ipcMain.handle(IpcChannel.settings.update, (_event, input: UpdateSettingsDto) => service.update(input));
}
