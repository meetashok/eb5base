# EB5 Base

Public, crowdsourced directory of EB-5 immigration investment projects.

**Stack:** Next.js 14 (App Router) · Tailwind CSS · DaisyUI · Supabase

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.local.example .env.local
```

3. Fill in your Supabase project URL and anon key from the Supabase dashboard.

4. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Access lock (owner + attorney)

Recommended while legal review is open:

1. Put Cloudflare Access in front of `eb5base.com` (allowlist your email + counsel).
2. Then set `MAINTENANCE_MODE=false` so after Cloudflare login you see the real directory.

Step-by-step: [docs/CLOUDFLARE_ACCESS.md](docs/CLOUDFLARE_ACCESS.md)

## Maintenance mode

The site defaults to a public maintenance page (all routes, including `/rc` and `/projects`).

- Leave `MAINTENANCE_MODE` unset, or set `MAINTENANCE_MODE=true`, to keep the directory offline for everyone (including you).
- Set `MAINTENANCE_MODE=false` only after Cloudflare Access is enabled, then redeploy.

## Notes

- Configure Google OAuth and magic link (email OTP) in the Supabase dashboard.
- Set the auth redirect URL to `https://your-domain/auth/callback` (and `http://localhost:3000/auth/callback` for local).
- The database schema, RLS policies, and triggers are assumed to already exist in Supabase.
- **Pre-release manual testing:** see [docs/V1_TESTING_PLAN.md](docs/V1_TESTING_PLAN.md) (Supabase toggle personas + workflow checklist).
- **Public beta launch:** see [docs/DEPLOY_CHECKLIST.md](docs/DEPLOY_CHECKLIST.md) and [docs/LAUNCH_COMMS.md](docs/LAUNCH_COMMS.md).
