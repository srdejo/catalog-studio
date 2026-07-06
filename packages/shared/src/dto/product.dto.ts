import { z } from 'zod';

export interface ProductDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  imagePath: string | null;
  categoryId: string | null;
  /** Precio mayorista. */
  price: number;
  /** Precio premium (especial) — se muestra en rojo en el catálogo. */
  premiumPrice: number;
  /** Precio detalle (público) — se muestra en gris; si falta, se usa `price` (mayorista). */
  detailPrice: number | null;
  cost: number;
  stock: number;
  /** Orden manual fraccionario (ver product.repository.ts). */
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const CreateProductSchema = z.object({
  code: z.string().min(1, 'El código es obligatorio'),
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().nullable().optional(),
  imagePath: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  price: z.number().nonnegative(),
  premiumPrice: z.number().nonnegative(),
  detailPrice: z.number().nonnegative().nullable().optional(),
  cost: z.number().nonnegative(),
  stock: z.number().int().nonnegative().optional(),
  order: z.number().optional(),
  active: z.boolean().optional(),
});
export type CreateProductDto = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.partial();
export type UpdateProductDto = z.infer<typeof UpdateProductSchema>;

export const ReorderProductSchema = z.object({
  id: z.string().min(1),
  /** Nuevo valor de `order` (calculado en el cliente como el promedio entre vecinos). */
  order: z.number(),
});
export type ReorderProductDto = z.infer<typeof ReorderProductSchema>;
