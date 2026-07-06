interface PageHeaderProps {
  title: string;
  headerImageDataUri: string | null;
}

/**
 * Solo el banner de marca, pegado al borde superior — sin la fila de texto
 * (categoría/empresa) con línea separadora que quedaba debajo, misma idea
 * que se aplicó al footer. El título de la sección queda como insignia
 * discreta sobre la esquina del banner.
 */
export function PageHeader({ title, headerImageDataUri }: PageHeaderProps) {
  return (
    <header className="page-header">
      {headerImageDataUri && <img src={headerImageDataUri} alt="" className="page-header-banner" />}
      <span className="page-header-title">{title}</span>
    </header>
  );
}

interface PageFooterProps {
  pageNumber: number;
  footerImageDataUri: string | null;
}

/**
 * Solo el banner de marca, pegado al borde inferior de la página — sin la
 * fila de texto (empresa/catálogo) que antes quedaba debajo, para que el
 * footer termine justo en el borde físico. El número de página queda como
 * insignia discreta sobre la esquina del banner.
 */
export function PageFooter({ pageNumber, footerImageDataUri }: PageFooterProps) {
  return (
    <footer className="page-footer">
      {footerImageDataUri && <img src={footerImageDataUri} alt="" className="page-footer-banner" />}
      <span className="page-footer-number">{String(pageNumber).padStart(2, '0')}</span>
    </footer>
  );
}
