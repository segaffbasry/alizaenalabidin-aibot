/**
 * Shared Supabase auth-cookie options.
 *
 * Setting a parent cookie domain (e.g. ".alizaenalabidin.com") lets the auth
 * session be shared across the marketing site (alizaenalabidin.com) and the
 * chat app (tanya.alizaenalabidin.com), so logging in on one is recognised on
 * the other.
 *
 * Configure via NEXT_PUBLIC_COOKIE_DOMAIN. Leave it UNSET on localhost and on
 * *.vercel.app preview URLs (those are on the public-suffix list and cannot
 * share cookies) — when unset, Supabase falls back to host-only cookies.
 */
const COOKIE_DOMAIN = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined;

export const cookieOptions = COOKIE_DOMAIN
  ? { domain: COOKIE_DOMAIN }
  : undefined;
