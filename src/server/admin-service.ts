import "server-only";

import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { orders, products, userProfiles, vendorProfiles } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function requireAdminSession() {
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

  return profile?.role === "admin" ? profile : null;
}

export async function getAdminDashboard() {
  const admin = await requireAdminSession();
  if (!admin) return null;

  const db = getDb();
  const [users, vendors, listings, recentOrders] = await Promise.all([
    db.select().from(userProfiles).orderBy(desc(userProfiles.createdAt)).limit(50),
    db.select().from(vendorProfiles).orderBy(desc(vendorProfiles.createdAt)).limit(50),
    db.select().from(products).orderBy(desc(products.createdAt)).limit(50),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(50),
  ]);

  return {
    admin,
    users,
    vendors,
    products: listings,
    orders: recentOrders,
  };
}
