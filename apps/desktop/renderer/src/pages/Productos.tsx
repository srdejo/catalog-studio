import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import type { CategoryDto, ProductDto } from '@catalog-studio/shared';
import { ProductFormModal } from '../components/ProductFormModal';
import { Spinner } from '../components/Spinner';
import { ActiveSwitch } from '../components/ActiveSwitch';

const PAGE_SIZE = 25;
const NO_CATEGORY = '__none__';

function computeNewOrder(items: ProductDto[], index: number): number {
  const prev = items[index - 1];
  const next = items[index + 1];
  if (prev && next) return (prev.order + next.order) / 2;
  if (prev) return prev.order + 1000;
  if (next) return next.order - 1000;
  return 1000;
}

interface InlinePriceProps {
  value: number;
  onSave: (value: number) => void;
}

function InlinePrice({ value, onSave }: InlinePriceProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  if (!editing) {
    return (
      <button
        onClick={() => {
          setDraft(String(value));
          setEditing(true);
        }}
        className="font-mono text-sm font-semibold hover:underline"
        title="Clic para editar"
      >
        ${value.toLocaleString('es-CO')}
      </button>
    );
  }

  function commit() {
    const parsed = Number(draft);
    setEditing(false);
    if (!Number.isNaN(parsed) && parsed !== value) onSave(parsed);
  }

  return (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') setEditing(false);
      }}
      className="w-24 rounded border border-accent bg-surface px-1.5 py-0.5 font-mono text-sm"
    />
  );
}

function SortableRow({
  row,
  children,
  dragDisabled,
}: {
  row: { id: string };
  children: React.ReactNode;
  dragDisabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
    disabled: dragDisabled,
  });

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="border-t border-border hover:bg-surface-2"
    >
      <td className="w-8 px-2 py-2">
        {!dragDisabled && (
          <span {...attributes} {...listeners} className="cursor-grab text-text-3">
            <GripVertical size={16} />
          </span>
        )}
      </td>
      {children}
    </tr>
  );
}

