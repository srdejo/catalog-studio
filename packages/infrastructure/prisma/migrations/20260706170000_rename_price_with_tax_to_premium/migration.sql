-- Rename Product.priceWithTax -> Product.premiumPrice (preserves data)
ALTER TABLE "Product" RENAME COLUMN "priceWithTax" TO "premiumPrice";
