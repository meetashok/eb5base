import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tab = searchParams.get('tab') || 'overall';
  const quarter = searchParams.get('quarter');

  const { data: profile } = await supabase
    .from('profiles')
    .select('project_name')
    .eq('id', user.id)
    .maybeSingle();

  if (tab === 'project') {
    const projectName = profile?.project_name;
    if (!projectName) {
      return NextResponse.json({
        available: false,
        user_count: 0,
        min_users: 5,
        message: 'Add a project name in Settings to see project insights.',
      });
    }
    const { data, error } = await supabase.rpc('get_insights_by_project', {
      p_project_name: projectName,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (tab === 'cohort') {
    const { data, error } = await supabase.rpc('get_insights_by_cohort', {
      p_quarter: quarter || null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const { data, error } = await supabase.rpc('get_insights_overall');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
