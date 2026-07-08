import { useEffect, useMemo, useState } from 'react';
import type { CategoryDto, PriceKey, ProductDto, SettingsDto } from '@catalog-studio/shared';
import { Spinner } from '../components/Spinner';

const PRICE_OPTIONS: { key: PriceKey; label: string }[] = [
  { key: 'premiumPrice', label: 'Premium' },
  { key: 'price', label: 'Mayorista' },
  { key: 'detailPrice', label: 'Detalle' },
];

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

type GenerationState =
  | { status: 'idle' }
  | { status: 'generating' }
  | { status: 'done'; filePath: string }
  | { status: 'error'; message: string };

export function GenerarPDF() {
  const now = new Date();
  const [month, setMonth] = useState(MONTHS[now.getMonth()]);
  const [year, setYear] = useState(String(now.getFullYear()));
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [settings, setSettings] = useState<SettingsDto | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [visiblePrices, setVisiblePrices] = useState<Set<PriceKey>>(
    new Set(PRICE_OPTIONS.map((p) => p.key)),
  );
  const [generation, setGeneration] = useState<GenerationState>({ status: 'idle' });

  useEffect(() => {
    Promise.all([window.api.category.list(), window.api.product.list(), window.api.settings.get()]).then(
      ([cats, prods, sett]) => {
        setCategories(cats);
        setProducts(prods);
        setSettings(sett);
        setSelected(new Set(prods.filter((p) => p.active).map((p) => p.id)));
      },
    );
  }, []);

  const activeProducts = useMemo(() => products.filter((p) => p.active), [products]);
  const activeCategories = useMemo(() => categories.filter((c) => c.active), [categories]);
  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? 'Sin categoría';

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(activeProducts.map((p) => p.id)));
  }

  function selectNone() {
    setSelected(new Set());
  }

  function togglePrice(key: PriceKey) {
    setVisiblePrices((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleGenerate() {
    setGeneration({ status: 'generating' });
    try {
      const result = await window.api.catalogGeneration.generatePdf({
        month,
        year,
        productIds: [...selected],
        visiblePrices: [...visiblePrices],
      });
      if (result.canceled || !result.filePath) {
        setGeneration({ status: 'idle' });
        return;
      }
      setGeneration({ status: 'done', filePath: result.filePath });
    } catch (err) {
      setGeneration({ status: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }

  return (
    <div className="flex h-full w-full font-sans text-text">
      {/* Panel de configuración */}
      <div className="flex w-80 flex-shrink-0 flex-col border-r border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h1 className="text-lg font-bold tracking-tight">Generar catálogo</h1>
          <p className="mt-0.5 text-xs text-text-3">
            {settings?.companyName || 'Configura el diseño del PDF'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-3">
            Mes y año del catálogo
          </div>

          <label className="mb-1.5 block text-xs font-semibold text-text-2">Mes</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="mb-4 h-10 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm font-semibold"
          >
            {MONTHS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>

          <label className="mb-1.5 block text-xs font-semibold text-text-2">Año</label>
          <input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            inputMode="numeric"
            className="mb-4 h-10 w-full rounded-lg border border-border bg-surface-2 px-3 font-mono text-sm font-bold"
          />

          <div className="rounded-lg border border-border bg-surface-2 p-3 text-xs text-text-2">
            {activeProducts.length} productos activos en {activeCategories.length} categorías.
          </div>

          <div className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wide text-text-3">
            Precios a mostrar
          </div>
          <div className="flex flex-col gap-2">
            {PRICE_OPTIONS.map((option) => (
              <label
                key={option.key}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={visiblePrices.has(option.key)}
                  onChange={() => togglePrice(option.key)}
                />
                <span className="font-medium">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="border-t border-border bg-surface-3 px-5 py-3.5">
          <div className="mb-2.5 flex items-center justify-between text-xs text-text-2">
            <span>Portada</span>
            <span className="font-semibold text-text">
              CATALOGO · {month.toUpperCase()} {year}
            </span>
          </div>
          <button
            onClick={handleGenerate}
            disabled={
              generation.status === 'generating' || selected.size === 0 || visiblePrices.size === 0
            }
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-bold text-on-accent disabled:opacity-60"
          >
            {generation.status === 'generating' && <Spinner className="h-4 w-4" />}
            {generation.status === 'generating'
              ? 'Generando…'
              : `Generar PDF (${selected.size} productos)`}
          </button>
          {generation.status === 'done' && (
            <p className="mt-2 text-xs text-green">Guardado en: {generation.filePath}</p>
          )}
          {generation.status === 'error' && (
            <p className="mt-2 text-xs text-red">Error: {generation.message}</p>
          )}
        </div>
      </div>

      {/* Selección de productos a incluir en esta exportación */}
      <div className="flex flex-1 flex-col bg-surface-3">
        <header className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-border bg-surface px-5">
          <span className="text-sm font-semibold">
            Productos a incluir ({selected.size} de {activeProducts.length})
          </span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={selectAll}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-2"
            >
              Seleccionar todos
            </button>
            <button
              onClick={selectNone}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-2"
            >
              Ninguno
            </button>
          </div>
        </header>

        {activeProducts.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-text-3">
            No hay productos activos todavía. Impórtalos primero desde "Importar PDF".
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {activeProducts.map((product) => (
                <label
                  key={product.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(product.id)}
                    onChange={() => toggle(product.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{product.name}</div>
                    <div className="text-xs text-text-3">
                      {product.code} · {categoryName(product.categoryId)}
                    </div>
                  </div>
                  <div className="flex-shrink-0 font-mono text-xs font-semibold">
                    ${product.price.toLocaleString('es-CO')}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
