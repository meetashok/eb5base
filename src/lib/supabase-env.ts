const PLACEHOLDER_URL = 'http://127.0.0.1:54321';
const PLACEHOLDER_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Next.js only inlines direct process.env.NEXT_PUBLIC_* references in the browser bundle.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

function isValidSupabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isSupabaseConfigured() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  if (SUPABASE_URL.startsWith('<') || SUPABASE_ANON_KEY.startsWith('<')) return false;

  return isValidSupabaseUrl(SUPABASE_URL);
}

export function getSupabaseConfig() {
  if (isSupabaseConfigured()) {
    return {
      url: SUPABASE_URL,
      key: SUPABASE_ANON_KEY,
    };
  }

  return { url: PLACEHOLDER_URL, key: PLACEHOLDER_KEY };
}
