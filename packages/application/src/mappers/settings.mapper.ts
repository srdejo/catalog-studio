import type { Settings } from '@catalog-studio/domain';
import type { SettingsDto } from '@catalog-studio/shared';

export function toSettingsDto(settings: Settings): SettingsDto {
  return {
    companyName: settings.companyName,
    logo: settings.logo,
    address: settings.address,
    city: settings.city,
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    email: settings.email,
    website: settings.website,
    facebook: settings.facebook,
    instagram: settings.instagram,
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
  };
}
