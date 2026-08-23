import type { StoryMimeType } from '@/types/story';

export const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024;

export const MAX_IMAGE_WIDTH = 1080;

export const MAX_IMAGE_HEIGHT = 1920;

export type ImageDimensions = {
  width: number;
  height: number;
};

export type DecodedImage = ImageDimensions & {
  source: CanvasImageSource;
  dispose: () => void;
};

export type EncodedImage = ImageDimensions & {
  dataUrl: string;
  mimeType: StoryMimeType;
};

export type ProcessedImage = EncodedImage & {
  originalBlob: Blob;
  originalWidth: number;
  originalHeight: number;
};

export const SUPPORTED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const satisfies readonly StoryMimeType[];

export type ImageValidationErrorCode = 'unsupported-type' | 'file-too-large' | 'decode-failed' | 'canvas-failed';

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

export function calculateTargetDimensions(
  source: ImageDimensions,
  maximum: ImageDimensions = {
    width: MAX_IMAGE_WIDTH,
    height: MAX_IMAGE_HEIGHT,
  },
): ImageDimensions {
  if (source.width <= 0 || source.height <= 0 || maximum.width <= 0 || maximum.height <= 0) {
    throw new RangeError('图片尺寸必须大于 0。');
  }

  const scale = Math.min(maximum.width / source.width, maximum.height / source.height, 1);

  return {
    width: Math.max(1, Math.round(source.width * scale)),
    height: Math.max(1, Math.round(source.height * scale)),
  };
}

export async function decodeImageFile(file: File): Promise<DecodedImage> {
  validateImageFile(file);

  if ('createImageBitmap' in globalThis) {
    try {
      const bitmap = await createImageBitmap(file);

      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        dispose: () => {
          bitmap.close();
        },
      };
    } catch {
      throw new ImageValidationError('decode-failed', '图片无法读取或文件已经损坏。');
    }
  }

  return decodeImageWithElement(file);
}

async function decodeImageWithElement(file: File): Promise<DecodedImage> {
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();

  image.decoding = 'async';

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject();
      image.src = objectUrl;
    });

    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      dispose: () => {
        image.src = '';
      },
    };
  } catch {
    throw new ImageValidationError('decode-failed', '图片无法读取或文件已经损坏。');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function exportImageToDataUrl(
  decoded: DecodedImage,
  target: ImageDimensions,
  mimeType: StoryMimeType = 'image/webp',
  quality = 0.82,
): EncodedImage {
  if (target.width <= 0 || target.height <= 0) {
    throw new RangeError('导出尺寸必须大于 0。');
  }

  const canvas = document.createElement('canvas');
  canvas.width = target.width;
  canvas.height = target.height;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new ImageValidationError('canvas-failed', '浏览器无法创建图片处理画布。');
  }

  context.drawImage(decoded.source, 0, 0, target.width, target.height);

  try {
    const requestedDataUrl = canvas.toDataURL(mimeType, quality);
    const actualMimeType = requestedDataUrl.startsWith(`data:${mimeType};`) ? mimeType : 'image/jpeg';
    const dataUrl = actualMimeType === mimeType ? requestedDataUrl : canvas.toDataURL('image/jpeg', quality);

    return {
      dataUrl,
      mimeType: actualMimeType,
      width: target.width,
      height: target.height,
    };
  } catch {
    throw new ImageValidationError('canvas-failed', '图片导出失败，请重试。');
  }
}

export async function processImageFile(file: File): Promise<ProcessedImage> {
  const decoded = await decodeImageFile(file);

  try {
    const target = calculateTargetDimensions(decoded);
    return {
      ...exportImageToDataUrl(decoded, target),
      originalBlob: file.slice(0, file.size, file.type),
      originalWidth: decoded.width,
      originalHeight: decoded.height,
    };
  } finally {
    decoded.dispose();
  }
}
