import type { IpcMain } from 'electron';
import { IpcChannel } from '@catalog-studio/shared';

/**
 * Único canal IPC de la Etapa 0: confirma que el viaje
 * renderer -> preload -> main funciona antes de construir módulos reales.
 */
export function registerHealthIpc(ipcMain: IpcMain, imagesBaseUrl: string): void {
  ipcMain.handle(IpcChannel.app.healthCheck, () => ({
    ok: true,
    timestamp: new Date().toISOString(),
  }));

  ipcMain.handle(IpcChannel.app.imagesBaseUrl, () => imagesBaseUrl);
}
