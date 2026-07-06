import type { Product } from '../entities/product.entity';

export interface ProductRepository {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  findByCode(code: string): Promise<Product | null>;
  /** Mayor valor de `order` existente — usado para agregar nuevos productos al final. */
  findMaxOrder(): Promise<number>;
  create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  update(id: string, product: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product>;
  delete(id: string): Promise<void>;
}
