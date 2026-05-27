import { apiError, apiOk } from "@/lib/api-response";
import { getCurrentUser } from "@/server/auth-service";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return apiError("Not authenticated.", 401);
  }

  return apiOk({ user });
}
