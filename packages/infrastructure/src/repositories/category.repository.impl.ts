import { Category, type CategoryRepository } from '@catalog-studio/domain';
import type { Category as CategoryRow } from '@prisma/client';
import { getPrismaClient } from '../prisma/client';

function toDomain(row: CategoryRow): Category {
  return new Category(
    row.id,
    row.name,
    row.description,
    row.order,
    row.active,
    row.createdAt,
    row.updatedAt,
  );
}

export class PrismaCategoryRepository implements CategoryRepository {
  private readonly prisma = getPrismaClient();

  async findAll(): Promise<Category[]> {
    const rows = await this.prisma.category.findMany({ orderBy: { order: 'asc' } });
    return rows.map(toDomain);
  }

  async findById(id: string): Promise<Category | null> {
    const row = await this.prisma.category.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByName(name: string): Promise<Category | null> {
    // SQLite no soporta filtros case-insensitive nativos en Prisma (a diferencia de Postgres),
    // así que comparamos en memoria — el volumen de categorías es siempre pequeño.
    const rows = await this.prisma.category.findMany();
    const match = rows.find((row) => row.name.toLowerCase() === name.toLowerCase());
    return match ? toDomain(match) : null;
  }

  async create(
    category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Category> {
    const row = await this.prisma.category.create({
      data: {
        name: category.name,
        description: category.description,
        order: category.order,
        active: category.active,
      },
    });
    return toDomain(row);
  }

  async update(
    id: string,
    category: Partial<Omit<Category, 'id' | 'createdAt'>>,
  ): Promise<Category> {
    const row = await this.prisma.category.update({
      where: { id },
      data: {
        name: category.name,
        description: category.description,
        order: category.order,
        active: category.active,
      },
    });
    return toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }
}
