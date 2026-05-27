import "server-only";

import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { products, userProfiles, vendorProfiles } from "@/db/schema";
import { auth } from "@/lib/auth";
import { productSchema, vendorProfileSchema } from "@/lib/validators";

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

  const [product] = await db
    .insert(products)
    .values({
      vendorId: profile.id,
      name: parsed.name,
      description: parsed.description,
      price: parsed.price.toFixed(2),
      category: parsed.category,
      city: parsed.city,
      stockQuantity: parsed.stockQuantity,
      imageUrl: parsed.imageUrl || null,
    })
    .returning();

  return product;
}

export async function listProducts() {
  const db = getDb();
  return db.select().from(products).orderBy(desc(products.createdAt)).limit(24);
}
