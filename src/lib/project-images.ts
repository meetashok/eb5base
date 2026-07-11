import { createClient } from '@/lib/supabase';
import { compressImageForUpload } from '@/lib/image-compress';
import type { ProjectImage } from '@/lib/types';

const BUCKET = 'project-images';
const MAX_IMAGES = 10;

export async function fetchProjectImages(projectId: string): Promise<ProjectImage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('project_images')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('fetchProjectImages failed:', error.message);
    return [];
  }
  return (data as ProjectImage[]) || [];
}

export async function canManageProjectImages(
  projectId: string,
  brandId: string | null,
  rcId: string | null
): Promise<boolean> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle();
  if (profile?.is_admin) return true;

  const rcIds: string[] = [];
  if (rcId) rcIds.push(rcId);
  if (brandId) {
    const { data: entities } = await supabase
      .from('regional_centers')
      .select('id')
      .eq('brand_id', brandId);
    for (const e of entities || []) rcIds.push(e.id);
  }
  if (!rcIds.length) return false;

  const { data: membership } = await supabase
    .from('rc_memberships')
    .select('id')
    .eq('user_id', userId)
    .in('rc_id', rcIds)
    .eq('active', true)
    .not('verified_at', 'is', null)
    .is('revoked_at', null)
    .limit(1)
    .maybeSingle();

  return Boolean(membership);
}

export async function uploadProjectImage(
  projectId: string,
  file: File
): Promise<{ image: ProjectImage | null; error: string | null }> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { image: null, error: 'Sign in required' };

  const { count } = await supabase
    .from('project_images')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  if ((count || 0) >= MAX_IMAGES) {
    return { image: null, error: `Maximum ${MAX_IMAGES} images per project.` };
  }

  let blob: Blob;
  try {
    ({ blob } = await compressImageForUpload(file));
  } catch (err) {
    return {
      image: null,
      error: err instanceof Error ? err.message : 'Could not process image',
    };
  }

  const imageId = crypto.randomUUID();
  const storagePath = `${projectId}/${imageId}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (uploadError) {
    return { image: null, error: uploadError.message };
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const sortOrder = count || 0;

  const { data, error: insertError } = await supabase
    .from('project_images')
    .insert({
      id: imageId,
      project_id: projectId,
      storage_path: storagePath,
      url: urlData.publicUrl,
      sort_order: sortOrder,
      uploaded_by: auth.user.id,
    })
    .select('*')
    .single();

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { image: null, error: insertError.message };
  }

  return { image: data as ProjectImage, error: null };
}

export async function deleteProjectImage(image: ProjectImage): Promise<string | null> {
  const supabase = createClient();
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([image.storage_path]);
  if (storageError) return storageError.message;

  const { error } = await supabase.from('project_images').delete().eq('id', image.id);
  return error?.message || null;
}

export { MAX_IMAGES as MAX_PROJECT_IMAGES };
