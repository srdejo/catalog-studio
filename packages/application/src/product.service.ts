import type { ProductRepository } from '@catalog-studio/domain';
import {
  CreateProductSchema,
  UpdateProductSchema,
  ReorderProductSchema,
  type ProductDto,
  type CreateProductDto,
  type UpdateProductDto,
  type ReorderProductDto,
} from '@catalog-studio/shared';
import { toProductDto } from './mappers/product.mapper';

const ORDER_STEP = 1000;

export class ProductService {
  constructor(private readonly products: ProductRepository) {}

  async list(): Promise<ProductDto[]> {
    const rows = await this.products.findAll();
    return rows.map(toProductDto);
  }

  async create(input: CreateProductDto): Promise<ProductDto> {
    const data = CreateProductSchema.parse(input);
    const order = data.order ?? (await this.products.findMaxOrder()) + ORDER_STEP;
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
      order,
      active: data.active ?? true,
    });
    return toProductDto(created);
  }

  async update(id: string, input: UpdateProductDto): Promise<ProductDto> {
    const data = UpdateProductSchema.parse(input);
    const updated = await this.products.update(id, data);
    return toProductDto(updated);
  }

  /**
   * Reordenamiento manual (arrastrar y soltar): el cliente calcula el nuevo
   * `order` como el promedio entre los dos productos vecinos de la posición
   * destino, así que solo se reescribe esta fila — nunca el resto de la tabla.
   */
  async reorder(input: ReorderProductDto): Promise<ProductDto> {
    const data = ReorderProductSchema.parse(input);
    const updated = await this.products.update(data.id, { order: data.order });
    return toProductDto(updated);
  }

  async delete(id: string): Promise<void> {
    await this.products.delete(id);
  }
}
