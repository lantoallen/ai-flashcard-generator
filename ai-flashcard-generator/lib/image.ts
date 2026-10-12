/** Resize and centre-crop a picture to a small square JPEG data URL. */

const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const MAX_OUTPUT_CHARS = 40_000; // the database allows 60k; stay well under it

export class ImageError extends Error {}

function load(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageError('That file couldn’t be read as a picture.'));
    };
    img.src = url;
  });
}

export async function resizeToAvatar(file: File, size = 160): Promise<string> {
  if (!file.type.startsWith('image/')) throw new ImageError('Please choose an image file.');
  if (file.size > MAX_INPUT_BYTES) throw new ImageError('That picture is too large (max 8 MB).');

  const img = await load(file);
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  if (!side) throw new ImageError('That picture is empty.');

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageError('Your browser can’t resize pictures.');

  // Step down in quality, then size, until it fits comfortably.
  for (const [px, quality] of [[size, 0.85], [size, 0.7], [128, 0.7], [96, 0.6]] as const) {
    canvas.width = px;
    canvas.height = px;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, px, px);
    ctx.drawImage(
      img,
      (img.naturalWidth - side) / 2,
      (img.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      px,
      px
    );
    const url = canvas.toDataURL('image/jpeg', quality);
    if (url.length <= MAX_OUTPUT_CHARS) return url;
  }
  throw new ImageError('Could not make that picture small enough. Try a different one.');
}
