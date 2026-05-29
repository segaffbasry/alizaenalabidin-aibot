# Supabase / Auth setup (chat app + marketing site)

Both apps — `alizaenalabidin-aibot` (chat, `tanya.alizaenalabidin.com`) and
`alizaenalabidin-web` (`alizaenalabidin.com`) — share the **same** Supabase
project (`jueprvkuzktxvvoufrzm`). These dashboard steps are global to that
project and back the code changes for email confirmation (Task 2) and shared
login (Task 11).

## 1. Branded confirmation email (Task 2 — branding)

Dashboard → **Authentication → Emails → "Confirm signup"** → paste the contents
of [`email-templates/confirm-signup.html`](./email-templates/confirm-signup.html).
(Optionally do the same for "Magic Link", "Reset password" with matching branding.)

## 2. Require email confirmation before login (Task 2 — enforcement)

Dashboard → **Authentication → Providers → Email** → enable **"Confirm email"**.

The apps also enforce this in code (login signs the user back out if
`email_confirmed_at` is missing), so confirmation is required even if this
toggle is off — but turning it on is the proper primary control.

## 3. Fix the "Not Found / verification failed" confirm link (Task 2 — confirm page)

The apps now expose **both** `/auth/callback` and `/auth/confirm`, each handling
`code` (PKCE) **and** `token_hash`+`type` (verifyOtp). For the redirect to
succeed, the target URLs must be allow-listed:

Dashboard → **Authentication → URL Configuration**:

- **Site URL**: `https://tanya.alizaenalabidin.com` (or the chat app's primary domain)
- **Redirect URLs** — add all of (use your real domains — on Vercel these are
  `alizaenalabidin-aibot.vercel.app` and `alizaenalabidin-web.vercel.app`):
  - `…/auth/callback`  (both apps)
  - `…/auth/confirm`   (both apps)
  - `…/reset-password` (both apps — for the forgot-password flow)
  - (plus `http://localhost:3000/auth/callback` and `http://localhost:3000/reset-password` for local dev)

A confirm link landing on "Not Found" almost always means the redirect URL
wasn't in this allow-list.

## 4. Shared login across site + chat app (Task 11)

Sessions are cookie-scoped per domain. To share login across
`alizaenalabidin.com` and `tanya.alizaenalabidin.com`, set the parent cookie
domain in **both** Vercel projects:

```
NEXT_PUBLIC_COOKIE_DOMAIN=.alizaenalabidin.com
```

- Leave it **unset** on localhost and `*.vercel.app` preview URLs (the public
  suffix list blocks cookie sharing there — it would break auth).
- Only works once both apps are served from real `*.alizaenalabidin.com`
  subdomains. After setting it, existing host-only session cookies may need a
  one-time re-login.
