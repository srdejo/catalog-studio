import { Settings, type SettingsRepository } from '@catalog-studio/domain';
import type { Settings as SettingsRow } from '@prisma/client';
import { getPrismaClient } from '../prisma/client';

const SINGLETON_ID = 1;

function toDomain(row: SettingsRow): Settings {
  return new Settings(
    row.companyName,
    row.logo,
    row.address,
    row.city,
    row.phone,
    row.whatsapp,
    row.email,
    row.website,
    row.facebook,
    row.instagram,
    row.primaryColor,
    row.secondaryColor,
  );
}

/**
 * La configuración de la empresa es una fila única (id=1). `get()` la crea
 * con valores por defecto si todavía no existe (primer arranque de la app).
 */
export class PrismaSettingsRepository implements SettingsRepository {
  private readonly prisma = getPrismaClient();

  async get(): Promise<Settings> {
    const row = await this.prisma.settings.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: { id: SINGLETON_ID },
    });
    return toDomain(row);
  }

  async update(settings: Partial<Settings>): Promise<Settings> {
    const row = await this.prisma.settings.upsert({
      where: { id: SINGLETON_ID },
      update: settings,
      create: { id: SINGLETON_ID, ...settings },
    });
    return toDomain(row);
  }
}
