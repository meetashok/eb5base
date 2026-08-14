import {
  isValidShareId,
  parseSharePayload,
  type VisaBulletinSharePayload,
} from '@/lib/analysis/visaBulletinShareParams';
import { createClient } from '@/lib/supabase-server';
import { isSupabaseConfigured } from '@/lib/supabase-env';

export async function fetchVisaBulletinShare(
  id: string,
): Promise<{ id: string; payload: VisaBulletinSharePayload } | null> {
  if (!isValidShareId(id) || !isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('visa_bulletin_shares')
      .select('id, payload')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    const payload = parseSharePayload(data.payload);
    if (!payload) return null;
    return { id: data.id as string, payload };
  } catch {
    return null;
  }
}
