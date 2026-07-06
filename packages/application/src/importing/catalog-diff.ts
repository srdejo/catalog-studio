import type { ImportedProduct, Product } from '@catalog-studio/domain';
import type { ProductDiffStatus } from '@catalog-studio/shared';

export type ProductPatch = Partial<{
  name: string;
  description: string | null;
  price: number;
  premiumPrice: number;
  imagePath: string | null;
}>;

export interface ProductDiffResult {
  status: ProductDiffStatus;
  changedFields: string[];
  before: Record<string, string | number | null> | null;
  after: Record<string, string | number | null> | null;
  patch: ProductPatch;
}

const PROVIDER_FIELDS = ['name', 'description', 'price', 'premiumPrice', 'imagePath'] as const;

/**
 * Compara un producto importado contra el existente en la base de datos.
 *
 * Regla clave (del spec funcional): solo los campos que administra el
 * proveedor (nombre, descripción, precio mayorista, precio premium, imagen)
 * pueden actualizarse automáticamente. Todo lo administrado por el usuario
 * (stock, estado, categoría, precio detalle, etiquetas) se conserva siempre
 * — por eso `patch` nunca incluye esos campos.
 *
 * Si el proveedor no trae un dato (null/undefined), se conserva el valor
 * existente — no se considera un "cambio" a null.
 */
export function diffProduct(existing: Product | null, imported: ImportedProduct): ProductDiffResult {
  if (!existing) {
    const patch: ProductPatch = {
      name: imported.name,
      description: imported.description,
      price: imported.price,
      premiumPrice: imported.premiumPrice ?? imported.price,
      imagePath: imported.imagePath,
    };
    return {
      status: 'new',
      changedFields: [...PROVIDER_FIELDS],
      before: null,
      after: patch,
      patch,
    };
  }

  const changedFields: string[] = [];
  const before: Record<string, string | number | null> = {};
  const after: Record<string, string | number | null> = {};
  const patch: ProductPatch = {};

  function check<K extends keyof ProductPatch>(
    field: K,
    importedValue: ProductPatch[K] | null | undefined,
    existingValue: string | number | null,
  ) {
    if (importedValue === null || importedValue === undefined) return;
    if (importedValue !== existingValue) {
      changedFields.push(field);
      before[field] = existingValue;
      after[field] = importedValue;
      (patch[field] as typeof importedValue) = importedValue;
    }
  }

  check('name', imported.name, existing.name);
  check('description', imported.description, existing.description);
  check('price', imported.price, existing.price);
  check('premiumPrice', imported.premiumPrice, existing.premiumPrice);
  check('imagePath', imported.imagePath, existing.imagePath);

  return {
    status: changedFields.length > 0 ? 'updated' : 'unchanged',
    changedFields,
    before: changedFields.length > 0 ? before : null,
    after: changedFields.length > 0 ? after : null,
    patch,
  };
}
