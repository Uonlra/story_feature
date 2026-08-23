'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { StoryPreview } from '@/types/story';

type StoryViewerProps = {
  story?: StoryPreview;
  storyCount: number;
  storyIndex: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  loadOriginalImage: (storyId: string) => Promise<Blob | null>;
  onOpenChange: (open: boolean) => void;
};

export function StoryViewer({
  story,
  storyCount,
  storyIndex,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  loadOriginalImage,
  onOpenChange,
}: StoryViewerProps) {
  const objectUrlRef = useRef<string | null>(null);
  const [loadedImage, setLoadedImage] = useState<{ storyId: string; src: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (!story) {
      return () => {
        cancelled = true;
        setLoadedImage(null);
      };
    }

    void loadOriginalImage(story.id).then((blob) => {
      if (cancelled || !blob || typeof URL.createObjectURL !== 'function') {
        return;
      }

      const nextObjectUrl = URL.createObjectURL(blob);
      objectUrlRef.current = nextObjectUrl;
      setLoadedImage({ storyId: story.id, src: nextObjectUrl });
    });

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setLoadedImage(null);
    };
  }, [loadOriginalImage, story]);

  const imageSrc = story && loadedImage?.storyId === story.id ? loadedImage.src : story?.imageSrc;

  useEffect(() => {
    if (!story) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft' && canGoPrevious) {
        event.preventDefault();
        onPrevious();
      }

      if (event.key === 'ArrowRight' && canGoNext) {
        event.preventDefault();
        onNext();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canGoNext, canGoPrevious, onNext, onPrevious, story]);

  return (
    <Dialog open={story !== undefined} onOpenChange={onOpenChange}>
      {story && imageSrc ? (
        <DialogContent className="w-fit max-w-[calc(100vw-1rem)] border-border bg-viewer-bg p-2 text-viewer-text sm:p-3">
          <DialogTitle className="sr-only">{story.label} Story</DialogTitle>

          <DialogDescription className="sr-only">查看 {story.label} Story 图片</DialogDescription>

          <div className="relative flex max-h-[calc(100dvh-3rem)] max-w-[calc(100vw-1rem)] items-center justify-center overflow-hidden rounded-panel bg-viewer-bg">
            <Image
              src={imageSrc}
              alt={`${story.label} Story`}
              width={story.originalWidth ?? story.width}
              height={story.originalHeight ?? story.height}
              unoptimized
              sizes="(max-width: 640px) calc(100vw - 1rem), calc(100vw - 2rem)"
              className="h-auto max-h-[calc(100dvh-3rem)] w-auto max-w-[calc(100vw-1rem)] object-contain"
            />

            <button
              type="button"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              aria-label="上一条 Story"
              title="上一条 Story"
              className="absolute left-2 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-viewer-panel/80 text-viewer-text transition-colors hover:bg-viewer-panel disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={!canGoNext}
              aria-label="下一条 Story"
              title="下一条 Story"
              className="absolute right-2 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-viewer-panel/80 text-viewer-text transition-colors hover:bg-viewer-panel disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>

            <div
              aria-live="polite"
              className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-viewer-panel/85 px-3 py-1 font-mono text-xs text-viewer-text"
            >
              {storyIndex + 1} / {storyCount}
            </div>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
