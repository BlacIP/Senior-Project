import { apiOk } from "@/lib/api-response";
import { listCategories } from "@/server/vendor-service";

export async function GET() {
  const categories = await listCategories();
  return apiOk({ categories });
}
