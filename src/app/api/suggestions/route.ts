import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const q = searchParams.get('q') || '';

  if (type === 'rc') {
    const { data, error } = await supabase.rpc('list_rc_name_suggestions', { p_query: q });
    if (error) return NextResponse.json({ suggestions: [] });
    return NextResponse.json({ suggestions: data || [] });
  }

  const { data, error } = await supabase.rpc('list_project_name_suggestions', { p_query: q });
  if (error) return NextResponse.json({ suggestions: [] });
  return NextResponse.json({ suggestions: data || [] });
}
