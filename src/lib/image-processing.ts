import type { StoryMimeType } from '@/types/story';

export const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024;

export const SUPPORTED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const satisfies readonly StoryMimeType[];

export type ImageValidationErrorCode = 'unsupported-type' | 'file-too-large';

export class ImageValidationError extends Error {
  constructor(
    public readonly code: ImageValidationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ImageValidationError';
  }
}

export function isSupportedImageMimeType(mimeType: string): mimeType is StoryMimeType {
  return SUPPORTED_IMAGE_MIME_TYPES.some((supportedType) => supportedType === mimeType);
}

export function validateImageFile(file: File): StoryMimeType {
  if (!isSupportedImageMimeType(file.type)) {
    throw new ImageValidationError('unsupported-type', '只支持 JPEG、PNG 或 WebP 图片。');
  }

  if (file.size > MAX_IMAGE_FILE_SIZE) {
    throw new ImageValidationError('file-too-large', '图片不能超过 10 MB。');
  }

  return file.type;
}
