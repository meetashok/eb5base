import { notFound, redirect } from 'next/navigation';
import ProjectDetail from '@/components/ProjectDetail';
import { createClient } from '@/lib/supabase-server';
import { canEditProject, loadProjectByParam } from '@/lib/project-loader';
import { projectPath } from '@/lib/slugs';
import type { ProjectContact } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const project = await loadProjectByParam(params.id);
  return { title: project?.name || 'Project' };
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = await loadProjectByParam(params.id);
  if (!project) notFound();

  if (project.merged_into) redirect(`/projects/${project.merged_into}`);

  // Prefer nested readable URL when brand + project slugs exist
  const nested = projectPath(project);
  if (nested.startsWith('/rc/') && nested !== `/projects/${params.id}`) {
    redirect(nested);
  }

  // Canonicalize /projects/{uuid} → /projects/{slug} when only project slug exists
  if (project.slug && params.id !== project.slug && !nested.startsWith('/rc/')) {
    redirect(`/projects/${project.slug}`);
  }

  const supabase = createClient();
  const [{ data: contacts }, { data: auth }] = await Promise.all([
    supabase
      .from('project_contacts')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: true }),
    supabase.auth.getUser(),
  ]);

  const userId = auth.user?.id ?? null;
  const canEdit = await canEditProject(project, userId);

  return (
    <ProjectDetail
      project={project}
      contacts={(contacts as ProjectContact[]) || []}
      userId={userId}
      canEdit={canEdit}
    />
  );
}
