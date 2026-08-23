import type { ImageInput } from './types';

export interface ImageLimits { maxBytes: number; maxWidth: number; maxHeight: number; }
export const defaultImageLimits: ImageLimits = { maxBytes: 10 * 1024 * 1024, maxWidth: 8_192, maxHeight: 8_192 };
const supportedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

export function validateImageInput(image: ImageInput, limits: ImageLimits = defaultImageLimits): { valid: true } | { valid: false; message: string } {
  if (!supportedMimeTypes.has(image.mimeType || '')) return { valid: false, message: 'Unsupported image format. Use PNG, JPEG, or WEBP.' };
  if (!image.data || image.data.length > limits.maxBytes * 1.4) return { valid: false, message: 'Image exceeds the configured size limit.' };
  if (image.width !== undefined && (!Number.isInteger(image.width) || image.width < 1 || image.width > limits.maxWidth)) return { valid: false, message: 'Image width is outside the configured limit.' };
  if (image.height !== undefined && (!Number.isInteger(image.height) || image.height < 1 || image.height > limits.maxHeight)) return { valid: false, message: 'Image height is outside the configured limit.' };
  return { valid: true };
}

export class ImageProcessor {
  constructor(private readonly limits: ImageLimits = defaultImageLimits) {}
  validate(image: ImageInput) { return validateImageInput(image, this.limits); }
}
