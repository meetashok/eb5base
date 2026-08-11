-- Allow anon/authenticated to call the security-definer increment RPC
-- (function only bumps the aggregate counter; no PII).
-- Run in Supabase SQL Editor if POST /api/nprm/prompt-use returns 503
-- without SUPABASE_SERVICE_ROLE_KEY on Vercel.

GRANT EXECUTE ON FUNCTION public.increment_nprm_prompt_copies() TO anon, authenticated;