export function Productos() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(() =>
    searchParams.get('category') === 'none' ? NO_CATEGORY : '',
  );
  const [imageFilter, setImageFilter] = useState(() => searchParams.get('image') === 'missing');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editingProduct, setEditingProduct] = useState<ProductDto | null | 'new'>(null);
  const [imagesBaseUrl, setImagesBaseUrl] = useState<string>('');

  async function refresh() {
    const [prods, cats] = await Promise.all([window.api.product.list(), window.api.category.list()]);
    setProducts(prods);
    setCategories(cats);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    window.api.app.imagesBaseUrl().then(setImagesBaseUrl);
  }, []);

  // Los filtros llegan por query param (p.ej. desde las tarjetas del Dashboard);
  // una vez aplicados se limpia la URL para que quede como estado normal de la página.
  useEffect(() => {
    if (searchParams.has('category') || searchParams.has('image')) {
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? 'Sin categoría';

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter === NO_CATEGORY) {
        if (p.categoryId !== null) return false;
      } else if (categoryFilter && p.categoryId !== categoryFilter) {
        return false;
      }
      if (imageFilter && p.imagePath) return false;
      if (!term) return true;
      return p.code.toLowerCase().includes(term) || p.name.toLowerCase().includes(term);
    });
  }, [products, search, categoryFilter, imageFilter]);

  const isCustomOrderView = sorting.length === 0;

  async function handleReorder(id: string, newOrder: number) {
    await window.api.product.reorder({ id, order: newOrder });
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, order: newOrder } : p)).sort((a, b) => a.order - b.order),
    );
  }

  async function handleDelete(product: ProductDto) {
    if (!confirm(`¿Eliminar "${product.name}"?`)) return;
    await window.api.product.delete(product.id);
    await refresh();
  }

  const columns = useMemo<ColumnDef<ProductDto>[]>(
    () => [
      {
        id: 'image',
        header: '',
        cell: ({ row }) => (
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded bg-surface-2 text-[9px] text-text-3">
            {row.original.imagePath && imagesBaseUrl ? (
              <img
                src={`${imagesBaseUrl}/${row.original.imagePath}`}
                alt={row.original.name}
                className="h-full w-full object-cover"
              />
            ) : (
              '—'
            )}
          </div>
        ),
      },
      { accessorKey: 'code', header: 'Código', cell: (c) => <span className="font-mono text-xs">{c.getValue<string>()}</span> },
      { accessorKey: 'name', header: 'Nombre' },
      {
        id: 'category',
        header: 'Categoría',
        accessorFn: (p) => categoryName(p.categoryId),
      },
      { accessorKey: 'premiumPrice', header: 'Premium', cell: (c) => `$${c.getValue<number>().toLocaleString('es-CO')}` },
      {
        accessorKey: 'price',
        header: 'Mayorista',
        cell: ({ row }) => (
          <InlinePrice
            value={row.original.price}
            onSave={async (value) => {
              await window.api.product.update(row.original.id, { price: value });
              refresh();
            }}
          />
        ),
      },
      {
        accessorKey: 'detailPrice',
        header: 'Detalle',
        cell: ({ row }) => (
          <InlinePrice
            value={row.original.detailPrice ?? row.original.price}
            onSave={async (value) => {
              await window.api.product.update(row.original.id, { detailPrice: value });
              refresh();
            }}
          />
        ),
      },
      {
        accessorKey: 'active',
        header: 'Activo',
        cell: ({ row }) => (
          <ActiveSwitch
            value={row.original.active}
            onToggle={async (next) => {
              await window.api.product.update(row.original.id, { active: next });
              refresh();
            }}
          />
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex gap-1">
            <button onClick={() => setEditingProduct(row.original)} className="rounded p-1.5 hover:bg-surface-2">
              <Pencil size={15} />
            </button>
            <button onClick={() => handleDelete(row.original)} className="rounded p-1.5 text-red hover:bg-surface-2">
              <Trash2 size={15} />
            </button>
          </div>
        ),
      },
    ],
    [categories, imagesBaseUrl],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const pageRows = table.getRowModel().rows.map((r) => r.original);
    const oldIndex = pageRows.findIndex((p) => p.id === active.id);
    const newIndex = pageRows.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(pageRows, oldIndex, newIndex);
    const movedProduct = reordered[newIndex];
    const newOrder = computeNewOrder(reordered, newIndex);
    handleReorder(movedProduct.id, newOrder);
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner className="h-8 w-8 text-accent" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col font-sans text-text">
      <header className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-border bg-surface px-6">
        <span className="text-sm font-semibold">Productos ({filtered.length})</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código o nombre…"
          className="ml-4 h-9 w-64 rounded-lg border border-border bg-surface-2 px-3 text-sm"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 rounded-lg border border-border bg-surface-2 px-2 text-sm"
        >
          <option value="">Todas las categorías</option>
          <option value={NO_CATEGORY}>Sin categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 text-sm">
          <input type="checkbox" checked={imageFilter} onChange={(e) => setImageFilter(e.target.checked)} />
          Sin imagen
        </label>
        {!isCustomOrderView && (
          <span className="text-xs text-text-3">Ordenando por columna — arrastre deshabilitado</span>
        )}
        <button
          onClick={() => setEditingProduct('new')}
          className="ml-auto h-9 rounded-lg bg-accent px-4 text-sm font-bold text-on-accent"
        >
          + Nuevo producto
        </button>
      </header>

      <div className="flex-1 overflow-auto p-4">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="text-xs uppercase text-text-3">
              <th className="w-8"></th>
              {table.getFlatHeaders().map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="cursor-pointer select-none px-2 py-2"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? ''}
                </th>
              ))}
            </tr>
          </thead>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={table.getRowModel().rows.map((r) => r.original.id)}
              strategy={verticalListSortingStrategy}
            >
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <SortableRow key={row.id} row={{ id: row.original.id }} dragDisabled={!isCustomOrderView}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-2 py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </SortableRow>
                ))}
              </tbody>
            </SortableContext>
          </DndContext>
        </table>
      </div>

      <footer className="flex h-12 flex-shrink-0 items-center justify-between border-t border-border bg-surface px-6 text-sm">
        <span className="text-text-3">
          Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded border border-border px-3 py-1 disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded border border-border px-3 py-1 disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </footer>

      {editingProduct && (
        <ProductFormModal
          product={editingProduct === 'new' ? null : editingProduct}
          categories={categories}
          onClose={() => setEditingProduct(null)}
          onSaved={async () => {
            setEditingProduct(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}
