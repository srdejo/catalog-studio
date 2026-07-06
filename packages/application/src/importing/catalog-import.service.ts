import { randomUUID } from 'node:crypto';
import type {
  CatalogImporter,
  CategoryRepository,
  ImportedCatalog,
  ProductRepository,
} from '@catalog-studio/domain';
import type {
  ConfirmImportDto,
  ConfirmImportResultDto,
  ImportPreviewDto,
  ProductDiffDto,
} from '@catalog-studio/shared';
import { diffProduct } from './catalog-diff';

interface PendingImport {
  fileName: string;
  catalog: ImportedCatalog;
}

const ORDER_STEP = 1000;

/**
 * Orquesta el flujo de importación completo: analizar (sin tocar la base de
 * datos) y confirmar (aplicar los cambios). El resultado de `analyze` se
 * guarda en memoria bajo un `importId` porque IPC es request/response sin
 * estado — es aceptable en una app de escritorio de un solo usuario.
 */
export class CatalogImportService {
  private readonly pending = new Map<string, PendingImport>();

  constructor(
    private readonly products: ProductRepository,
    private readonly categories: CategoryRepository,
    private readonly importers: CatalogImporter[],
  ) {}

  async analyze(filePath: string): Promise<ImportPreviewDto> {
    const importer = this.importers.find((i) => i.supports(filePath));
    if (!importer) {
      throw new Error(`Ningún importador soporta este archivo: ${filePath}`);
    }

    const catalog = await importer.import(filePath);
    const importId = randomUUID();
    const fileName = filePath.split(/[\\/]/).pop() ?? filePath;
    this.pending.set(importId, { fileName, catalog });

    const items: ProductDiffDto[] = [];
    let newCount = 0;
    let updatedCount = 0;
    let unchangedCount = 0;

    for (const imported of catalog.products) {
      const existing = await this.products.findByCode(imported.code);
      const diff = diffProduct(existing, imported);

      if (diff.status === 'new') newCount++;
      else if (diff.status === 'updated') updatedCount++;
      else unchangedCount++;

      items.push({
        code: imported.code,
        status: diff.status,
        name: imported.name,
        changedFields: diff.changedFields,
        before: diff.before,
        after: diff.after,
      });
    }

    return {
      importId,
      fileName,
      summary: {
        newCount,
        updatedCount,
        unchangedCount,
        errorCount: catalog.errors.length,
      },
      items,
      errors: catalog.errors,
    };
  }

  async confirm(input: ConfirmImportDto): Promise<ConfirmImportResultDto> {
    const pending = this.pending.get(input.importId);
    if (!pending) {
      throw new Error('La importación no existe o ya expiró — vuelve a analizar el archivo.');
    }

    const codesToApply = input.codes ? new Set(input.codes) : null;
    let createdCount = 0;
    let updatedCount = 0;
    // Los productos nuevos se agregan al final, en el mismo orden en que
    // aparecen en el PDF (`pending.catalog.products` ya viene en ese orden).
    let nextOrder = (await this.products.findMaxOrder()) + ORDER_STEP;

    for (const imported of pending.catalog.products) {
      if (codesToApply && !codesToApply.has(imported.code)) continue;

      const existing = await this.products.findByCode(imported.code);
      const diff = diffProduct(existing, imported);
      if (diff.status === 'unchanged' || diff.status === 'error') continue;

      if (!existing) {
        const category = imported.categoryName
          ? await this.categories.findByName(imported.categoryName)
          : null;

        await this.products.create({
          code: imported.code,
          name: diff.patch.name ?? imported.name,
          description: diff.patch.description ?? imported.description,
          imagePath: diff.patch.imagePath ?? imported.imagePath,
          categoryId: category?.id ?? null,
          price: diff.patch.price ?? imported.price,
          premiumPrice: diff.patch.premiumPrice ?? imported.premiumPrice ?? imported.price,
          detailPrice: null,
          cost: 0,
          stock: 0,
          order: nextOrder,
          active: true,
        });
        nextOrder += ORDER_STEP;
        createdCount++;
      } else {
        // Solo el patch (campos del proveedor); stock/estado/categoría del
        // usuario no se tocan porque nunca entran en `patch`.
        await this.products.update(existing.id, diff.patch);
        updatedCount++;
      }
    }

    this.pending.delete(input.importId);
    return { createdCount, updatedCount };
  }
}
