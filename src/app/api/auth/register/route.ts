import { apiError, apiOk, validationError } from "@/lib/api-response";
import { registerUser } from "@/server/auth-service";

function isExistingUserError(message?: string) {
  return message?.toLowerCase().includes("user already exists") ?? false;
}

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const result = await registerUser(input);

    if (result.error) {
      if (isExistingUserError(result.error.message)) {
        return apiError("This account already exists. Verify your email to continue.", 409, {
          email: typeof input.email === "string" ? input.email : "",
          verificationRequired: true,
        });
      }

      return apiError(result.error.message ?? "Registration failed.", result.error.status ?? 400);
    }

    return apiOk(
      {
        user: result.user,
        verificationRequired: result.verificationRequired,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return apiError("An account with this email already exists.", 409);
    }

    return validationError(error);
  }
}
