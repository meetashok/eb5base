const PLACEHOLDER_URL = 'http://127.0.0.1:54321';
const PLACEHOLDER_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

function readEnv(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
  return process.env[name]?.trim() ?? '';
}

function isValidSupabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isSupabaseConfigured() {
  const url = readEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (!url || !key) return false;
  if (url.startsWith('<') || key.startsWith('<')) return false;

  return isValidSupabaseUrl(url);
}

export function getSupabaseConfig() {
  if (isSupabaseConfigured()) {
    return {
      url: readEnv('NEXT_PUBLIC_SUPABASE_URL'),
      key: readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    };
  }

  return { url: PLACEHOLDER_URL, key: PLACEHOLDER_KEY };
}
