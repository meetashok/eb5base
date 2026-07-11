import { notFound, redirect } from 'next/navigation';
import ProjectDetail from '@/components/ProjectDetail';
import { createClient } from '@/lib/supabase-server';
import { canEditProject, loadNestedProject, loadProjectByParam } from '@/lib/project-loader';
import {
  canManageProjectImagesServer,
  loadProjectImages,
} from '@/lib/project-images-server';
import { projectPath } from '@/lib/slugs';
import type { ProjectContact } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Props = { params: { slug: string; projectSlug: string } };

async function redirectToMergedTarget(mergedInto: string) {
  const target = await loadProjectByParam(mergedInto);
  redirect(target ? projectPath(target) : `/projects/${mergedInto}`);
}

export async function generateMetadata({ params }: Props) {
  const resolved = await loadNestedProject(params.slug, params.projectSlug);
  return { title: resolved?.project.name || 'Project' };
}

export default async function NestedProjectPage({ params }: Props) {
  const resolved = await loadNestedProject(params.slug, params.projectSlug);
  if (!resolved) notFound();

  const { brand, project } = resolved;
  if (project.merged_into) {
    await redirectToMergedTarget(project.merged_into);
  }

  // Canonicalize UUID / mismatched params to readable nested URL
  if (
    brand.slug &&
    project.slug &&
    (params.slug !== brand.slug || params.projectSlug !== project.slug)
  ) {
    redirect(projectPath(project));
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
  const [canEdit, images, canManageImages] = await Promise.all([
    canEditProject(project, userId),
    loadProjectImages(project.id),
    canManageProjectImagesServer(project, userId),
  ]);

  return (
    <ProjectDetail
      project={project}
      contacts={(contacts as ProjectContact[]) || []}
      images={images}
      userId={userId}
      canEdit={canEdit}
      canManageImages={canManageImages}
    />
  );
}
