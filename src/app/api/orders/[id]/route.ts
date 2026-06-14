import { apiError, apiOk } from "@/lib/api-response";
import { confirmCustomerOrderReceived } from "@/server/order-service";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = await confirmCustomerOrderReceived(id);

  if (!order) {
    return apiError("Authentication required.", 401);
  }

  if ("notFound" in order) {
    return apiError("Order not found.", 404);
  }

  if ("invalidStatus" in order) {
    return apiError("Only delivered orders can be confirmed as received.", 409);
  }

  return apiOk({ order });
}
