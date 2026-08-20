'use client';

import { useRef, useState } from 'react';

import { processImageFile, type EncodedImage } from '@/lib/image-processing';

type AddStoryButtonProps = {
  onImageReady: (image: EncodedImage) => void | Promise<void>;
  processFile?: (file: File) => Promise<EncodedImage>;
};

export function AddStoryButton({ onImageReady, processFile = processImageFile }: AddStoryButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function openFilePicker() {
    if (!isProcessing) {
      inputRef.current?.click();
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const image = await processFile(file);
      await onImageReady(image);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '图片处理失败，请重试。');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="sr-only"
        aria-label="选择 Story 图片"
      />

      <button
        type="button"
        onClick={openFilePicker}
        disabled={isProcessing}
        aria-label={isProcessing ? '正在处理 Story 图片' : '添加 Story'}
        title={isProcessing ? '正在处理 Story 图片' : '添加 Story'}
        className="story-action-button inline-flex size-11 items-center justify-center rounded-full border border-brand/30 bg-brand-soft text-xl leading-none font-medium text-brand transition-[background-color,border-color,color,transform] duration-200 ease-out hover:border-brand hover:bg-brand hover:text-on-brand active:bg-brand-active disabled:cursor-not-allowed disabled:border-border disabled:bg-disabled-surface disabled:text-disabled-ink"
      >
        <span aria-hidden="true" className={isProcessing ? 'animate-spin' : undefined}>
          +
        </span>
      </button>

      {errorMessage ? (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
