import type { SettingsRepository } from '@catalog-studio/domain';
import { UpdateSettingsSchema, type SettingsDto, type UpdateSettingsDto } from '@catalog-studio/shared';
import { toSettingsDto } from './mappers/settings.mapper';

export class SettingsService {
  constructor(private readonly settings: SettingsRepository) {}

  async get(): Promise<SettingsDto> {
    const row = await this.settings.get();
    return toSettingsDto(row);
  }

  async update(input: UpdateSettingsDto): Promise<SettingsDto> {
    const data = UpdateSettingsSchema.parse(input);
    const updated = await this.settings.update(data);
    return toSettingsDto(updated);
  }
}
