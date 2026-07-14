# EB5 Base

USCIS case status tracker for EB-5 immigrant investors.

**Stack:** Next.js 14 (App Router) · Tailwind CSS · DaisyUI · Supabase · Resend

> The project directory / regional center browse product is **paused** for compliance review.
> See [docs/PROJECT_DIRECTORY_ARCHIVE.md](docs/PROJECT_DIRECTORY_ARCHIVE.md).
> Frozen refs: branch `archive/project-directory`, tag `project-directory-paused-2026-07`.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.local.example .env.local
```

3. Fill in Supabase URL/anon key, service role key, and `RECEIPT_ENCRYPTION_KEY` (`openssl rand -hex 32`).

4. Apply the case-tracker migration in the Supabase SQL Editor:

- `supabase/migrations/20260717_case_tracker_schema.sql`

5. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features (v0)

- Encrypted receipt number storage (AES-256-GCM)
- Onboarding + family case timeline
- Manual refresh + daily cron poller (`USCIS_API_MODE=stub|live`)
- Email notifications via Resend (immediate or digest)
- Anonymized community insights (min 5 users)

## Maintenance mode

Defaults **ON** if `MAINTENANCE_MODE` is unset. Set `MAINTENANCE_MODE=false` for public access, or use `MAINTENANCE_BYPASS_SECRET` with `/?access=SECRET` for private unlock.

## Notes

- Google OAuth + magic link should be enabled in the Supabase dashboard.
- Auth redirect: `https://your-domain/auth/callback` (and localhost for dev).
- Vercel crons are defined in `vercel.json` (`/api/cron/poll-cases`, `/api/cron/digest`).
