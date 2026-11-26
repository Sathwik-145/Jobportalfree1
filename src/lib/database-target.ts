/**
 * Where the database lives: ONE Supabase project, configured through environment variables.
 *
 * Browser (build-time, public):   VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
 * Server (Cloudflare runtime):    SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, optional SUPABASE_SERVICE_ROLE_KEY (secret)
 *
 * The server falls back to the VITE_ values, so setting only those also works.
 * Browser-safe: this file contains no secrets.
 */
import { cleanEnvValue, cleanSupabaseUrl } from "./supabase-env";

function serverEnv(name: string): string {
  if (typeof window !== "undefined" || typeof process === "undefined") return "";
  return process.env[name] || "";
}

/** Supabase project URL. */
export function databaseUrl(): string {
  return cleanSupabaseUrl(serverEnv("SUPABASE_URL") || import.meta.env.VITE_SUPABASE_URL || "");
}

/** Public (publishable / anon) key. */
export function databaseKey(): string {
  return cleanEnvValue(serverEnv("SUPABASE_PUBLISHABLE_KEY") || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "");
}

/**
 * Server-only secret key, or "" when none is set. Optional: without it the website server
 * identifies itself with the CRON_SECRET header instead (see server-access.server.ts).
 */
export function databaseServiceKey(): string {
  return cleanEnvValue(serverEnv("SUPABASE_SERVICE_ROLE_KEY"));
}
