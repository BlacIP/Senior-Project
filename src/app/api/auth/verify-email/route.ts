import { apiError, apiOk, validationError } from "@/lib/api-response";
import { verifyEmailOtp } from "@/server/auth-service";

export async function POST(request: Request) {
  try {
    const result = await verifyEmailOtp(await request.json());

    if (result.error) {
      return apiError(result.error.message ?? "Verification failed.", result.error.status ?? 400);
    }

    return apiOk({ success: true });
  } catch (error) {
    return validationError(error);
  }
}
