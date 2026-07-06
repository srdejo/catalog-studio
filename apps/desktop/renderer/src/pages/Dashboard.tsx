import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImageOff, Package, Tag, Upload, FileOutput, FolderX } from 'lucide-react';
import type { CategoryDto, ProductDto } from '@catalog-studio/shared';
import { Spinner } from '../components/Spinner';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  to?: string;
}

function StatCard({ icon, label, value, sub, to }: StatCardProps) {
  const content = (
    <>
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent-weak text-accent-strong">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xl font-bold leading-tight">{value}</div>
        <div className="truncate text-xs text-text-3">{label}</div>
        {sub && <div className="truncate text-[11px] text-text-3">{sub}</div>}
      </div>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="flex items-center gap-3.5 rounded-xl border border-border bg-surface p-4 hover:bg-surface-2"
      >
        {content}
      </Link>
    );
  }

  return <div className="flex items-center gap-3.5 rounded-xl border border-border bg-surface p-4">{content}</div>;
}

export function Dashboard() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([window.api.product.list(), window.api.category.list()]).then(([prods, cats]) => {
      setProducts(prods);
      setCategories(cats);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    const activeProducts = products.filter((p) => p.active);
    const inactiveProducts = products.length - activeProducts.length;
    const activeCategories = categories.filter((c) => c.active);
    const withoutImage = activeProducts.filter((p) => !p.imagePath);
    const withoutCategory = activeProducts.filter((p) => !p.categoryId);

    const byCategory = new Map<string, number>();
    for (const p of activeProducts) {
      const key = p.categoryId ?? '';
      byCategory.set(key, (byCategory.get(key) ?? 0) + 1);
    }
    const categoryBreakdown = categories
      .map((c) => ({ category: c, count: byCategory.get(c.id) ?? 0 }))
      .sort((a, b) => b.count - a.count);

    return {
      activeProducts,
      inactiveProducts,
      activeCategories,
      withoutImage,
      withoutCategory,
      categoryBreakdown,
    };
  }, [products, categories]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-8 w-8 text-accent" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto font-sans text-text">
      <header className="flex h-14 flex-shrink-0 items-center border-b border-border bg-surface px-6">
        <span className="text-sm font-semibold">Dashboard</span>
      </header>

      <div className="flex flex-col gap-6 p-6">
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          <StatCard
            icon={<Package size={18} />}
            label="Productos activos"
            value={stats.activeProducts.length}
            sub={stats.inactiveProducts > 0 ? `${stats.inactiveProducts} inactivos` : undefined}
            to="/productos"
          />
          <StatCard
            icon={<Tag size={18} />}
            label="Categorías activas"
            value={stats.activeCategories.length}
            to="/categorias"
          />
          <StatCard
            icon={<ImageOff size={18} />}
            label="Sin imagen"
            value={stats.withoutImage.length}
            to="/productos?image=missing"
          />
          <StatCard
            icon={<FolderX size={18} />}
            label="Sin categoría"
            value={stats.withoutCategory.length}
            to="/productos?category=none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold">Productos por categoría</h2>
            {stats.categoryBreakdown.length === 0 ? (
              <p className="text-xs text-text-3">Aún no hay categorías creadas.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {stats.categoryBreakdown.map(({ category, count }) => {
                  const max = stats.categoryBreakdown[0]?.count || 1;
                  return (
                    <li key={category.id} className="flex items-center gap-3 text-xs">
                      <span className="w-28 flex-shrink-0 truncate text-text-2">{category.name}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${(count / max) * 100}%` }}
                        />
                      </div>
                      <span className="w-6 flex-shrink-0 text-right font-mono font-semibold">{count}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">Acciones rápidas</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                to="/importar-pdf"
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 hover:bg-surface-2"
              >
                <Upload size={18} className="text-accent-strong" />
                <div>
                  <div className="text-sm font-semibold">Importar PDF</div>
                  <div className="text-xs text-text-3">Actualizar catálogo del proveedor</div>
                </div>
              </Link>
              <Link
                to="/generar-pdf"
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 hover:bg-surface-2"
              >
                <FileOutput size={18} className="text-accent-strong" />
                <div>
                  <div className="text-sm font-semibold">Generar PDF</div>
                  <div className="text-xs text-text-3">Exportar el catálogo del mes</div>
                </div>
              </Link>
              <Link
                to="/productos"
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 hover:bg-surface-2"
              >
                <Package size={18} className="text-accent-strong" />
                <div>
                  <div className="text-sm font-semibold">Productos</div>
                  <div className="text-xs text-text-3">Revisar precios, stock y estado</div>
                </div>
              </Link>
              <Link
                to="/categorias"
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 hover:bg-surface-2"
              >
                <Tag size={18} className="text-accent-strong" />
                <div>
                  <div className="text-sm font-semibold">Categorías</div>
                  <div className="text-xs text-text-3">Organizar el catálogo</div>
                </div>
              </Link>
            </div>

            {(stats.withoutImage.length > 0 || stats.withoutCategory.length > 0) && (
              <div className="rounded-xl border border-amber bg-[color-mix(in_srgb,var(--amber)_8%,transparent)] p-4 text-xs text-text-2">
                {stats.withoutImage.length > 0 && (
                  <p>
                    <strong className="text-amber">{stats.withoutImage.length}</strong> productos activos sin
                    imagen — no se verán bien en el PDF generado.
                  </p>
                )}
                {stats.withoutCategory.length > 0 && (
                  <p className="mt-1">
                    <strong className="text-amber">{stats.withoutCategory.length}</strong> productos activos sin
                    categoría asignada.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
