import type { CatalogTemplateData } from '../types';

/**
 * La portada real (`cover-base.png`) trae el diseño de marca completo
 * incrustado como imagen (logos, foto de producto, pie de contacto), con un
 * espacio en blanco reservado entre el encabezado y el logo LEP para el
 * texto del catálogo — ahí se dibuja año/"CATALOGO"/mes como HTML real,
 * nunca incrustado en la imagen, para que cambien en cada exportación.
 */
export function CoverPage({ data }: { data: CatalogTemplateData }) {
  const { settings, coverImageDataUri, month, year } = data;

  if (!coverImageDataUri) {
    // Sin portada de marca configurada: color plano de respaldo.
    return (
      <section
        className="page cover-page cover-page-fallback"
        style={{ background: settings.primaryColor, color: '#fff' }}
      >
        <h1 className="cover-title">{settings.companyName || 'Catálogo'}</h1>
        <p className="cover-subtitle">
          CATÁLOGO · {month.toUpperCase()} {year}
        </p>
      </section>
    );
  }

  return (
    <section className="page cover-page" style={{ backgroundImage: `url(${coverImageDataUri})` }}>
      <div className="cover-text-block">
        <span className="cover-year-text">{year}</span>
        <span className="cover-catalogo-text">CATALOGO</span>
        <span className="cover-divider" />
        <span className="cover-month-text">{month.toUpperCase()}</span>
      </div>
    </section>
  );
}
