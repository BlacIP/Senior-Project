import { apiError, apiOk, validationError } from "@/lib/api-response";
import {
  createVendorProduct,
  getVendorDashboard,
} from "@/server/vendor-service";

export async function GET() {
  const dashboard = await getVendorDashboard();

  if (!dashboard) {
    return apiError("Vendor authentication required.", 401);
  }

  return apiOk({ products: dashboard.products });
}

export async function POST(request: Request) {
  try {
    const product = await createVendorProduct(await request.json());

    if (!product) {
      return apiError("Vendor authentication required.", 401);
    }

    if ("missingProfile" in product) {
      return apiError("Create a vendor profile before adding products.", 409);
    }

    return apiOk({ product }, { status: 201 });
  } catch (error) {
    return validationError(error);
  }
}
