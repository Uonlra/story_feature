import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ImageValidationError,
  MAX_IMAGE_FILE_SIZE,
  MAX_IMAGE_HEIGHT,
  MAX_IMAGE_WIDTH,
  calculateTargetDimensions,
  decodeImageFile,
  exportImageToDataUrl,
  isSupportedImageMimeType,
  validateImageFile,
} from '@/lib/image-processing';

function createImageFile(type: string, size: number): File {
  return new File([new Uint8Array(size)], 'story-image', { type });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

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

describe('image decoding', () => {
  it('uses createImageBitmap and releases the bitmap on dispose', async () => {
    const close = vi.fn();
    const bitmap = { width: 640, height: 480, close } as ImageBitmap;
    const createImageBitmap = vi.fn().mockResolvedValue(bitmap);
    vi.stubGlobal('createImageBitmap', createImageBitmap);

    const decoded = await decodeImageFile(createImageFile('image/png', 1_024));

    expect(createImageBitmap).toHaveBeenCalledTimes(1);
    expect(decoded.source).toBe(bitmap);
    expect(decoded.width).toBe(640);
    expect(decoded.height).toBe(480);

    decoded.dispose();

    expect(close).toHaveBeenCalledOnce();
  });

  it('converts bitmap decoding failures into a decode-failed error', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('bad image')));

    await expect(decodeImageFile(createImageFile('image/jpeg', 1_024))).rejects.toMatchObject({
      name: 'ImageValidationError',
      code: 'decode-failed',
    });
  });

  it('falls back to an Image element and revokes its object URL', async () => {
    const objectUrl = 'blob:story-image';
    const revokeObjectURL = vi.fn();
    const OriginalImage = globalThis.Image;

    class MockImage {
      decoding = '';
      naturalWidth = 320;
      naturalHeight = 240;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(value: string) {
        if (value === objectUrl) {
          this.onload?.();
        }
      }

      get src() {
        return objectUrl;
      }
    }

    Reflect.deleteProperty(globalThis, 'createImageBitmap');
    vi.stubGlobal('Image', MockImage);
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn().mockReturnValue(objectUrl),
      revokeObjectURL,
    });

    const decoded = await decodeImageFile(createImageFile('image/webp', 1_024));

    expect(decoded.width).toBe(320);
    expect(decoded.height).toBe(240);
    expect(revokeObjectURL).toHaveBeenCalledWith(objectUrl);
    decoded.dispose();

    vi.stubGlobal('Image', OriginalImage);
  });
});

describe('canvas image export', () => {
  it('draws the decoded image at the target size and returns a data URL', () => {
    const drawImage = vi.fn();
    const toDataURL = vi.fn().mockReturnValue('data:image/webp;base64,encoded');
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue({ drawImage }),
      toDataURL,
    } as unknown as HTMLCanvasElement;
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue(canvas);
    const source = {} as CanvasImageSource;

    const result = exportImageToDataUrl(
      { source, width: 1600, height: 1200, dispose: vi.fn() },
      { width: 800, height: 600 },
    );

    expect(createElement).toHaveBeenCalledWith('canvas');
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
    expect(drawImage).toHaveBeenCalledWith(source, 0, 0, 800, 600);
    expect(toDataURL).toHaveBeenCalledWith('image/webp', 0.82);
    expect(result).toEqual({
      dataUrl: 'data:image/webp;base64,encoded',
      mimeType: 'image/webp',
      width: 800,
      height: 600,
    });
  });

  it('falls back to JPEG when WebP export is unsupported', () => {
    const toDataURL = vi
      .fn()
      .mockReturnValueOnce('data:image/png;base64,png-fallback')
      .mockReturnValueOnce('data:image/jpeg;base64,jpeg-fallback');
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue({ drawImage: vi.fn() }),
      toDataURL,
    } as unknown as HTMLCanvasElement;
    vi.spyOn(document, 'createElement').mockReturnValue(canvas);

    const result = exportImageToDataUrl(
      { source: {} as CanvasImageSource, width: 100, height: 100, dispose: vi.fn() },
      { width: 100, height: 100 },
    );

    expect(toDataURL).toHaveBeenNthCalledWith(2, 'image/jpeg', 0.82);
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.dataUrl).toBe('data:image/jpeg;base64,jpeg-fallback');
  });

  it('rejects invalid export dimensions', () => {
    expect(() =>
      exportImageToDataUrl(
        { source: {} as CanvasImageSource, width: 100, height: 100, dispose: vi.fn() },
        { width: 0, height: 100 },
      ),
    ).toThrow(RangeError);
  });
});

describe('complete image processing', () => {
  it('disposes the decoded source after exporting', async () => {
    const dispose = vi.fn();
    const createImageBitmap = vi.fn().mockResolvedValue({ width: 1600, height: 1200, close: dispose });
    vi.stubGlobal('createImageBitmap', createImageBitmap);

    const drawImage = vi.fn();
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue({ drawImage }),
      toDataURL: vi.fn().mockReturnValue('data:image/webp;base64,encoded'),
    } as unknown as HTMLCanvasElement;
    vi.spyOn(document, 'createElement').mockReturnValue(canvas);

    const { processImageFile } = await import('@/lib/image-processing');
    const result = await processImageFile(createImageFile('image/png', 1_024));

    expect(result.dataUrl).toContain('data:image/webp');
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1080, 810);
    expect(dispose).toHaveBeenCalledOnce();
  });
});
