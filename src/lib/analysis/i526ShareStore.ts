import {
  isValidShareId,
  parseSharePayload,
  type I526SharePayload,
} from '@/lib/analysis/i526ShareParams';
import { createClient } from '@/lib/supabase-server';
import { isSupabaseConfigured } from '@/lib/supabase-env';

export async function fetchI526Share(
  id: string,
): Promise<{ id: string; payload: I526SharePayload } | null> {
  if (!isValidShareId(id) || !isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('i526_shares')
      .select('id, payload')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    const parsed = parseSharePayload(data.payload);
    if (!parsed) return null;
    return { id: data.id as string, payload: parsed };
  } catch {
    return null;
  }
}
