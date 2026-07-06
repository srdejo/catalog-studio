import { z } from 'zod';

export interface CategoryDto {
  id: string;
  name: string;
  description: string | null;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().nullable().optional(),
  order: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});
export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = CreateCategorySchema.partial();
export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;
