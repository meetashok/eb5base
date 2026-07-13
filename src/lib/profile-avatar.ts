import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';

/** Google OAuth typically stores the photo as `picture`; some providers use `avatar_url`. */
export function avatarFromAuthUser(user: User | null | undefined): string | null {
  if (!user?.user_metadata) return null;
  const meta = user.user_metadata as Record<string, unknown>;
  const avatarUrl = meta.avatar_url;
  const picture = meta.picture;
  if (typeof avatarUrl === 'string' && avatarUrl.trim()) return avatarUrl;
  if (typeof picture === 'string' && picture.trim()) return picture;
  return null;
}

export function resolveProfileAvatar(
  profile: Pick<Profile, 'avatar_url'> | null | undefined,
  user: User | null | undefined
): string | null {
  return profile?.avatar_url || avatarFromAuthUser(user);
}
