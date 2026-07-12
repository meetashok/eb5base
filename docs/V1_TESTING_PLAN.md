# EB5Base V1 — Manual Testing Plan

Use this checklist before the v1 release. It is written for **one Google account** plus **Supabase SQL toggles** to switch personas — no need for multiple logins unless you prefer that later.

**Estimated time:** 2–3 hours if you walk through everything in order.

---

## Before you start

### Environment

- [ ] Use a **staging Supabase project** (recommended) or accept that test data will land in prod.
- [ ] Migrations applied, at minimum:
  - `supabase/migrations/20260711_approval_workflow.sql`
  - `supabase/migrations/20260711_project_images.sql`
  - `supabase/migrations/20260712_user_flows_v1.sql`
- [ ] App running locally (`npm run dev`) or deployed to a staging URL.
- [ ] Google OAuth configured; you can sign in with one test Google account.

### Your test account

1. Sign in once via Google.
2. Complete **Profile setup** (`/profile/setup`) at least once so a `profiles` row exists.
3. Note your email and user id in Supabase:

```sql
SELECT id, email, display_name, role, is_admin, profile_completed
FROM public.profiles
WHERE email = 'YOUR_EMAIL@gmail.com';
```

Save your `id` — use it as `YOUR_USER_ID` below.

### Minimal test data

Create (via UI or SQL) before running role-specific flows:

- [ ] At least **one RC brand** (`/rc`) — note its `id` and linked `regional_centers.id` if any.
- [ ] At least **two projects** under that brand (one you’ll edit, one for duplicate reporting).
- [ ] Optional: a second RC brand to test RC duplicate merge.

---

## Supabase toggle cheat sheet

Replace `YOUR_EMAIL@gmail.com` and `YOUR_USER_ID` with your values.

### Reset to baseline (investor, not admin, RC unverified)

Run this between major test sections if you want a clean slate:

```sql
-- Remove admin
UPDATE public.profiles
SET is_admin = FALSE
WHERE email = 'YOUR_EMAIL@gmail.com';

-- Unverify RC membership (if exists)
UPDATE public.rc_memberships
SET verified_at = NULL, active = TRUE, revoked_at = NULL
WHERE user_id = 'YOUR_USER_ID';

-- Optional: set role back to investor
UPDATE public.profiles
SET role = 'investor'
WHERE id = 'YOUR_USER_ID';
```

### Persona: Admin

```sql
UPDATE public.profiles
SET is_admin = TRUE
WHERE email = 'YOUR_EMAIL@gmail.com';
```

Sign out and back in (or hard refresh) so middleware picks up admin access.

### Persona: RC operator (unverified)

1. In the app: `/profile/setup` → role **RC Representative** → select or add an RC.
2. Confirm membership exists but is not verified:

```sql
SELECT id, rc_id, verified_at, active
FROM public.rc_memberships
WHERE user_id = 'YOUR_USER_ID';
-- verified_at should be NULL
```

### Persona: RC operator (verified)

```sql
UPDATE public.rc_memberships
SET verified_at = now(), active = TRUE, revoked_at = NULL
WHERE user_id = 'YOUR_USER_ID';
```

Ensure the membership’s `rc_id` matches a `regional_centers` row whose `brand_id` is the RC brand you’re testing.

### Look up IDs you’ll need

