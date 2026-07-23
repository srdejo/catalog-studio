import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateProductSchema, type CategoryDto, type ProductDto } from '@catalog-studio/shared';
import { z } from 'zod';
import { ActiveSwitch } from './ActiveSwitch';
import { CurrencyInput } from './CurrencyInput';

type FormValues = z.infer<typeof CreateProductSchema>;

interface ProductFormModalProps {
  product: ProductDto | null; // null = crear nuevo
  categories: CategoryDto[];
  onClose: () => void;
  onSaved: () => void;
}

export function ProductFormModal({ product, categories, onClose, onSaved }: ProductFormModalProps) {
  const [imagesBaseUrl, setImagesBaseUrl] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(CreateProductSchema),
    defaultValues: product
      ? {
          code: product.code,
          name: product.name,
          description: product.description ?? '',
          imagePath: product.imagePath,
          categoryId: product.categoryId,
          price: product.price,
          premiumPrice: product.premiumPrice,
          detailPrice: product.detailPrice ?? undefined,
          cost: product.cost,
          stock: product.stock,
          active: product.active,
        }
      : { price: 0, premiumPrice: 0, cost: 0, stock: 0, active: true },
  });

  const imagePath = watch('imagePath');

  useEffect(() => {
    window.api.app.imagesBaseUrl().then(setImagesBaseUrl);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      if (product) {
        await window.api.product.update(product.id, values);
      } else {
        await window.api.product.create(values);
      }
      onSaved();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo guardar el producto.');
    }
  }

  async function handlePickImage() {
    const fileName = await window.api.product.selectImage();
    if (fileName) setValue('imagePath', fileName, { shouldDirty: true });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-surface p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-bold">{product ? 'Editar producto' : 'Nuevo producto'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-2">
              {imagePath && imagesBaseUrl ? (
                <img
                  src={`${imagesBaseUrl}/${imagePath}`}
                  alt={product?.name ?? 'Producto'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs text-text-3">Sin imagen</span>
              )}
            </div>
            <button
              type="button"
              onClick={handlePickImage}
              className="h-9 rounded-lg border border-border px-3 text-xs font-semibold text-text-2"
            >
              Elegir imagen…
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-text-2">
              Código
              <input
                {...register('code')}
                className="h-9 rounded-lg border border-border bg-surface-2 px-2 text-sm font-mono"
              />
              {errors.code && <span className="text-red">{errors.code.message}</span>}
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-text-2">
              Categoría
              <select
                {...register('categoryId')}
                className="h-9 rounded-lg border border-border bg-surface-2 px-2 text-sm"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1 text-xs font-semibold text-text-2">
            Nombre
            <input
              {...register('name')}
              className="h-9 rounded-lg border border-border bg-surface-2 px-2 text-sm"
            />
            {errors.name && <span className="text-red">{errors.name.message}</span>}
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-text-2">
              Premium
              <Controller
                control={control}
                name="premiumPrice"
                render={({ field }) => (
                  <CurrencyInput
                    value={field.value}
                    onChange={field.onChange}
                    className="h-9 rounded-lg border border-border bg-surface-2 px-2 text-sm font-mono"
                  />
                )}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-text-2">
              Mayorista
              <Controller
                control={control}
                name="price"
                render={({ field }) => (
                  <CurrencyInput
                    value={field.value}
                    onChange={field.onChange}
                    className="h-9 rounded-lg border border-border bg-surface-2 px-2 text-sm font-mono"
                  />
                )}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-text-2">
              Detalle
              <Controller
                control={control}
                name="detailPrice"
                render={({ field }) => (
                  <CurrencyInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="= mayorista"
                    className="h-9 rounded-lg border border-border bg-surface-2 px-2 text-sm font-mono"
                  />
                )}
              />
            </label>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-text-2">
            <ActiveSwitch value={watch('active') ?? true} onToggle={(next) => setValue('active', next, { shouldDirty: true })} />
            Activo
          </div>

          {submitError && <p className="text-xs font-semibold text-red">{submitError}</p>}

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
