import { apiOk } from "@/lib/api-response";
import { listProducts } from "@/server/vendor-service";

export async function GET() {
  const products = await listProducts();
  return apiOk({ products });
}
