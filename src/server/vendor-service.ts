import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { categories, products, userProfiles, vendorProfiles } from "@/db/schema";
import { auth } from "@/lib/auth";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { getShortIdFromProductSlug, slugifyProductName } from "@/lib/slug";
import { productSchema, vendorProfileSchema } from "@/lib/validators";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function requireVendorSession() {
  const { data: session } = await auth.getSession();
  const authUserId = session?.user?.id;

  if (!authUserId) {
    return null;
  }

  const db = getDb();
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.authUserId, authUserId))
    .limit(1);

  if (!profile || profile.role !== "vendor") {
    return null;
  }

  return profile;
}

export async function getVendorDashboard() {
  const session = await requireVendorSession();
  if (!session) return null;

  const db = getDb();
  const [vendorProfile] = await db
    .select()
    .from(vendorProfiles)
    .where(eq(vendorProfiles.userProfileId, session.id))
    .limit(1);

  const vendorProducts = vendorProfile
    ? await db
        .select()
        .from(products)
        .where(eq(products.vendorId, vendorProfile.id))
        .orderBy(desc(products.createdAt))
        .limit(12)
    : [];

  return {
    user: {
      id: session.id,
      email: session.email,
      role: session.role,
    },
    profile: vendorProfile ?? null,
    products: vendorProducts,
  };
}

export async function getCurrentVendorProfile() {
  const session = await requireVendorSession();
  if (!session) return { authRequired: true as const };

  const db = getDb();
  const [profile] = await db
    .select()
    .from(vendorProfiles)
    .where(eq(vendorProfiles.userProfileId, session.id))
    .limit(1);

  return profile ?? { missingProfile: true as const };
}

export async function createVendorProfile(input: unknown) {
  const session = await requireVendorSession();
  if (!session) return null;

  const parsed = vendorProfileSchema.parse(input);
  const db = getDb();
  const [profile] = await db
    .insert(vendorProfiles)
    .values({
      userProfileId: session.id,
      businessName: parsed.businessName,
      bio: parsed.bio,
      city: parsed.city,
      state: parsed.state,
    })
    .returning();

  return profile;
}

export async function updateVendorProfile(input: unknown) {
  const session = await requireVendorSession();
  if (!session) return null;

  const parsed = vendorProfileSchema.parse(input);
  const db = getDb();
  const [profile] = await db
    .update(vendorProfiles)
    .set({
      businessName: parsed.businessName,
      bio: parsed.bio || null,
      city: parsed.city,
      state: parsed.state,
      updatedAt: new Date(),
    })
    .where(eq(vendorProfiles.userProfileId, session.id))
    .returning();

  return profile ?? { missingProfile: true as const };
}

async function resolveProductCategory(
  db: ReturnType<typeof getDb>,
  categoryId: string | undefined,
  categoryName: string
) {
  if (!categoryId) {
    return { categoryId: null, categoryName };
  }

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);

  if (!category) {
    throw new Error("Selected category does not exist.");
  }

  return { categoryId: category.id, categoryName: category.name };
}

export async function createVendorProduct(input: unknown) {
  const session = await requireVendorSession();
  if (!session) return null;

  const parsed = productSchema.parse(input);
  const db = getDb();
  const [profile] = await db
    .select()
    .from(vendorProfiles)
    .where(eq(vendorProfiles.userProfileId, session.id))
    .limit(1);

  if (!profile) {
    return { missingProfile: true as const };
  }

  const selectedCategory = await resolveProductCategory(
    db,
    parsed.categoryId || undefined,
    parsed.category
  );

  const [product] = await db
    .insert(products)
    .values({
      vendorId: profile.id,
      name: parsed.name,
      description: parsed.description,
      price: parsed.price.toFixed(2),
      category: selectedCategory.categoryName,
      categoryId: selectedCategory.categoryId,
      city: parsed.city,
      stockQuantity: parsed.stockQuantity,
      imageUrl: parsed.imageUrl || null,
      imageKey: parsed.imageKey || null,
    })
    .returning();

  return product;
}

export async function getVendorProduct(productId: string) {
  const profile = await getCurrentVendorProfile();
  if ("authRequired" in profile || "missingProfile" in profile) return profile;
  if (!isUuid(productId)) return null;

  const db = getDb();
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, productId), eq(products.vendorId, profile.id)))
    .limit(1);

  return product ?? null;
}

