/**
 * Next.js Middleware
 *
 * Refreshes Supabase auth session on every request. Add protected-route logic
 * here later (e.g. /dashboard/* requires auth, /admin/* requires admin role).
 */

import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
