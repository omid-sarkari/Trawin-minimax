/**
 * Supabase Client (Browser-side)
 *
 * Used in Client Components for auth, queries, mutations, and realtime
 * subscriptions. The URL and anon key come from NEXT_PUBLIC_* env vars so they
 * are available in the browser.
 */

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
