import type { CatalogTemplateData } from '../types';
import { CoverPage } from './CoverPage';
import { IndexPage } from './IndexPage';
import { ProductsPages } from './ProductsPages';

// Numeración de páginas: 1 = portada (sin número visible), 2 = índice,
// 3+ = una página por categoría de productos.
const INDEX_PAGE_NUMBER = 2;
const FIRST_PRODUCTS_PAGE_NUMBER = 3;

export function CatalogDocument({ data }: { data: CatalogTemplateData }) {
  return (
    <>
      <CoverPage data={data} />
      <IndexPage data={data} pageNumber={INDEX_PAGE_NUMBER} />
      <ProductsPages data={data} startPageNumber={FIRST_PRODUCTS_PAGE_NUMBER} />
    </>
  );
}
