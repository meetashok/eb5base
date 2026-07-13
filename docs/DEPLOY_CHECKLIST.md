# EB5 Base — Pre-launch deploy checklist

Complete before Monday public beta.

## Production deploy

- [ ] Latest `main` deployed to https://eb5base.com (Vercel or your host)
- [ ] Homepage loads with styles (hard refresh if needed)
- [ ] Google OAuth sign-in works on production URL (not just localhost)
- [ ] Supabase redirect URLs include `https://eb5base.com/auth/callback`

## Database migrations (Supabase SQL Editor)

Run once in the SQL Editor (idempotent — safe to re-run):

- [ ] **`supabase/production_release.sql`** — consolidated release script (profiles RLS, onboarding, user flows v1, RC memberships + RPCs, avatar backfill)

Individual migration files under `supabase/migrations/` are kept for history; use the single file above for production.

## Email forwarding

Set up in your domain provider (Google Workspace, Cloudflare Email Routing, etc.):

- [ ] `feedback@eb5base.com` → your inbox (test send/receive)
- [ ] `hello@eb5base.com` → your inbox (if not already)

The app links to these addresses in the beta banner, Contact page, and footer.

## Smoke test on production

Walk through [`docs/V1_TESTING_PLAN.md`](./V1_TESTING_PLAN.md) highlights:

- [ ] Browse `/projects` — search, filters, sort
- [ ] Sign in with Google → profile setup if new user
- [ ] Confirm project status on a card → appears on `/timeline`
- [ ] Add project flow → redirects to `/timeline`
- [ ] Contact page — feedback + hello mailto links open correctly
- [ ] Beta banner visible on all pages

## Launch

- [ ] Post in 1–2 investor WhatsApp groups ([`docs/LAUNCH_COMMS.md`](./LAUNCH_COMMS.md))
- [ ] Email 2–3 RC contacts
- [ ] Monitor feedback@ for first 48 hours
