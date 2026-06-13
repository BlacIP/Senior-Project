"use server";

import { getDb } from "@/db";
import { orders, orderItems, products, userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

type CheckoutItem = {
  productId: string;
  quantity: number;
};

export async function createOrder(
  authUserId: string,
  items: CheckoutItem[]
) {
  const customer = await getDb().query.userProfiles.findFirst({
    where: eq(userProfiles.authUserId, authUserId),
  });

  if (!customer) {
    throw new Error("Customer profile not found");
  }

  let total = 0;

  const productRecords = await Promise.all(
    items.map(async (item) => {
      const product = await getDb().query.products.findFirst({
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
      status: "pending",
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