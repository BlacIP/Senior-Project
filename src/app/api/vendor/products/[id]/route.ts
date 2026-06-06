import { apiError, apiOk, validationError } from "@/lib/api-response";
import {
  deleteVendorProduct,
  getVendorProduct,
  updateVendorProduct,
} from "@/server/vendor-service";

type ProductRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: ProductRouteContext) {
  const { id } = await context.params;
  const product = await getVendorProduct(id);

  if (!product) {
    return apiError("Product not found.", 404);
  }

  if ("authRequired" in product) {
    return apiError("Vendor authentication required.", 401);
  }

  if ("missingProfile" in product) {
    return apiError("Create a vendor profile before managing products.", 409);
  }

  return apiOk({ product });
}

export async function PATCH(request: Request, context: ProductRouteContext) {
  try {
    const { id } = await context.params;
    const product = await updateVendorProduct(id, await request.json());

    if (!product) {
      return apiError("Product not found.", 404);
    }

    if ("authRequired" in product) {
      return apiError("Vendor authentication required.", 401);
    }

    if ("missingProfile" in product) {
      return apiError("Create a vendor profile before managing products.", 409);
    }

    return apiOk({ product });
  } catch (error) {
    return validationError(error);
  }
}

export async function DELETE(_request: Request, context: ProductRouteContext) {
  const { id } = await context.params;
  const product = await deleteVendorProduct(id);

  if (!product) {
    return apiError("Product not found.", 404);
  }

  if ("authRequired" in product) {
    return apiError("Vendor authentication required.", 401);
  }

  if ("missingProfile" in product) {
    return apiError("Create a vendor profile before managing products.", 409);
  }

  return apiOk({ product });
}
