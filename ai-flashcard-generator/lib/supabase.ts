import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Accounts are optional. They turn on when these two (public) values are set.
 * The anon/publishable key is designed to be public: access is protected by
 * row-level security, see supabase/schema.sql.
 */
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const accountsEnabled = Boolean(URL && KEY);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!accountsEnabled) return null;
  if (!client) {
    client = createClient(URL as string, KEY as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return client;
}
