'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ProjectImage } from '@/lib/types';
import {
  deleteProjectImage,
  fetchProjectImages,
  MAX_PROJECT_IMAGES,
  uploadProjectImage,
} from '@/lib/project-images';

interface ProjectImageManagerProps {
  projectId: string;
  canManage: boolean;
  onChange?: (images: ProjectImage[]) => void;
}

export default function ProjectImageManager({
  projectId,
  canManage,
  onChange,
}: ProjectImageManagerProps) {
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchProjectImages(projectId);
    setImages(rows);
    onChange?.(rows);
    setLoading(false);
  }, [projectId, onChange]);

  useEffect(() => {
    load();
  }, [load]);

  if (!canManage) return null;

  async function handleUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    const { image, error: uploadError } = await uploadProjectImage(projectId, file);
    setUploading(false);
    if (uploadError) {
      setError(uploadError);
      return;
    }
    if (image) {
      const next = [...images, image].sort((a, b) => a.sort_order - b.sort_order);
      setImages(next);
      onChange?.(next);
    }
  }

  async function handleDelete(image: ProjectImage) {
    if (!confirm('Remove this image?')) return;
    setError(null);
    const msg = await deleteProjectImage(image);
    if (msg) {
      setError(msg);
      return;
    }
    const next = images.filter((i) => i.id !== image.id);
    setImages(next);
    onChange?.(next);
  }

  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-medium">Project photos</span>
        <span className="label-text-alt text-neutral/50">
          {images.length}/{MAX_PROJECT_IMAGES}
        </span>
      </label>
      <p className="text-xs text-neutral/50 mb-2">
        JPEG, PNG, or WebP. Images are resized to about 400 KB before upload.
      </p>

      {loading ? (
        <div className="skeleton-shimmer h-20 w-full rounded-lg" />
      ) : (
        <>
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {images.map((img) => (
                <div key={img.id} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt=""
                    className="w-20 h-20 object-cover rounded-lg border border-base-300"
                  />
                  <button
                    type="button"
                    className="absolute -top-1 -right-1 btn btn-circle btn-error btn-xs opacity-90"
                    aria-label="Remove image"
                    onClick={() => handleDelete(img)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length < MAX_PROJECT_IMAGES && (
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="file-input file-input-bordered file-input-sm w-full max-w-md"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                void handleUpload(file);
                e.target.value = '';
              }}
            />
          )}
        </>
      )}

      {uploading && (
        <p className="text-xs text-neutral/50 mt-2 flex items-center gap-2">
          <span className="loading loading-spinner loading-xs" />
          Compressing and uploading…
        </p>
      )}
      {error && <p className="text-xs text-error mt-2">{error}</p>}
    </div>
  );
}
