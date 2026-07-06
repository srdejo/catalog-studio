import { Product, type ProductRepository } from '@catalog-studio/domain';
import type { Product as ProductRow } from '@prisma/client';
import { getPrismaClient } from '../prisma/client';

function toDomain(row: ProductRow): Product {
  return new Product(
    row.id,
    row.code,
    row.name,
    row.description,
    row.imagePath,
    row.categoryId,
    row.price,
    row.premiumPrice,
    row.detailPrice,
    row.cost,
    row.stock,
    row.order,
    row.active,
    row.createdAt,
    row.updatedAt,
  );
}

export class PrismaProductRepository implements ProductRepository {
  private readonly prisma = getPrismaClient();

  async findAll(): Promise<Product[]> {
    // Orden manual (no createdAt): el usuario puede reordenar los productos
    // arrastrando en la pantalla de Productos.
    const rows = await this.prisma.product.findMany({ orderBy: { order: 'asc' } });
    return rows.map(toDomain);
  }

  async findById(id: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByCode(code: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({ where: { code } });
    return row ? toDomain(row) : null;
  }

  async findMaxOrder(): Promise<number> {
    const top = await this.prisma.product.findFirst({ orderBy: { order: 'desc' } });
    return top?.order ?? 0;
  }

  async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const row = await this.prisma.product.create({
      data: {
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
        order: product.order,
        active: product.active,
      },
    });
    return toDomain(row);
  }

  async update(
    id: string,
    product: Partial<Omit<Product, 'id' | 'createdAt'>>,
  ): Promise<Product> {
    const row = await this.prisma.product.update({
      where: { id },
      data: {
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
        order: product.order,
        active: product.active,
      },
    });
    return toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }
}
