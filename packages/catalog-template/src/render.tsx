import { renderToStaticMarkup } from 'react-dom/server';
import { CatalogDocument } from './components/CatalogDocument';
import { catalogStyles } from './styles';
import type { CatalogTemplateData } from './types';

/**
 * Convierte los datos del catálogo en un documento HTML autocontenido,
 * listo para que Playwright lo cargue y lo exporte a PDF (o para servirlo
 * directamente en una futura versión web).
 */
export function renderCatalogHtml(data: CatalogTemplateData): string {
  const body = renderToStaticMarkup(<CatalogDocument data={data} />);

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>${catalogStyles}</style>
</head>
<body>${body}</body>
</html>`;
}
