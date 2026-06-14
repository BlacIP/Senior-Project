import { apiError, apiOk, validationError } from "@/lib/api-response";
import { checkoutSchema } from "@/lib/validators";
import { createOrder, listCustomerOrders } from "@/server/order-service";

export async function GET() {
  const orders = await listCustomerOrders();

  if (!orders) {
    return apiError("Authentication required.", 401);
  }

  return apiOk({ orders });
}

export async function POST(request: Request) {
  try {
    const parsed = checkoutSchema.parse(await request.json());
    const order = await createOrder(parsed.userIdentifier, parsed.items, {
      deliveryAddress: parsed.deliveryAddress,
      deliveryLatitude: parsed.deliveryLatitude,
      deliveryLongitude: parsed.deliveryLongitude,
      paymentProvider: parsed.paymentProvider,
      paymentReference: parsed.paymentReference,
    });

    return apiOk({ order }, { status: 201 });
  } catch (error) {
    return validationError(error);
  }
}
