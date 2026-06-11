import { apiError, apiOk } from "@/lib/api-response";
import { getPublicProduct } from "@/server/vendor-service";

type ProductRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: ProductRouteContext) {
  const { id } = await context.params;
  const product = await getPublicProduct(id);

  if (!product) {
    return apiError("Product not found.", 404);
  }

  return apiOk({ product });
}
