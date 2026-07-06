import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { CategoryDto } from '@catalog-studio/shared';
import { CategoryFormModal } from '../components/CategoryFormModal';
import { Spinner } from '../components/Spinner';
import { ActiveSwitch } from '../components/ActiveSwitch';

export function Categorias() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CategoryDto | null | 'new'>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setCategories(await window.api.category.list());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDelete(category: CategoryDto) {
    if (!confirm(`¿Eliminar la categoría "${category.name}"?`)) return;
    setError(null);
    try {
      await window.api.category.delete(category.id);
      await refresh();
    } catch {
      setError(
        `No se pudo eliminar "${category.name}": tiene productos asignados. Reasigna esos productos a otra categoría primero.`,
      );
    }
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
        <span className="text-sm font-semibold">Categorías ({categories.length})</span>
        <button
          onClick={() => setEditing('new')}
          className="ml-auto h-9 rounded-lg bg-accent px-4 text-sm font-bold text-on-accent"
        >
          + Nueva categoría
        </button>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {error && (
          <div className="mx-auto mb-4 max-w-2xl rounded-lg border border-red bg-[color-mix(in_srgb,var(--red)_8%,transparent)] px-4 py-2 text-sm text-red">
            {error}
          </div>
        )}

        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="text-xs uppercase text-text-3">
              <th className="px-2 py-2">Nombre</th>
              <th className="px-2 py-2">Descripción</th>
              <th className="px-2 py-2">Activa</th>
              <th className="w-20 px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-t border-border hover:bg-surface-2">
                <td className="px-2 py-2 font-medium">{category.name}</td>
                <td className="px-2 py-2 text-text-2">{category.description ?? '—'}</td>
                <td className="px-2 py-2">
                  <ActiveSwitch
                    value={category.active}
                    onToggle={async (next) => {
                      await window.api.category.update(category.id, { active: next });
                      refresh();
                    }}
                  />
                </td>
                <td className="px-2 py-2">
                  <div className="flex gap-1">
                    <button onClick={() => setEditing(category)} className="rounded p-1.5 hover:bg-surface-2">
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="rounded p-1.5 text-red hover:bg-surface-2"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-2 py-8 text-center text-text-3">
                  Aún no hay categorías.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <CategoryFormModal
          category={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}
