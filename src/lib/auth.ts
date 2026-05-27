import "server-only";

import { createNeonAuth } from "@neondatabase/auth/next/server";

const devCookieSecret =
  "development-only-neon-auth-cookie-secret-change-me";

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL ?? "http://localhost:3000",
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET ?? devCookieSecret,
    sessionDataTtl: 300,
  },
});
