import { apiError, apiOk } from "@/lib/api-response";
import { getAdminDashboard } from "@/server/admin-service";

export async function GET() {
  const dashboard = await getAdminDashboard();

  if (!dashboard) {
    return apiError("Admin authentication required.", 401);
  }

  return apiOk(dashboard);
}
