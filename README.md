# Catalog Studio

Aplicación de escritorio local (Electron + React + TypeScript + Prisma/SQLite) para gestionar catálogos de productos y generar catálogos en PDF. Sin servidor, sin internet, sin autenticación — todo vive en el equipo del usuario.

## Requisitos

- Node.js 20+
- npm 10+

## Cómo correr el proyecto

```bash
npm install
npx playwright install chromium   # navegador usado para exportar el PDF final
npm run db:generate                # genera el cliente de Prisma
npm run db:migrate                 # crea data/catalog.db con el schema
npm run dev                        # abre la app de Electron en modo desarrollo
```

Para empaquetar la app instalable:

```bash
npm run build
```

### Assets de marca (opcionales)

El catálogo generado usa tres imágenes fijas, si existen, en `data/images/`:

- `cover-base.png` — portada (año/mes se dibujan encima como texto real).
- `header.png` — banner repetido arriba de cada página de índice/productos.
- `footer.png` — banner repetido abajo de cada página.

Sin estas imágenes, la portada cae a un color plano y las páginas no muestran banner — la app sigue funcionando igual.

## Arquitectura

Monorepo con npm workspaces:

- `apps/desktop` — proceso Electron (main/preload) + renderer React. La UI nunca importa Prisma; toda comunicación pasa por IPC (`window.api.*`).
- `packages/domain` — entidades e interfaces de repositorios/puertos (Clean Architecture). No depende de nada externo.
- `packages/application` — casos de uso (CRUD, importación de catálogos, generación de PDF).
- `packages/infrastructure` — implementaciones concretas: Prisma/SQLite, parsers de PDF, Playwright.
- `packages/shared` — DTOs, schemas de validación (Zod) y contrato de canales IPC.
- `packages/catalog-template` — plantilla del catálogo en React puro (sin Electron/Node), convertida a HTML y luego a PDF con Playwright. Reutilizable a futuro para una versión web.

Los datos del usuario (`catalog.db`, imágenes de producto, assets de marca) viven en `data/`, fuera del código y del control de versiones.

## Funcionalidad implementada

- **CRUD real** de Categorías, Productos y Configuración vía IPC.
- **Importar PDF** (`ImportarPDF`): sube un catálogo de proveedor en PDF, extrae código/nombre/precios/imagen automáticamente, muestra una tabla de revisión (nuevo/actualizado/sin cambios/error) y confirma la importación sin duplicar productos (el código es la clave única). Incluye un parser específico para catálogos con grilla de tarjetas (2 columnas) y uno genérico de tabla como respaldo.
- **Generar PDF** (`GenerarPDF`): arma el catálogo completo (portada, índice, páginas de productos paginadas) a partir de los productos activos, con selección de cuáles incluir en cada exportación puntual.
- Arquitectura de importadores basada en estrategias (`CatalogImporter` + `PdfTextParser`) pensada para admitir más formatos/proveedores sin tocar el resto del código.

## Pendiente (próximas etapas)

Dashboard con métricas, pantallas visuales de CRUD (Productos/Categorías/Configuración), exportar/importar Excel, gestión de imágenes desde la UI.
