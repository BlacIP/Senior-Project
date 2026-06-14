import { apiError, apiOk } from "@/lib/api-response";
import { listVendorOrders } from "@/server/order-service";

export async function GET() {
  const orders = await listVendorOrders();

  if (!orders) {
    return apiError("Vendor authentication required.", 401);
  }

  if ("missingProfile" in orders) {
    return apiError("Create a vendor profile before managing orders.", 409);
  }

  return apiOk({ orders });
}
