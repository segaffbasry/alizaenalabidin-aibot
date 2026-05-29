// Supabase's default "Confirm signup" template points at /auth/confirm.
// Reuse the same handler as /auth/callback so both URLs work.
export { GET } from "../callback/route";
