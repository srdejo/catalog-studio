import type { Product } from '@catalog-studio/domain';
import type { ProductDto } from '@catalog-studio/shared';

export function toProductDto(product: Product): ProductDto {
  return {
    id: product.id,
    code: product.code,
    name: product.name,
    description: product.description,
    imagePath: product.imagePath,
    categoryId: product.categoryId,
    price: product.price,
    premiumPrice: product.premiumPrice,
    detailPrice: product.detailPrice,
    cost: product.cost,
    stock: product.stock,
    active: product.active,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
