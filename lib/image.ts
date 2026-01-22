export function bytesToBase64(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBytes(b64String: string): Uint8Array {
  const binary = atob(b64String);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  return mimeTypes[ext || ''] || 'image/png';
}

export function imageToDataUrl(base64Data: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64Data}`;
}

export function dataUrlToBase64(dataUrl: string): { data: string; mimeType: string } {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid data URL');
  }
  return {
    mimeType: matches[1],
    data: matches[2],
  };
}

export async function createThumbnail(
  imageData: string,
  mimeType: string,
  size: number = 150,
  quality: number = 0.7
): Promise<string> {
  // Create an image element
  const img = new Image();
  const dataUrl = imageToDataUrl(imageData, mimeType);

  return new Promise((resolve, reject) => {
    img.onload = () => {
      // Create canvas for thumbnail
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Calculate aspect ratio preserving dimensions
      let width = size;
      let height = size;

      if (img.width > img.height) {
        height = (img.height / img.width) * size;
      } else {
        width = (img.width / img.height) * size;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw scaled image
      ctx.drawImage(img, 0, 0, width, height);

      // Export as JPEG
      const thumbnailUrl = canvas.toDataURL('image/jpeg', quality);
      const { data } = dataUrlToBase64(thumbnailUrl);
      resolve(data);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function downloadImage(base64Data: string, mimeType: string, filename: string) {
  const dataUrl = imageToDataUrl(base64Data, mimeType);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function copyImageToClipboard(base64Data: string, mimeType: string) {
  const bytes = base64ToBytes(base64Data);
  const blob = new Blob([bytes as BlobPart], { type: mimeType });

  try {
    await navigator.clipboard.write([
      new ClipboardItem({ [mimeType]: blob }),
    ]);
    return true;
  } catch {
    // Fallback: Copy data URL to clipboard
    const dataUrl = imageToDataUrl(base64Data, mimeType);
    await navigator.clipboard.writeText(dataUrl);
    return true;
  }
}
