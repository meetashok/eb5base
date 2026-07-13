import { notFound, redirect } from 'next/navigation';
import ProjectDetail from '@/components/ProjectDetail';
import { createClient } from '@/lib/supabase-server';
import { canEditProject, canViewProject, loadProjectByParam } from '@/lib/project-loader';
import {
  loadProjectImages,
} from '@/lib/project-images-server';
import { projectPath } from '@/lib/slugs';
import type { ProjectContact } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function redirectToMergedTarget(mergedInto: string) {
  const target = await loadProjectByParam(mergedInto);
  redirect(target ? projectPath(target) : `/projects/${mergedInto}`);
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const project = await loadProjectByParam(params.id);
  return { title: project?.name || 'Project' };
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = await loadProjectByParam(params.id);
  if (!project) notFound();

  if (project.merged_into) await redirectToMergedTarget(project.merged_into);

  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;

  if (!(await canViewProject(project, userId))) notFound();

  // Prefer nested readable URL when brand + project slugs exist
  const nested = projectPath(project);
  if (nested.startsWith('/rc/') && nested !== `/projects/${params.id}`) {
    redirect(nested);
  }

  // Canonicalize /projects/{uuid} → /projects/{slug} when only project slug exists
  if (project.slug && params.id !== project.slug && !nested.startsWith('/rc/')) {
    redirect(`/projects/${project.slug}`);
  }

  const [{ data: contacts }, canEdit, images] = await Promise.all([
    supabase
      .from('project_contacts')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: true }),
    canEditProject(project, userId),
    loadProjectImages(project.id),
  ]);

  return (
    <ProjectDetail
      project={project}
      contacts={(contacts as ProjectContact[]) || []}
      images={images}
      userId={userId}
      canEdit={canEdit}
    />
  );
}
