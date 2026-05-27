import { apiError, apiOk, validationError } from "@/lib/api-response";
import { loginAdmin } from "@/server/auth-service";

export async function POST(request: Request) {
  try {
    const result = await loginAdmin(await request.json());

    if (result.error) {
      return apiError(result.error.message ?? "Admin login failed.", result.error.status ?? 401);
    }

    return apiOk({ user: result.user });
  } catch (error) {
    return validationError(error);
  }
}
