import { describe, expect, it } from 'vitest';

import {
  ImageValidationError,
  MAX_IMAGE_FILE_SIZE,
  isSupportedImageMimeType,
  validateImageFile,
} from '@/lib/image-processing';

function createImageFile(type: string, size: number): File {
  return new File([new Uint8Array(size)], 'story-image', { type });
}

describe('image file validation', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp'])('accepts the supported MIME type %s', (mimeType) => {
    expect(isSupportedImageMimeType(mimeType)).toBe(true);
  });

  it('rejects unsupported file types', () => {
    const file = createImageFile('image/gif', 1_024);

    expect(() => validateImageFile(file)).toThrowError(
      expect.objectContaining<Pick<ImageValidationError, 'code'>>({
        code: 'unsupported-type',
      }),
    );
  });

  it('accepts a file at the exact size limit', () => {
    const file = createImageFile('image/jpeg', MAX_IMAGE_FILE_SIZE);

    expect(validateImageFile(file)).toBe('image/jpeg');
  });

  it('rejects a file larger than the size limit', () => {
    const file = createImageFile('image/jpeg', MAX_IMAGE_FILE_SIZE + 1);

    expect(() => validateImageFile(file)).toThrowError(
      expect.objectContaining<Pick<ImageValidationError, 'code'>>({
        code: 'file-too-large',
      }),
    );
  });
});
