import { createClient, type PostgrestError, type SupabaseClient } from "@supabase/supabase-js";
import { connection } from "next/server";

// All data lives in Supabase (Postgres + Storage). Only this server talks to it, using the
// secret key; the tables have row-level security on with no policies, so public keys get nothing.
let client: SupabaseClient | undefined;

/** The server-side Supabase client. Marks the caller as request-time so data is never prerendered. */
export async function db(): Promise<SupabaseClient> {
  await connection();
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) {
      throw new Error("Supabase is not configured: set SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local, then restart the server.");
    }
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}

/** Unwraps a Supabase result, throwing on errors so they surface instead of reading as empty data. */
export function must<T>({ data, error }: { data: T; error: PostgrestError | null }): T {
  if (error) {
    const detail = [error.message, error.code && `code ${error.code}`, error.details, error.hint].filter(Boolean).join(" | ");
    throw new Error(`Database error: ${detail || JSON.stringify(error)}`);
  }
  return data;
}

/** Postgres unique-constraint violation (e.g. an email that's already registered). */
export const isUniqueViolation = (error: PostgrestError | null) => error?.code === "23505";

/** Ids come from URLs; anything that isn't a UUID can't match a row (and would make Postgres error). */
export const isUuid = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

/** Timestamps as ISO strings ("…Z"), the same shape the app has always used. */
export const iso = (value: string | null | undefined) => (value ? new Date(value).toISOString() : undefined);
