import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { userProfiles } from "@/db/schema";
import { auth } from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validators";

type NeonAuthUser = {
  id?: string;
  email?: string;
  name?: string;
};

function getUserFromAuthResponse(response: unknown): NeonAuthUser | null {
  const data = (response as { data?: unknown }).data;
  const directUser = (data as { user?: NeonAuthUser } | undefined)?.user;

  if (directUser?.id) {
    return directUser;
  }

  if ((data as NeonAuthUser | undefined)?.id) {
    return data as NeonAuthUser;
  }

  return null;
}

function getAuthError(response: unknown) {
  return (response as { error?: { message?: string; status?: number } }).error;
}

async function upsertUserProfile(input: {
  authUserId: string;
  name: string;
  email: string;
  role: "customer" | "vendor" | "admin";
}) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.authUserId, input.authUserId))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [profile] = await db.insert(userProfiles).values(input).returning();
  return profile;
}

export async function registerUser(input: unknown) {
  const parsed = registerSchema.parse(input);
  const response = await auth.signUp.email({
    name: parsed.name,
    email: parsed.email.toLowerCase(),
    password: parsed.password,
  });

  const error = getAuthError(response);
  if (error) {
    return { error };
  }

  const authUser = getUserFromAuthResponse(response);
  if (!authUser?.id) {
    return { error: { message: "Neon Auth did not return a user.", status: 502 } };
  }

  const profile = await upsertUserProfile({
    authUserId: authUser.id,
    name: authUser.name ?? parsed.name,
    email: authUser.email ?? parsed.email.toLowerCase(),
    role: parsed.role,
  });

  return { user: profile };
}

export async function loginUser(input: unknown) {
  const parsed = loginSchema.parse(input);
  const response = await auth.signIn.email({
    email: parsed.email.toLowerCase(),
    password: parsed.password,
  });

  const error = getAuthError(response);
  if (error) {
    return { error };
  }

  const authUser = getUserFromAuthResponse(response);
  if (!authUser?.id) {
    return { error: { message: "Neon Auth did not return a user.", status: 502 } };
  }

  const db = getDb();
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.authUserId, authUser.id))
    .limit(1);

  if (!profile) {
    return {
      error: {
        message: "No LocalLink profile exists for this Neon Auth user.",
        status: 404,
      },
    };
  }

  return { user: profile };
}

export async function loginAdmin(input: unknown) {
  const result = await loginUser(input);

  if (result.error) {
    return result;
  }

  if (result.user.role !== "admin") {
    await auth.signOut();
    return {
      error: {
        message: "This account does not have admin access.",
        status: 403,
      },
    };
  }

  return result;
}

export async function logoutUser() {
  await auth.signOut();
}

export async function getCurrentUser() {
  const { data: session } = await auth.getSession();
  const authUser = session?.user;
  if (!authUser?.id) return null;

  const db = getDb();
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.authUserId, authUser.id))
    .limit(1);

  if (!profile) return null;

  return profile;
}
