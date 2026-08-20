import { describe, expect, it } from 'vitest';

import {
  ImageValidationError,
  MAX_IMAGE_FILE_SIZE,
  MAX_IMAGE_HEIGHT,
  MAX_IMAGE_WIDTH,
  calculateTargetDimensions,
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

describe('target image dimensions', () => {
  it('keeps a small image at its original size', () => {
    expect(calculateTargetDimensions({ width: 800, height: 600 })).toEqual({
      width: 800,
      height: 600,
    });
  });

  it('scales a wide image down to the maximum width', () => {
    expect(calculateTargetDimensions({ width: 4000, height: 2000 })).toEqual({
      width: MAX_IMAGE_WIDTH,
      height: 540,
    });
  });

  it('scales a tall image down to the maximum height', () => {
    expect(calculateTargetDimensions({ width: 2000, height: 4000 })).toEqual({
      width: 960,
      height: MAX_IMAGE_HEIGHT,
    });
  });

  it('uses the stricter constraint when both dimensions are too large', () => {
    expect(calculateTargetDimensions({ width: 3000, height: 6000 })).toEqual({
      width: 960,
      height: MAX_IMAGE_HEIGHT,
    });
  });

  it('supports custom maximum dimensions', () => {
    expect(calculateTargetDimensions({ width: 1600, height: 1200 }, { width: 800, height: 800 })).toEqual({
      width: 800,
      height: 600,
    });
  });

  it.each([
    { width: 0, height: 100 },
    { width: 100, height: 0 },
    { width: -1, height: 100 },
  ])('rejects invalid source dimensions: $width x $height', (source) => {
    expect(() => calculateTargetDimensions(source)).toThrow(RangeError);
  });
});
