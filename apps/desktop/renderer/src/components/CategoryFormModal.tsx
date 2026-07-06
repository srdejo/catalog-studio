import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateCategorySchema, type CategoryDto } from '@catalog-studio/shared';
import { z } from 'zod';
import { ActiveSwitch } from './ActiveSwitch';

type FormValues = z.infer<typeof CreateCategorySchema>;

interface CategoryFormModalProps {
  category: CategoryDto | null; // null = crear nueva
  onClose: () => void;
  onSaved: () => void;
}

export function CategoryFormModal({ category, onClose, onSaved }: CategoryFormModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(CreateCategorySchema),
    defaultValues: category
      ? {
          name: category.name,
          description: category.description ?? '',
          order: category.order,
          active: category.active,
        }
      : { active: true },
  });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  async function onSubmit(values: FormValues) {
    if (category) {
      await window.api.category.update(category.id, values);
    } else {
      await window.api.category.create(values);
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-bold">{category ? 'Editar categoría' : 'Nueva categoría'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold text-text-2">
            Nombre
            <input
              autoFocus
              {...register('name')}
              className="h-9 rounded-lg border border-border bg-surface-2 px-2 text-sm"
            />
            {errors.name && <span className="text-red">{errors.name.message}</span>}
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-text-2">
            Descripción
            <textarea
              {...register('description')}
              rows={2}
              className="rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-sm"
            />
          </label>

          <div className="flex items-center gap-2 text-xs font-semibold text-text-2">
            <ActiveSwitch value={watch('active') ?? true} onToggle={(next) => setValue('active', next, { shouldDirty: true })} />
            Activa
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-border px-4 text-sm font-semibold text-text-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-lg bg-accent px-5 text-sm font-bold text-on-accent disabled:opacity-60"
            >
              {isSubmitting ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
