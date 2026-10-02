import { createAuthClient } from "@neondatabase/auth";

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;

if (!authUrl) {
  throw new Error("VITE_NEON_AUTH_URL is not configured");
}

export const neonAuth = createAuthClient(authUrl);