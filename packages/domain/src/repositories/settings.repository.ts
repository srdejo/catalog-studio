import type { Settings } from '../entities/settings.entity';

export interface SettingsRepository {
  get(): Promise<Settings>;
  update(settings: Partial<Settings>): Promise<Settings>;
}
