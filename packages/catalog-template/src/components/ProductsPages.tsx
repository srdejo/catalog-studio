import type { PriceKey } from '@catalog-studio/shared';
import type { CatalogTemplateData, ProductForTemplate } from '../types';
import { buildProductPages } from '../catalog-sections';
import { PageFooter, PageHeader } from './PageChrome';

const ALL_PRICE_KEYS: PriceKey[] = ['premiumPrice', 'price', 'detailPrice'];

function ProductCard({
  product,
  visiblePrices,
}: {
  product: ProductForTemplate;
  visiblePrices: PriceKey[];
}) {
  return (
    <div className="product-card">
      <div className="product-card-code-badge">
        <span className="product-card-code-label">CÓDIGO:</span>
        <span className="product-card-code-value">{product.code}</span>
      </div>
      <div className="product-card-image">
        {product.imageDataUri ? (
          <img src={product.imageDataUri} alt={product.name} />
        ) : (
          <span className="product-card-image-placeholder">{product.name.charAt(0)}</span>
        )}
      </div>
      <div className="product-card-name">{product.name}</div>
      <div className="product-card-prices">
        {visiblePrices.includes('premiumPrice') && (
          <div className="price-block price-premium">
            <span className="price-label">Premium</span>
            <span className="price-amount">${product.premiumPrice.toLocaleString('es-CO')}</span>
          </div>
        )}
        {visiblePrices.includes('price') && (
          <div className="price-block price-mayorista">
            <span className="price-label">Mayorista</span>
            <span className="price-amount">${product.price.toLocaleString('es-CO')}</span>
          </div>
        )}
        {visiblePrices.includes('detailPrice') && (
          <div className="price-block price-detalle">
            <span className="price-label">Detalle</span>
            <span className="price-amount">
              ${(product.detailPrice ?? product.price).toLocaleString('es-CO')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProductsPages({
  data,
  startPageNumber,
}: {
  data: CatalogTemplateData;
  startPageNumber: number;
}) {
  // Cada entrada ya es una página física de tamaño fijo (ver
  // PRODUCTS_PER_PAGE en catalog-sections.ts) — nunca se desborda, así que
  // el salto de página antes de cada una es siempre explícito, incluida la
  // primera (que sigue a la página de índice).
  const pages = buildProductPages(data);
  const visiblePrices = data.visiblePrices ?? ALL_PRICE_KEYS;

  return (
    <>
      {pages.map((productPage, index) => (
        <section key={productPage.key} className="page products-page" style={{ pageBreakBefore: 'always' }}>
          <PageHeader
            title={productPage.title}
            headerImageDataUri={data.headerImageDataUri}
          />
          <div className="page-body">
            <div className="products-grid">
              {productPage.products.map((product) => (
                <ProductCard key={product.id} product={product} visiblePrices={visiblePrices} />
              ))}
            </div>
          </div>
          <PageFooter
            pageNumber={startPageNumber + index}
            footerImageDataUri={data.footerImageDataUri}
          />
        </section>
      ))}
    </>
  );
}
