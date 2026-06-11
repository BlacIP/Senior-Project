CREATE TABLE IF NOT EXISTS "categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "description" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "categories_name_unique" UNIQUE("name"),
  CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
INSERT INTO "categories" ("name", "slug", "description")
VALUES
  ('Fresh produce', 'fresh-produce', 'Vegetables, herbs, and seasonal produce.'),
  ('Fruit', 'fruit', 'Fresh local fruit and orchard products.'),
  ('Dairy and eggs', 'dairy-and-eggs', 'Milk, cheese, eggs, and related staples.'),
  ('Baked goods', 'baked-goods', 'Bread, pastries, and prepared bakery items.'),
  ('Handmade goods', 'handmade-goods', 'Locally made crafts and non-food products.')
ON CONFLICT ("slug") DO UPDATE SET
  "name" = excluded."name",
  "description" = excluded."description",
  "updated_at" = now();
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "category_id" uuid;
--> statement-breakpoint
UPDATE "products"
SET "category_id" = "categories"."id"
FROM "categories"
WHERE lower("products"."category") = lower("categories"."name")
  AND "products"."category_id" IS NULL;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_category_id_categories_id_fk'
  ) THEN
    ALTER TABLE "products"
    ADD CONSTRAINT "products_category_id_categories_id_fk"
    FOREIGN KEY ("category_id") REFERENCES "categories"("id")
    ON DELETE no action ON UPDATE no action;
  END IF;
END $$;
