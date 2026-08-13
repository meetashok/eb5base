# AGENTS.md

## Cursor Cloud specific instructions

EB5 Base is a single Next.js 14 (App Router) + TypeScript web app backed by Supabase.
Package manager is **npm** (`package-lock.json`). There is no automated test suite; "testing"
here means lint + build + running the app. Standard scripts live in `package.json`
(`dev`, `build`, `start`, `lint`).

### Running / lint / build (see `package.json` for the source of truth)
- Dev server: `npm run dev` → http://localhost:3000 (compiles routes on demand; first hit to
  a route can take 10-60s to compile — that is normal, not a hang).
- Lint: `npm run lint`. NOTE: this runs `next lint` **and** a custom `bash scripts/check-emdash.sh`
  that fails if any em dash (U+2014) or en dash (U+2013) appears in `src/app` or `src/components`.
  On the current branch the emdash check **fails on pre-existing committed strings/comments**, so
  `npm run lint` exits non-zero even though `next lint` itself only reports one image warning. Run
  `npx next lint` alone to check just the ESLint portion.
- Build: `npm run build`. On the `cursor/nprm-eb5base-*` branch this currently **fails** with a
  pre-existing TypeScript error (`Duplicate identifier 'Eb5BaseLikelihood'` in
  `src/lib/nprm/types.ts`, declared at the top and again mid-file). This is a code bug on the
  branch, not an environment problem. `next dev` uses SWC (types are stripped) so the app still
  runs fine in dev despite this.

### Supabase (important, non-obvious)
- The app is **pre-wired for a local Supabase stack**: when `NEXT_PUBLIC_SUPABASE_URL` /
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` are unset, `src/lib/supabase-env.ts` falls back to
  `http://127.0.0.1:54321` with the standard Supabase-CLI demo anon key. So the app boots and
  every page renders **without any credentials** — Supabase-backed pages (`/projects`, `/rc`,
  auth, tracker) just show empty/degraded state and log `ECONNREFUSED 127.0.0.1:54321` on the
  server. This is expected graceful degradation, not a crash.
- **The database schema is NOT in the repo.** `supabase/migrations/` are incremental patches that
  assume base tables (`public.profiles`, `public.projects`) and the `rc_brands` seed rows already
  exist; those base objects are managed in the maintainers' hosted Supabase dashboard, not in
  version control. Therefore `supabase start` / `supabase db reset` **cannot build a clean DB from
  repo files** (fails with `relation "public.profiles" does not exist`). Do not expect to bring the
  project directory online from the repo alone.
- To exercise the full Supabase-backed features, connect a real Supabase project by setting
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`
  (add them as Cursor secrets). Configure the auth redirect to `http://localhost:3000/auth/callback`.

### Fully working without any backend (good for smoke tests)
These core surfaces read committed data files (`public/data/**`) and work with zero credentials:
- NPRM comment tool + builder: `/nprm`, `/nprm/write` (builds a public-comment / LLM prompt from
  selected topics and stances).
- I-485 analysis dashboards: `/analysis/i485` (redirects to `/analysis/i485/inventory`), plus
  `/analysis/i485/compare`, `/priority-date`.

### Toolchain notes
- Node 22 / npm 10 are used here (Next 14 needs Node >= 18).
- Docker and the Supabase CLI are pre-installed in the VM snapshot for anyone who wants to try a
  local Supabase stack. Docker has no systemd here: start it manually with `sudo dockerd &` (a
  `policy-rc.d` returning 101 blocks the broken auto-start), and it is configured for the
  `fuse-overlayfs` storage driver with the containerd snapshotter disabled in
  `/etc/docker/daemon.json`.
- Other integrations (USCIS case API, Resend email, cron) default to stub/degraded modes and need
  no credentials for local dev.
