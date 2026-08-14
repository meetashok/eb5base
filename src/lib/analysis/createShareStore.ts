import { isValidShareId } from '@/lib/analysis/shareId';
import { createClient } from '@/lib/supabase-server';
import { isSupabaseConfigured } from '@/lib/supabase-env';

/**
 * Build a server-side fetcher that resolves a share id to a typed payload.
 * Each dataset supplies its table and a `toPayload` adapter.
 */
export function createShareStore<TPayload>({
  table,
  toPayload,
}: {
  table: string;
  toPayload: (rawPayload: unknown) => TPayload | null;
}) {
  return async function fetchShare(
    id: string,
  ): Promise<{ id: string; payload: TPayload } | null> {
    if (!isValidShareId(id) || !isSupabaseConfigured()) return null;
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from(table)
        .select('id, payload')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) return null;
      const payload = toPayload(data.payload);
      if (!payload) return null;
      return { id: data.id as string, payload };
    } catch {
      return null;
    }
  };
}
