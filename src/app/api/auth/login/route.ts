import { apiError, apiOk, validationError } from "@/lib/api-response";
import { loginUser } from "@/server/auth-service";

function isVerificationRequiredError(message?: string) {
  return message?.toLowerCase().includes("email verification required") ?? false;
}

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const result = await loginUser(input);

    if (result.error) {
      if (isVerificationRequiredError(result.error.message)) {
        return apiError("Email verification required.", 403, {
          email: typeof input.email === "string" ? input.email : "",
          verificationRequired: true,
        });
      }

      return apiError(result.error.message ?? "Invalid email or password.", result.error.status ?? 401);
    }

    const user = result.user;
    return apiOk({ user });
  } catch (error) {
    return validationError(error);
  }
}
