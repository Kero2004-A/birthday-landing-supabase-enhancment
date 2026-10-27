/**
 * Server-only Supabase client. It uses the service_role key, which bypasses Row Level Security,
 * so this file must never be imported from a "use client" component and the key must never
 * get a NEXT_PUBLIC_ prefix.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const MEDIA_BUCKET = process.env.SUPABASE_BUCKET || "birthday-media";

/** Accepts SUPABASE_URL or the NEXT_PUBLIC_SUPABASE_URL name that the Supabase dashboard suggests. */
function supabaseUrl(): string | undefined {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function supabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (client) return client;
  const url = supabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}
