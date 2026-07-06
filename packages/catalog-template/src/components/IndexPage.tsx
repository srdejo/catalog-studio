import type { CatalogTemplateData } from '../types';
import { PageFooter, PageHeader } from './PageChrome';

const UNCATEGORIZED_LABEL = 'Sin categoría';

export function IndexPage({ data, pageNumber }: { data: CatalogTemplateData; pageNumber: number }) {
  const counts = new Map<string, number>();
  for (const product of data.products) {
    const key = product.categoryId ?? UNCATEGORIZED_LABEL;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const rows = data.categories
    .filter((c) => c.active)
    .sort((a, b) => a.order - b.order)
    .map((c) => ({ name: c.name, count: counts.get(c.id) ?? 0 }))
    .filter((r) => r.count > 0);

  const uncategorizedCount = counts.get(UNCATEGORIZED_LABEL) ?? 0;
  if (uncategorizedCount > 0) rows.push({ name: UNCATEGORIZED_LABEL, count: uncategorizedCount });

  return (
    <section className="page index-page" style={{ pageBreakBefore: 'always' }}>
      <PageHeader
        title="Índice"
        headerImageDataUri={data.headerImageDataUri}
      />
      <div className="page-body">
        <h2 className="index-title">Índice</h2>
        <div className="index-rows">
          {rows.map((row) => (
            <div key={row.name} className="index-row">
              <span className="index-row-name">{row.name}</span>
              <span className="index-row-dots" />
              <span className="index-row-count">{row.count} ref.</span>
            </div>
          ))}
        </div>
      </div>
      <PageFooter
        pageNumber={pageNumber}
        footerImageDataUri={data.footerImageDataUri}
      />
    </section>
  );
}
