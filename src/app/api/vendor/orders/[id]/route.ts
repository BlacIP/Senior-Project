import { apiError, apiOk, validationError } from "@/lib/api-response";
import { orderStatusSchema } from "@/lib/validators";
import { updateVendorOrderStatus } from "@/server/order-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsed = orderStatusSchema.parse(await request.json());
    const order = await updateVendorOrderStatus(id, parsed.status);

    if (!order) {
      return apiError("Vendor authentication required.", 401);
    }

    if ("missingProfile" in order) {
      return apiError("Create a vendor profile before managing orders.", 409);
    }

    if ("notFound" in order) {
      return apiError("Order not found.", 404);
    }

    return apiOk({ order });
  } catch (error) {
    return validationError(error);
  }
}
