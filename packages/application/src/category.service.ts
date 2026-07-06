import type { CategoryRepository } from '@catalog-studio/domain';
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  type CategoryDto,
  type CreateCategoryDto,
  type UpdateCategoryDto,
} from '@catalog-studio/shared';
import { toCategoryDto } from './mappers/category.mapper';

export class CategoryService {
  constructor(private readonly categories: CategoryRepository) {}

  async list(): Promise<CategoryDto[]> {
    const rows = await this.categories.findAll();
    return rows.map(toCategoryDto);
  }

  async create(input: CreateCategoryDto): Promise<CategoryDto> {
    const data = CreateCategorySchema.parse(input);
    const created = await this.categories.create({
      name: data.name,
      description: data.description ?? null,
      order: data.order ?? 0,
      active: data.active ?? true,
    });
    return toCategoryDto(created);
  }

  async update(id: string, input: UpdateCategoryDto): Promise<CategoryDto> {
    const data = UpdateCategorySchema.parse(input);
    const updated = await this.categories.update(id, data);
    return toCategoryDto(updated);
  }

  async delete(id: string): Promise<void> {
    await this.categories.delete(id);
  }
}
