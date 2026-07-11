'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ProjectImage } from '@/lib/types';
import ProjectImageManager from './ProjectImageManager';

interface ProjectGalleryProps {
  projectId: string;
  initialImages?: ProjectImage[];
  canManage?: boolean;
}

export default function ProjectGallery({
  projectId,
  initialImages = [],
  canManage = false,
}: ProjectGalleryProps) {
  const [images, setImages] = useState<ProjectImage[]>(initialImages);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i === null ? null : (i + 1) % images.length));
      if (e.key === 'ArrowLeft')
        setLightboxIndex((i) =>
          i === null ? null : (i - 1 + images.length) % images.length
        );
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, images.length, closeLightbox]);

  const hero = images[0];

  return (
    <section className="mb-6">
      {canManage && (
        <div className="mb-4">
          <ProjectImageManager
            projectId={projectId}
            canManage={canManage}
            onChange={setImages}
          />
        </div>
      )}

      {images.length === 0 ? null : (
        <>
          <div className="relative rounded-xl overflow-hidden bg-base-200 h-48 md:h-64">
            <button
              type="button"
              className="absolute inset-0 w-full h-full group"
              onClick={() => setLightboxIndex(0)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hero.url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-right"
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(to right, hsl(var(--b1)) 0%, hsl(var(--b1) / 0.85) 25%, transparent 55%)',
                }}
              />
              {images.length > 1 && (
                <span className="absolute bottom-3 right-3 badge badge-sm bg-base-100/90 text-neutral border-0">
                  {images.length} photos
                </span>
              )}
            </button>
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  className={`shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                    idx === 0 ? 'border-secondary' : 'border-transparent hover:border-base-300'
                  }`}
                  onClick={() => setLightboxIndex(idx)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="w-16 h-16 object-cover" />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery"
          onClick={closeLightbox}
        >
          <button
            type="button"
            className="absolute top-4 right-4 btn btn-circle btn-ghost text-white"
            aria-label="Close"
            onClick={closeLightbox}
          >
            ✕
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-2 md:left-6 btn btn-circle btn-ghost text-white text-xl"
                aria-label="Previous photo"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i === null ? 0 : (i - 1 + images.length) % images.length));
                }}
              >
                ‹
              </button>
              <button
                type="button"
                className="absolute right-2 md:right-6 btn btn-circle btn-ghost text-white text-xl"
                aria-label="Next photo"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) => (i === null ? 0 : (i + 1) % images.length));
                }}
              >
                ›
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[lightboxIndex].url}
            alt=""
            className="max-h-[85vh] max-w-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-4 text-white/70 text-sm">
            {lightboxIndex + 1} / {images.length}
          </p>
        </div>
      )}
    </section>
  );
}