export async function updateVendorProduct(productId: string, input: unknown) {
  const profile = await getCurrentVendorProfile();
  if ("authRequired" in profile || "missingProfile" in profile) return profile;
  if (!isUuid(productId)) return null;

  const parsed = productSchema.parse(input);
  const db = getDb();
  const selectedCategory = await resolveProductCategory(
    db,
    parsed.categoryId || undefined,
    parsed.category
  );
  const [product] = await db
    .update(products)
    .set({
      name: parsed.name,
      description: parsed.description,
      price: parsed.price.toFixed(2),
      category: selectedCategory.categoryName,
      categoryId: selectedCategory.categoryId,
      city: parsed.city,
      stockQuantity: parsed.stockQuantity,
      imageUrl: parsed.imageUrl || null,
      imageKey: parsed.imageKey || null,
      updatedAt: new Date(),
    })
    .where(and(eq(products.id, productId), eq(products.vendorId, profile.id)))
    .returning();

  return product ?? null;
}

export async function deleteVendorProduct(productId: string) {
  const profile = await getCurrentVendorProfile();
  if ("authRequired" in profile || "missingProfile" in profile) return profile;
  if (!isUuid(productId)) return null;

  const db = getDb();
  const [product] = await db
    .delete(products)
    .where(and(eq(products.id, productId), eq(products.vendorId, profile.id)))
    .returning();

  return product ?? null;
}

export async function listProducts() {
  const db = getDb();
  const rows = await db
    .select({
      product: products,
      vendor: {
        id: vendorProfiles.id,
        businessName: vendorProfiles.businessName,
        city: vendorProfiles.city,
        state: vendorProfiles.state,
      },
    })
    .from(products)
    .leftJoin(vendorProfiles, eq(products.vendorId, vendorProfiles.id))
    .where(eq(products.isAvailable, true))
    .orderBy(desc(products.createdAt))
    .limit(48);

  return rows.map(({ product, vendor }) => ({
    ...product,
    vendor,
  }));
}

export async function getPublicProduct(productIdentifier: string, vendorIdentifier?: string) {
  const db = getDb();

  const shortId = getShortIdFromProductSlug(productIdentifier);

  if (isUuid(productIdentifier) || shortId) {
    const [row] = await db
      .select({
        product: products,
        vendor: {
          id: vendorProfiles.id,
          businessName: vendorProfiles.businessName,
          bio: vendorProfiles.bio,
          city: vendorProfiles.city,
          state: vendorProfiles.state,
        },
      })
      .from(products)
      .leftJoin(vendorProfiles, eq(products.vendorId, vendorProfiles.id))
      .where(
        and(
          isUuid(productIdentifier)
            ? eq(products.id, productIdentifier)
            : sql`${products.id}::text like ${`${shortId}%`}`,
          eq(products.isAvailable, true)
        )
      )
      .limit(1);

    if (!row) return null;
    if (
      vendorIdentifier &&
      slugifyProductName(row.vendor?.businessName ?? "vendor") !== vendorIdentifier
    ) {
      return null;
    }

    return {
      ...row.product,
      vendor: row.vendor,
    };
  }

  const rows = await db
    .select({
      product: products,
      vendor: {
        id: vendorProfiles.id,
        businessName: vendorProfiles.businessName,
        bio: vendorProfiles.bio,
        city: vendorProfiles.city,
        state: vendorProfiles.state,
      },
    })
    .from(products)
    .leftJoin(vendorProfiles, eq(products.vendorId, vendorProfiles.id))
    .where(eq(products.isAvailable, true))
    .orderBy(desc(products.createdAt))
    .limit(100);

  const row = rows.find(
    ({ product, vendor }) =>
      slugifyProductName(product.name) === productIdentifier &&
      (!vendorIdentifier ||
        slugifyProductName(vendor?.businessName ?? "vendor") === vendorIdentifier)
  );
  if (!row) return null;

  return {
    ...row.product,
    vendor: row.vendor,
  };
}

export async function listCategories() {
  const db = getDb();

  await db
    .insert(categories)
    .values([...DEFAULT_CATEGORIES])
    .onConflictDoNothing({ target: categories.slug });

  await db.execute(sql`
    update products
    set category_id = categories.id
    from categories
    where lower(products.category) = lower(categories.name)
      and products.category_id is null
  `);

  return db.select().from(categories).orderBy(asc(categories.name));
}
