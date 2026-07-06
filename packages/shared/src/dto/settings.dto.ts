import { z } from 'zod';

export interface SettingsDto {
  companyName: string;
  logo: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  primaryColor: string;
  secondaryColor: string;
}

export const UpdateSettingsSchema = z.object({
  companyName: z.string().optional(),
  logo: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
  website: z.string().nullable().optional(),
  facebook: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
});
export type UpdateSettingsDto = z.infer<typeof UpdateSettingsSchema>;
