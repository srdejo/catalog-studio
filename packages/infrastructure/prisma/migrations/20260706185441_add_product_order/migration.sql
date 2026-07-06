-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imagePath" TEXT,
    "categoryId" TEXT,
    "price" REAL NOT NULL,
    "premiumPrice" REAL NOT NULL,
    "detailPrice" REAL,
    "cost" REAL NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "order" REAL NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("active", "categoryId", "code", "cost", "createdAt", "description", "detailPrice", "id", "imagePath", "name", "premiumPrice", "price", "stock", "updatedAt") SELECT "active", "categoryId", "code", "cost", "createdAt", "description", "detailPrice", "id", "imagePath", "name", "premiumPrice", "price", "stock", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Backfill: asigna un `order` inicial que preserva la secuencia actual
-- (createdAt ascendente == orden de importación desde el PDF), dejando
-- huecos de 1000 entre cada producto para insertar/reordenar después sin
-- tener que reescribir el resto.
UPDATE "Product"
SET "order" = sub.rn * 1000
FROM (SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) AS rn FROM "Product") AS sub
WHERE "Product"."id" = sub."id";
