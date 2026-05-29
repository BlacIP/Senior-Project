import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function apiError<T>(message: string, status = 400, data?: T) {
  return NextResponse.json({ error: message, data }, { status });
}

export function validationError(error: unknown) {
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    const field = issue?.path.join(".");
    const message = issue?.message ?? "Invalid request body";

    return apiError(field ? `${field}: ${message}` : message, 400);
  }

  if (error instanceof SyntaxError) {
    return apiError("Request body must be valid JSON.", 400);
  }

  return apiError(error instanceof Error ? error.message : "Invalid request body", 400);
}
