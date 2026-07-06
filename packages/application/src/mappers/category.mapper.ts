import type { Category } from '@catalog-studio/domain';
import type { CategoryDto } from '@catalog-studio/shared';

export function toCategoryDto(category: Category): CategoryDto {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    order: category.order,
    active: category.active,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}
