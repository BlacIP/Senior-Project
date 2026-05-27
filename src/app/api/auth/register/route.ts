import { apiError, apiOk, validationError } from "@/lib/api-response";
import { registerUser } from "@/server/auth-service";

export async function POST(request: Request) {
  try {
    const result = await registerUser(await request.json());

    if (result.error) {
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
