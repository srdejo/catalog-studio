import type { ProductRepository } from '@catalog-studio/domain';
import {
  CreateProductSchema,
  UpdateProductSchema,
  type ProductDto,
  type CreateProductDto,
  type UpdateProductDto,
} from '@catalog-studio/shared';
import { toProductDto } from './mappers/product.mapper';

export class ProductService {
  constructor(private readonly products: ProductRepository) {}

  async list(): Promise<ProductDto[]> {
    const rows = await this.products.findAll();
    return rows.map(toProductDto);
  }

  async create(input: CreateProductDto): Promise<ProductDto> {
    const data = CreateProductSchema.parse(input);
    const created = await this.products.create({
      code: data.code,
      name: data.name,
      description: data.description ?? null,
      imagePath: data.imagePath ?? null,
      categoryId: data.categoryId ?? null,
      price: data.price,
      premiumPrice: data.premiumPrice,
      detailPrice: data.detailPrice ?? null,
      cost: data.cost,
      stock: data.stock ?? 0,
      active: data.active ?? true,
    });
    return toProductDto(created);
  }

  async update(id: string, input: UpdateProductDto): Promise<ProductDto> {
    const data = UpdateProductSchema.parse(input);
    const updated = await this.products.update(id, data);
    return toProductDto(updated);
  }

  async delete(id: string): Promise<void> {
    await this.products.delete(id);
  }
}
