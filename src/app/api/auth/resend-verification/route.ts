import { apiError, apiOk, validationError } from "@/lib/api-response";
import { resendEmailVerification } from "@/server/auth-service";

export async function POST(request: Request) {
  try {
    const result = await resendEmailVerification(await request.json());

    if (result.error) {
      return apiError(
        result.error.message ?? "Could not resend verification code.",
        result.error.status ?? 400
      );
    }

    return apiOk({ success: true });
  } catch (error) {
    return validationError(error);
  }
}
