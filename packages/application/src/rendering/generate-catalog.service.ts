import type {
  CategoryRepository,
  ImageStore,
  PdfRenderer,
  ProductRepository,
  SettingsRepository,
} from '@catalog-studio/domain';
import {
  renderCatalogHtml,
  CATALOG_PAGE_SIZE_MM,
  type ProductForTemplate,
} from '@catalog-studio/catalog-template';
import { toCategoryDto } from '../mappers/category.mapper';
import { toProductDto } from '../mappers/product.mapper';
import { toSettingsDto } from '../mappers/settings.mapper';

/**
 * Nombre de archivo fijo dentro de `data/images/` para la portada de marca.
 * Convención simple para esta primera versión — se podría volver
 * configurable desde Configuración en una etapa futura.
 */
const COVER_IMAGE_FILENAME = 'cover-base.png';
const HEADER_IMAGE_FILENAME = 'header.png';
const FOOTER_IMAGE_FILENAME = 'footer.png';

export interface GenerateCatalogInput {
  month: string;
  year: string;
  outputPath: string;
  /** Si se omite, se incluyen todos los productos activos. */
  productIds?: string[];
}

/**
 * Orquesta la generación real del catálogo: arma los datos (Productos
 * activos, Categorías, Configuración de marca), construye el HTML con la
 * plantilla compartida (`@catalog-studio/catalog-template`) y delega el
 * PDF final al `PdfRenderer` (Playwright, en infrastructure).
 */
export class GenerateCatalogService {
  constructor(
    private readonly products: ProductRepository,
    private readonly categories: CategoryRepository,
    private readonly settings: SettingsRepository,
    private readonly images: ImageStore,
    private readonly pdfRenderer: PdfRenderer,
  ) {}

  async generate(input: GenerateCatalogInput): Promise<void> {
    const [allProducts, allCategories, settings] = await Promise.all([
      this.products.findAll(),
      this.categories.findAll(),
      this.settings.get(),
    ]);

    const selectedIds = input.productIds ? new Set(input.productIds) : null;
    const activeProducts = allProducts.filter(
      (p) => p.active && (!selectedIds || selectedIds.has(p.id)),
    );

    const productsForTemplate: ProductForTemplate[] = await Promise.all(
      activeProducts.map(async (product) => ({
        ...toProductDto(product),
        imageDataUri: product.imagePath ? await this.images.readAsDataUri(product.imagePath) : null,
      })),
    );

    const settingsDto = toSettingsDto(settings);
    const logoDataUri = settingsDto.logo ? await this.images.readAsDataUri(settingsDto.logo) : null;
    const [coverImageDataUri, headerImageDataUri, footerImageDataUri] = await Promise.all([
      this.images.readAsDataUri(COVER_IMAGE_FILENAME),
      this.images.readAsDataUri(HEADER_IMAGE_FILENAME),
      this.images.readAsDataUri(FOOTER_IMAGE_FILENAME),
    ]);

    const html = renderCatalogHtml({
      settings: settingsDto,
      logoDataUri,
      coverImageDataUri,
      headerImageDataUri,
      footerImageDataUri,
      month: input.month,
      year: input.year,
      categories: allCategories.map(toCategoryDto),
      products: productsForTemplate,
    });

    await this.pdfRenderer.renderHtmlToPdf(html, input.outputPath, {
      width: `${CATALOG_PAGE_SIZE_MM.width}mm`,
      height: `${CATALOG_PAGE_SIZE_MM.height}mm`,
    });
  }
}
