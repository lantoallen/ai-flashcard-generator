import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Accounts are optional. They turn on when these two (public) values are set.
 * The anon/publishable key is designed to be public: access is protected by
 * row-level security, see supabase/schema.sql.
 */
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Development only: NEXT_PUBLIC_MOCK_BACKEND=1 swaps in an in-browser stand-in
 * (lib/dev/mock-supabase.ts) so the community can be tried without Supabase.
 * The NODE_ENV check lets the bundler drop all of it from production builds.
 */
export const usingMockBackend =
  process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_MOCK_BACKEND === '1';

export const accountsEnabled = usingMockBackend || Boolean(URL && KEY);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!accountsEnabled) return null;
  if (!client && usingMockBackend) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createMockClient } = require('./dev/mock-supabase') as typeof import('./dev/mock-supabase');
    client = createMockClient() as SupabaseClient;
  }
  if (!client) {
    client = createClient(URL as string, KEY as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return client;
}
