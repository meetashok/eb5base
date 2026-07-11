/** Client-side image compression before Supabase upload (target ~300–400 KB). */

const MAX_BYTES = 400 * 1024;
const MAX_DIMENSION = 1600;
const MIN_QUALITY = 0.5;
const START_QUALITY = 0.85;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image'));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Could not compress image'));
      },
      'image/jpeg',
      quality
    );
  });
}

/** Resize and compress an image file for upload. Returns JPEG blob and suggested filename. */
export async function compressImageForUpload(
  file: File
): Promise<{ blob: Blob; filename: string }> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (JPEG, PNG, or WebP).');
  }

  const img = await loadImage(file);
  let { width, height } = img;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process image');
  ctx.drawImage(img, 0, 0, width, height);

  let quality = START_QUALITY;
  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > MAX_BYTES && quality > MIN_QUALITY) {
    quality -= 0.07;
    blob = await canvasToBlob(canvas, quality);
  }

  const base = file.name.replace(/\.[^.]+$/, '') || 'photo';
  const filename = `${base.slice(0, 40)}.jpg`;
  return { blob, filename };
}
