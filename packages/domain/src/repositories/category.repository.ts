import type { Category } from '../entities/category.entity';

/**
 * Puerto del dominio: implementado en `infrastructure` (Prisma).
 * El dominio nunca conoce Prisma ni SQLite.
 */
export interface CategoryRepository {
  findAll(): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  create(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category>;
  update(id: string, category: Partial<Omit<Category, 'id' | 'createdAt'>>): Promise<Category>;
  delete(id: string): Promise<void>;
}