```sql
-- RC brand + linked USCIS entities
SELECT b.id AS brand_id, b.name AS brand_name, rc.id AS rc_entity_id, rc.name
FROM public.rc_brands b
LEFT JOIN public.regional_centers rc ON rc.brand_id = b.id
ORDER BY b.name;

-- Your pending submissions
SELECT id, entity_type, action, status, created_at
FROM public.content_submissions
WHERE submitted_by = 'YOUR_USER_ID'
ORDER BY created_at DESC;

-- Your duplicate reports
SELECT id, entity_type, status, created_at
FROM public.duplicate_report_groups
WHERE reported_by = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

---

## Section 1 — Logged out (no toggles)

| # | Action | Expected |
|---|--------|----------|
| 1.1 | Open `/projects` | Project list loads |
| 1.2 | Open `/rc` | RC brand list loads (no `merged_into` errors) |
| 1.3 | Open an approved project detail | Detail page loads; RC verified badge only if `rc_verified_at` set |
| 1.4 | Click confirm Open/Closed | Sign-in modal appears (styled prompt) |
| 1.5 | Open `/projects/add` | Sign-in prompt or redirect to login |
| 1.6 | Open `/admin` | Redirect to login or profile (not admin UI) |
| 1.7 | Paste URL of a **pending** project (from Section 2) | Hidden or “not found” for anonymous users |

---

## Section 2 — Investor (baseline toggles)

**Setup:** Run “Reset to baseline”. Complete profile setup as **Investor** if not already.

| # | Action | Expected |
|---|--------|----------|
| 2.1 | Add a project (`/projects/add`) | Creates with `status = pending`; redirect to profile **My Activity** (or project if misconfigured) |
| 2.2 | Profile → **My Activity** | New submission shows **Pending approval** |
| 2.3 | Suggest edit on an existing approved project | Edit queued; live listing unchanged; Activity shows pending edit |
| 2.4 | Confirm subscription Open/Closed on a project | Vote saved; appears under **My Confirmations** |
| 2.5 | Report duplicate (multi-select) on a project | Row in `duplicate_report_groups`; Activity shows pending duplicate report |
| 2.6 | Add RC brand (`/rc/add`) | Pending unless you’re admin; shows in Activity |
| 2.7 | Try delete on a project you don’t own | Delete disabled or error (community cannot delete) |

**Leave pending items in place** — you’ll approve them as admin in Section 3.

---

## Section 3 — Admin

**Setup:** Run “Persona: Admin” SQL. Refresh session.

| # | Action | Expected |
|---|--------|----------|
| 3.1 | Open `/admin` | Tabbed queues: Submissions, Duplicate reports, RC verification |
| 3.2 | **Submissions** → approve investor project create | Project `status = approved`; visible on browse |
| 3.3 | **Submissions** → approve investor edit | Payload applied to live project |
| 3.4 | **Submissions** → reject one item (with reason) | Rejection reason visible on submitter’s Activity |
| 3.5 | Add project as admin | **Live immediately** — no pending queue |
| 3.6 | Edit project as admin | **Live immediately** |
| 3.7 | **Duplicate reports** → resolve merge | Pick canonical; duplicates get `merged_into`; hidden from browse |
| 3.8 | **Duplicate reports** → dismiss | Report status `dismissed`; listings unchanged |
| 3.9 | **RC verification** → verify your RC membership | `rc_memberships.verified_at` set (needed for Section 4) |
| 3.10 | Non-admin browser/incognito → `/admin` | Cannot access admin UI |

---

## Section 4 — Verified RC rep

**Setup:** Ensure Section 3.9 verified your membership (or run “Persona: RC operator (verified)” SQL). **Remove admin** unless testing admin+RC together:

```sql
UPDATE public.profiles SET is_admin = FALSE WHERE id = 'YOUR_USER_ID';
```

| # | Action | Expected |
|---|--------|----------|
| 4.1 | Add project under **your** RC brand | **Approved immediately** — no queue |
| 4.2 | Edit project under your RC | **Live immediately** |
| 4.3 | Edit RC brand (`/rc/[slug]/edit`) for your brand | **Live immediately** |
| 4.4 | RC brand page → **Available to claim** | Lists unverified projects under your brand |
| 4.5 | Claim project + attest accuracy | `claimed_by`, `rc_verified_at` set; **RC verified** badge on detail |
| 4.6 | Profile → **My Projects** / claimed section | Claimed project listed |
| 4.7 | Switch to investor toggles (reset admin, unverify optional) | — |
| 4.8 | As investor: open edit on RC-verified project | Blocked — message explains community edits not accepted |
| 4.9 | As investor: confirm subscription + report duplicate on RC-verified project | Still allowed |
| 4.10 | As verified RC rep: delete own RC project | Allowed |
| 4.11 | As investor: delete project | Not allowed |

---

## Section 5 — Unverified RC rep

**Setup:**

```sql
UPDATE public.profiles SET is_admin = FALSE WHERE id = 'YOUR_USER_ID';
UPDATE public.rc_memberships SET verified_at = NULL WHERE user_id = 'YOUR_USER_ID';
```

Re-onboard as RC rep in app if membership was removed.

| # | Action | Expected |
|---|--------|----------|
| 5.1 | Add project under your RC | Goes to **pending** (same as investor) |
| 5.2 | RC brand page | **No** “Available to claim” section |
| 5.3 | Profile | Shows “Verification pending” for RC |
| 5.4 | Admin → RC verification | Your request appears; verify again when done |

---

## Section 6 — Edge cases & hardening

| # | Action | Expected |
|---|--------|----------|
| 6.1 | Open merged duplicate project URL | Redirects to canonical project |
| 6.2 | Open merged RC brand URL | Redirects or resolves to canonical brand |
| 6.3 | `/rc` browse | Merged brands hidden |
| 6.4 | Pending project direct URL as owner | Owner can view; others cannot |
| 6.5 | Sign-in modal → Sign in → return | Lands on intended action after login |

---

## Pre-release todos (not covered by this checklist)

Track separately before calling v1 done:

- [ ] **Security audit** — RLS policies, admin guards, pending visibility, no accidental PII exposure (e.g. public profiles, API responses).
- [ ] **Legal review** — Re-read `/terms` and `/privacy`; consider attorney review.

---

## Quick reset after testing

Optional cleanup in staging:

```sql
-- Delete test duplicate report groups you created
DELETE FROM public.duplicate_report_groups WHERE reported_by = 'YOUR_USER_ID';

-- Delete test submissions (does not delete entities)
DELETE FROM public.content_submissions WHERE submitted_by = 'YOUR_USER_ID';

-- Soft approach: leave projects/brands and mark rejected
-- UPDATE public.projects SET status = 'rejected' WHERE added_by = 'YOUR_USER_ID';
```

---

## Tips

- **Hard refresh** or **sign out/in** after changing `is_admin` — middleware reads profile on each request but client state may be stale.
- **Two windows:** keep Supabase SQL editor open in one monitor and the app in another.
- **Screenshot failures** with the URL, role toggles applied, and any console/network errors — speeds up fixes later.
- If something fails only in prod, compare migration history between staging and prod first.

---

## Sign-off

| Area | Tester | Date | Pass? |
|------|--------|------|-------|
| Logged out | | | |
| Investor | | | |
| Admin | | | |
| Verified RC rep | | | |
| Unverified RC rep | | | |
| Edge cases | | | |
| Security / legal | | | |
