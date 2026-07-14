# Project Directory Archive

The EB-5 **project directory** and **regional center browse** features are paused for securities / compliance review. They are not deleted from git history.

## Frozen snapshot

| Ref | Purpose |
|-----|---------|
| Branch `archive/project-directory` | Long-lived frozen copy of the directory product |
| Tag `project-directory-paused-2026-07` | Point-in-time marker at the pause |

Restore either ref to browse the full directory codebase as it existed when paused.

```bash
git checkout archive/project-directory
# or
git checkout project-directory-paused-2026-07
```

## What was paused (removed from the live App Router)

### Routes

- `/projects`, `/projects/add`, `/projects/new`, `/projects/[id]`, `/projects/[id]/edit`
- `/rc`, `/rc/add`, `/rc/new`, `/rc/[slug]`, `/rc/[slug]/edit`, `/rc/[slug]/[projectSlug]`
- `/regional-centers`, `/regional-centers/new` (legacy redirects)
- Directory-era `/timeline` (user contribution feed)
- `/admin` moderation queues (directory/RC focused)
- Role-based `/profile/setup` (investor / RC / attorney onboarding)

### Notable components & libs (on the archive branch)

- `src/components/Project*.tsx`, `FilterPanel`, `ConfirmationWidget`, `ClaimProjectButton`, …
- `src/lib/projects.ts`, `project-loader.ts`, `project-images*.ts`, `approvals.ts`, …
- `src/app/rc/**`, `src/app/projects/**`, `src/components/admin/**`

## Database

**Do not drop** directory tables. They remain in Supabase for a future restore:

- `projects`, `project_votes`, `project_contacts`, `project_images`
- `rc_brands`, `rc_brand_contacts`, `regional_centers`, `rc_memberships`
- `content_submissions`, `duplicate_report_groups`, related RPCs

The case-tracker app simply stops querying them.

## How to restore (checklist)

1. Checkout `archive/project-directory` (or the tag) and copy needed routes/components/libs onto a branch that already has the case tracker.
2. Re-add public path rules in `src/lib/supabase-middleware.ts` for `/projects` and `/rc`.
3. Restore Navbar links (Browse, Regional Centers, Add Project) alongside Timeline / Insights.
4. Confirm RLS and storage bucket `project-images` still exist in Supabase.
5. Decide product shape: directory + tracker in one app, or separate deploy later.
6. Update landing copy and metadata; re-enable any admin moderation you still need.

## Related product

The live app on `cursor/case-tracker-v0` (and successors) is the **USCIS case status tracker**. Shared foundation kept: auth, Supabase clients, layout, DaisyUI `eb5base` theme, legal/contact shells.
