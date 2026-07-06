import type { ImportedProduct } from './imported-product';
import type { ImportError } from './import-error';

export interface ImportedCatalog {
  products: ImportedProduct[];
  errors: ImportError[];
}
