"use server";

import { getDb } from "@/db";
import { orderItems, orders, products, userProfiles, vendorProfiles } from "@/db/schema";
import { getCurrentUser } from "@/server/auth-service";
import { and, desc, eq, or } from "drizzle-orm";

type CheckoutItem = {
  productId: string;
  quantity: number;
};

type CreateOrderOptions = {
  deliveryAddress?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  paymentProvider?: string;
  paymentReference?: string;
};

type OrderRow = typeof orders.$inferSelect;
type OrderItemRow = typeof orderItems.$inferSelect;
type ProductRow = typeof products.$inferSelect;
type VendorRow = typeof vendorProfiles.$inferSelect;
type CustomerRow = typeof userProfiles.$inferSelect;

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function groupOrderRows(
  rows: Array<{
    order: OrderRow;
    item: OrderItemRow | null;
    product: ProductRow | null;
    vendor: Pick<VendorRow, "id" | "businessName" | "city" | "state"> | null;
    customer?: Pick<CustomerRow, "id" | "name" | "email"> | null;
  }>
) {
  const grouped = new Map<
    string,
    OrderRow & {
      customer?: Pick<CustomerRow, "id" | "name" | "email"> | null;
      items: Array<
        OrderItemRow & {
          product: ProductRow | null;
          vendor: Pick<VendorRow, "id" | "businessName" | "city" | "state"> | null;
        }
      >;
    }
  >();

  rows.forEach((row) => {
    const existing =
      grouped.get(row.order.id) ??
      ({
        ...row.order,
        customer: row.customer,
        items: [],
      } satisfies OrderRow & {
        customer?: Pick<CustomerRow, "id" | "name" | "email"> | null;
        items: Array<
          OrderItemRow & {
            product: ProductRow | null;
            vendor: Pick<VendorRow, "id" | "businessName" | "city" | "state"> | null;
          }
        >;
      });

    if (row.item) {
      existing.items.push({
        ...row.item,
        product: row.product,
        vendor: row.vendor,
      });
    }

    grouped.set(row.order.id, existing);
  });

  return Array.from(grouped.values());
}

export async function createOrder(
  userIdentifier: string,
  items: CheckoutItem[],
  options: CreateOrderOptions = {}
) {
  if (!items.length) {
    throw new Error("Cart is empty");
  }

  const db = getDb();

  const customer = await db.query.userProfiles.findFirst({
    where: isUuid(userIdentifier)
      ? or(eq(userProfiles.id, userIdentifier), eq(userProfiles.authUserId, userIdentifier))
      : eq(userProfiles.authUserId, userIdentifier),
  });

  if (!customer) {
    throw new Error("User profile not found");
  }

  let total = 0;

  const productRecords = await Promise.all(
    items.map(async (item) => {
      const product = await db.query.products.findFirst({
        where: eq(products.id, item.productId),
      });

      if (!product) {
        throw new Error("Product not found");
      }

      total += Number(product.price) * item.quantity;

      return {
        product,
        quantity: item.quantity,
      };
    })
  );

  const [order] = await getDb()
    .insert(orders)
    .values({
      customerProfileId: customer.id,
      totalAmount: total.toString(),
      status: options.paymentReference ? "confirmed" : "pending",
      deliveryAddress: options.deliveryAddress,
      deliveryLatitude: options.deliveryLatitude?.toFixed(6),
      deliveryLongitude: options.deliveryLongitude?.toFixed(6),
      paymentProvider: options.paymentProvider,
      paymentStatus: options.paymentReference ? "paid" : "pending",
      paymentReference: options.paymentReference,
    })
    .returning();

  await getDb().insert(orderItems).values(
    productRecords.map((item) => ({
      orderId: order.id,
      productId: item.product.id,
      quantity: item.quantity,
      unitPrice: item.product.price,
    }))
  );

  return order;
}

export async function listCustomerOrders() {
  const user = await getCurrentUser();
  if (!user) return null;

  const db = getDb();
  const rows = await db
    .select({
      order: orders,
      item: orderItems,
      product: products,
      vendor: {
        id: vendorProfiles.id,
        businessName: vendorProfiles.businessName,
        city: vendorProfiles.city,
        state: vendorProfiles.state,
      },
    })
    .from(orders)
    .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
    .leftJoin(products, eq(orderItems.productId, products.id))
    .leftJoin(vendorProfiles, eq(products.vendorId, vendorProfiles.id))
    .where(eq(orders.customerProfileId, user.id))
    .orderBy(desc(orders.createdAt));

  return groupOrderRows(rows);
}

export async function listVendorOrders() {
  const user = await getCurrentUser();
  if (!user || user.role !== "vendor") return null;

  const db = getDb();
  const [vendorProfile] = await db
    .select()
    .from(vendorProfiles)
    .where(eq(vendorProfiles.userProfileId, user.id))
    .limit(1);

  if (!vendorProfile) return { missingProfile: true as const };

  const rows = await db
    .select({
      order: orders,
      item: orderItems,
      product: products,
      vendor: {
        id: vendorProfiles.id,
        businessName: vendorProfiles.businessName,
        city: vendorProfiles.city,
        state: vendorProfiles.state,
      },
      customer: {
        id: userProfiles.id,
        name: userProfiles.name,
        email: userProfiles.email,
      },
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(userProfiles, eq(orders.customerProfileId, userProfiles.id))
    .leftJoin(vendorProfiles, eq(products.vendorId, vendorProfiles.id))
    .where(eq(products.vendorId, vendorProfile.id))
    .orderBy(desc(orders.createdAt));

  return groupOrderRows(rows);
}

export async function updateVendorOrderStatus(
  orderId: string,
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "vendor") return null;
  if (!isUuid(orderId)) return { notFound: true as const };

  const db = getDb();
  const [vendorProfile] = await db
    .select()
    .from(vendorProfiles)
    .where(eq(vendorProfiles.userProfileId, user.id))
    .limit(1);

  if (!vendorProfile) return { missingProfile: true as const };

  const [ownedOrder] = await db
    .select({ id: orders.id })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orders.id, orderId), eq(products.vendorId, vendorProfile.id)))
    .limit(1);

  if (!ownedOrder) return { notFound: true as const };

  const [order] = await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();

  return order;
}

export async function confirmCustomerOrderReceived(orderId: string) {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!isUuid(orderId)) return { notFound: true as const };

  const db = getDb();
  const [existingOrder] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.customerProfileId, user.id)))
    .limit(1);

  if (!existingOrder) return { notFound: true as const };
  if (existingOrder.status !== "delivered") {
    return { invalidStatus: true as const };
  }

  const [order] = await db
    .update(orders)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();

  return order;
}
