'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { StoryPreview } from '@/types/story';

type StoryViewerProps = {
  story?: StoryPreview;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onOpenChange: (open: boolean) => void;
};

export function StoryViewer({ story, canGoPrevious, canGoNext, onPrevious, onNext, onOpenChange }: StoryViewerProps) {
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
      {story ? (
        <DialogContent className="max-w-md border-border bg-viewer-bg p-3 text-viewer-text sm:p-4">
          <DialogTitle className="sr-only">{story.label} Story</DialogTitle>

          <DialogDescription className="sr-only">查看 {story.label} Story 图片</DialogDescription>

          <div className="relative mx-auto aspect-[9/16] max-h-[78vh] w-full overflow-hidden rounded-panel bg-viewer-bg">
            <Image
              src={story.imageSrc}
              alt={`${story.label} Story`}
              fill
              sizes="(max-width: 640px) calc(100vw - 2rem), 28rem"
              className="object-contain"
            />

            <button
              type="button"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              aria-label="上一条 Story"
              title="上一条 Story"
              className="absolute left-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-viewer-panel/80 text-viewer-text transition-colors hover:bg-viewer-panel disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={!canGoNext}
              aria-label="下一条 Story"
              title="下一条 Story"
              className="absolute right-3 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-viewer-panel/80 text-viewer-text transition-colors hover:bg-viewer-panel disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
