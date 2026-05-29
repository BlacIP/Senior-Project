import { apiError, apiOk, validationError } from "@/lib/api-response";
import { loginUser } from "@/server/auth-service";

export async function POST(request: Request) {
  try {
    const result = await loginUser(await request.json());

    if (result.error) {
      return apiError(result.error.message ?? "Invalid email or password.", result.error.status ?? 401);
    }

    const user = result.user;
    return apiOk({ user });
  } catch (error) {
    return validationError(error);
  }
}
