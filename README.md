# EB5 Base

Free, public, crowdsourced directory of EB-5 immigration investment projects.

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

## Notes

- Configure Google OAuth and magic link (email OTP) in the Supabase dashboard.
- Set the auth redirect URL to `https://your-domain/auth/callback` (and `http://localhost:3000/auth/callback` for local).
- The database schema, RLS policies, and triggers are assumed to already exist in Supabase.
