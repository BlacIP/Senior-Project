import { apiOk } from "@/lib/api-response";
import { logoutUser } from "@/server/auth-service";

export async function POST() {
  await logoutUser();
  return apiOk({ success: true });
}
