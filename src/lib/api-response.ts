import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function validationError(error: unknown) {
  if (error instanceof ZodError) {
    return apiError(error.issues[0]?.message ?? "Invalid request body", 400);
  }

  return apiError("Invalid request body", 400);
}
