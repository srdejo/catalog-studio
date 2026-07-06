import type { CatalogTemplateData, ProductForTemplate } from './types';

export const UNCATEGORIZED_LABEL = 'Sin categoría';

/**
 * Cuántos productos caben cómodamente en una página con el grid actual
 * (2 columnas x 3 filas) sin desbordar la altura de la página — clave para
 * que cada página física del PDF tenga su propio header/footer. Vuelve a 6
 * (de 4) ahora que el tamaño de página coincide con el aspecto de
 * cover-base.png (ver page-size.ts) — la página quedó más alta que A4 y
 * sobra espacio de nuevo para la tercera fila. Si una categoría tiene más
 * productos que esto, se reparte en varias páginas ("Categoría (2/3)").
 */
const PRODUCTS_PER_PAGE = 6;

export interface ProductPage {
  /** Único por página física (incluye el número de bloque si la categoría se parte). */
  key: string;
  title: string;
  products: ProductForTemplate[];
}

export function categoryName(data: CatalogTemplateData, key: string): string {
  if (key === UNCATEGORIZED_LABEL) return UNCATEGORIZED_LABEL;
  return data.categories.find((c) => c.id === key)?.name ?? UNCATEGORIZED_LABEL;
}

/**
 * Agrupa los productos por categoría (orden alfabético) y los reparte en
 * páginas de tamaño fijo — cada entrada del resultado es exactamente una
 * página física del PDF, nunca se desborda.
 */
export function buildProductPages(data: CatalogTemplateData): ProductPage[] {
  const byCategory = new Map<string, ProductForTemplate[]>();
  for (const product of data.products) {
    const key = product.categoryId ?? UNCATEGORIZED_LABEL;
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(product);
  }

  const categories = [...byCategory.entries()]
    .map(([key, products]) => ({ key, name: categoryName(data, key), products }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const pages: ProductPage[] = [];
  for (const category of categories) {
    const chunks: ProductForTemplate[][] = [];
    for (let i = 0; i < category.products.length; i += PRODUCTS_PER_PAGE) {
      chunks.push(category.products.slice(i, i + PRODUCTS_PER_PAGE));
    }

    chunks.forEach((products, chunkIndex) => {
      const title =
        chunks.length > 1 ? `${category.name} (${chunkIndex + 1}/${chunks.length})` : category.name;
      pages.push({ key: `${category.key}-${chunkIndex}`, title, products });
    });
  }

  return pages;
}
