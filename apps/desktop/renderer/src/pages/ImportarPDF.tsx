import { useState } from 'react';
import type { ImportPreviewDto, ProductDiffStatus } from '@catalog-studio/shared';
import { Spinner } from '../components/Spinner';

type Step = 'upload' | 'analyzing' | 'review' | 'done';

const STATUS_LABEL: Record<ProductDiffStatus, string> = {
  new: 'Nuevo',
  updated: 'Actualizado',
  unchanged: 'Sin cambios',
  error: 'Error',
};

const STATUS_COLOR: Record<ProductDiffStatus, string> = {
  new: 'text-green',
  updated: 'text-amber',
  unchanged: 'text-text-3',
  error: 'text-red',
};

export function ImportarPDF() {
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreviewDto | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<{ createdCount: number; updatedCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function handleSelectFile() {
    setError(null);
    const filePath = await window.api.catalogImport.selectFile();
    if (!filePath) return;

    setFileName(filePath.split(/[\\/]/).pop() ?? filePath);
    setStep('analyzing');
    try {
      const result = await window.api.catalogImport.analyze(filePath);
      setPreview(result);
      setSelected(new Set(result.items.filter((i) => i.status !== 'error').map((i) => i.code)));
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStep('upload');
    }
  }

  function toggle(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  async function handleConfirm() {
    if (!preview) return;
    setError(null);
    setConfirming(true);
    try {
      const res = await window.api.catalogImport.confirm({
        importId: preview.importId,
        codes: [...selected],
      });
      setResult(res);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirming(false);
    }
  }

  function reset() {
    setStep('upload');
    setPreview(null);
    setSelected(new Set());
    setResult(null);
    setError(null);
  }

  return (
    <div className="flex h-full w-full flex-col font-sans text-text">
      <header className="flex h-14 flex-shrink-0 items-center gap-4 border-b border-border bg-surface px-6">
        <span className="text-sm font-semibold">Importar PDF</span>
        <div className="flex items-center gap-2 text-xs text-text-3">
          <span className={step === 'upload' ? 'font-semibold text-accent-strong' : ''}>1. Subir</span>
          <span>→</span>
          <span className={step === 'analyzing' ? 'font-semibold text-accent-strong' : ''}>2. Extraer</span>
          <span>→</span>
          <span className={step === 'review' || step === 'done' ? 'font-semibold text-accent-strong' : ''}>
            3. Revisar
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        {error && (
          <div className="mx-auto mb-4 max-w-2xl rounded-lg border border-red bg-[color-mix(in_srgb,var(--red)_8%,transparent)] px-4 py-2 text-sm text-red">
            {error}
          </div>
        )}

        {step === 'upload' && (
          <div className="mx-auto max-w-xl text-center">
            <h1 className="mb-2 text-xl font-bold">Importa tu catálogo desde un PDF</h1>
            <p className="mb-6 text-sm text-text-2">
              Selecciona el catálogo en PDF del proveedor y extraeremos automáticamente código, nombre y
              precios. Podrás revisar todo antes de guardar.
            </p>
            <button
              onClick={handleSelectFile}
              className="mx-auto flex h-11 items-center gap-2 rounded-xl bg-accent px-6 text-sm font-bold text-on-accent"
            >
              Seleccionar PDF
            </button>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-12 text-center">
            <Spinner className="h-9 w-9 text-accent" />
            <p className="text-sm text-text-2">
              Analizando <strong className="text-text">{fileName}</strong>…
            </p>
            <p className="text-xs text-text-3">
              Esto puede tardar un par de minutos en catálogos grandes.
            </p>
          </div>
        )}

        {(step === 'review' || step === 'done') && preview && (
          <div className="mx-auto max-w-4xl">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="text-sm font-semibold">{preview.fileName}</div>
              <span className="rounded-full bg-[color-mix(in_srgb,var(--green)_14%,transparent)] px-2.5 py-1 text-xs font-semibold text-green">
                {preview.summary.newCount} nuevos
              </span>
              <span className="rounded-full bg-[color-mix(in_srgb,var(--amber)_14%,transparent)] px-2.5 py-1 text-xs font-semibold text-amber">
                {preview.summary.updatedCount} actualizados
              </span>
              <span className="rounded-full bg-[color-mix(in_srgb,var(--text-3)_14%,transparent)] px-2.5 py-1 text-xs font-semibold text-text-2">
                {preview.summary.unchangedCount} sin cambios
              </span>
              {preview.summary.errorCount > 0 && (
                <span className="rounded-full bg-[color-mix(in_srgb,var(--red)_14%,transparent)] px-2.5 py-1 text-xs font-semibold text-red">
                  {preview.summary.errorCount} errores
                </span>
              )}
            </div>

            {step === 'review' && (
              <>
                {preview.errors.length > 0 && (
                  <details className="mb-4 rounded-lg border border-red bg-[color-mix(in_srgb,var(--red)_8%,transparent)]" open>
                    <summary className="cursor-pointer px-4 py-2 text-sm font-semibold text-red">
                      {preview.errors.length} {preview.errors.length === 1 ? 'error' : 'errores'} durante la extracción
                    </summary>
                    <ul className="max-h-56 overflow-y-auto border-t border-red/30 px-4 py-2 text-xs">
                      {preview.errors.map((err, idx) => (
                        <li key={idx} className="border-b border-red/10 py-1.5 last:border-b-0">
                          <span className="font-semibold text-red">
                            {err.page !== null ? `Página ${err.page}: ` : ''}
                          </span>
                          <span className="text-text-2">{err.message}</span>
                          {err.raw && (
                            <div className="mt-0.5 truncate font-mono text-[11px] text-text-3" title={err.raw}>
                              {err.raw}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}

                <div className="max-h-96 overflow-y-auto rounded-lg border border-border">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-surface-3 text-xs uppercase text-text-3">
                      <tr>
                        <th className="w-10 px-3 py-2"></th>
                        <th className="px-3 py-2">Estado</th>
                        <th className="px-3 py-2">Código</th>
                        <th className="px-3 py-2">Nombre</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.items.map((item) => (
                        <tr key={item.code} className="border-t border-border">
                          <td className="px-3 py-1.5">
                            <input
                              type="checkbox"
                              checked={selected.has(item.code)}
                              disabled={item.status === 'error'}
                              onChange={() => toggle(item.code)}
                            />
                          </td>
                          <td className={`px-3 py-1.5 font-medium ${STATUS_COLOR[item.status]}`}>
                            {STATUS_LABEL[item.status]}
                          </td>
                          <td className="px-3 py-1.5 font-mono text-xs">{item.code}</td>
                          <td className="px-3 py-1.5">{item.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={reset}
                    className="h-10 rounded-lg border border-border px-4 text-sm font-semibold text-text-2"
                  >
                    Cambiar archivo
                  </button>
                  <div className="ml-auto text-sm text-text-2">
                    Se importarán <strong className="text-text">{selected.size}</strong> productos
                  </div>
                  <button
                    onClick={handleConfirm}
                    disabled={confirming}
                    className="flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-bold text-on-accent disabled:opacity-60"
                  >
                    {confirming && <Spinner className="h-4 w-4" />}
                    {confirming ? 'Importando…' : `Importar ${selected.size} productos`}
                  </button>
                </div>
              </>
            )}

            {step === 'done' && result && (
              <div className="rounded-lg border border-green bg-[color-mix(in_srgb,var(--green)_8%,transparent)] p-6 text-center">
                <p className="mb-4 text-sm">
                  Importación completa: <strong>{result.createdCount}</strong> productos nuevos,{' '}
                  <strong>{result.updatedCount}</strong> actualizados.
                </p>
                <button
                  onClick={reset}
                  className="h-10 rounded-lg bg-accent px-5 text-sm font-bold text-on-accent"
                >
                  Importar otro archivo
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
