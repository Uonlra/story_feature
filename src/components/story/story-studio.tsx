'use client';

import Link from 'next/link';
import { GitFork, Globe2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from 'zustand';

import { AddStoryButton } from '@/components/story/add-story-button';
import { StoryRail } from '@/components/story/story-rail';
import { storyStore, type StoryStoreApi } from '@/store/story-store';
import { STORY_STORAGE_KEY, type StoryPreview } from '@/types/story';
import { StoryViewer } from '@/components/story/story-viewer';

const MAX_TIMER_DELAY = 2_147_483_647;

type StoryStudioProps = {
  store?: StoryStoreApi;
};

export function StoryStudio({ store = storyStore }: StoryStudioProps) {
  const stories = useStore(store, (state) => state.stories);
  const status = useStore(store, (state) => state.status);
  const errorMessage = useStore(store, (state) => state.errorMessage);
  const hydrate = useStore(store, (state) => state.hydrate);
  const refresh = useStore(store, (state) => state.refresh);
  const addStory = useStore(store, (state) => state.addStory);
  const loadOriginalImage = useStore(store, (state) => state.loadOriginalImage);
  const removeExpired = useStore(store, (state) => state.removeExpired);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);

  const storyPreviews = useMemo<StoryPreview[]>(
    () =>
      stories.map((story, index) => ({
        id: story.id,
        imageSrc: story.imageDataUrl,
        label: ` NO. ${index + 1} `,
        width: story.width,
        height: story.height,
        originalWidth: story.originalWidth,
        originalHeight: story.originalHeight,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
      })),
    [stories],
  );
  const selectedStory = storyPreviews.find((story) => story.id === selectedStoryId);

  const selectedStoryIndex = storyPreviews.findIndex((story) => story.id === selectedStoryId);
  const canGoPrevious = selectedStoryIndex > 0;
  const canGoNext = selectedStoryIndex >= 0 && selectedStoryIndex < storyPreviews.length - 1;

  const showPreviousStory = useCallback(() => {
    if (canGoPrevious) {
      setSelectedStoryId(storyPreviews[selectedStoryIndex - 1].id);
    }
  }, [canGoPrevious, selectedStoryIndex, storyPreviews]);

  const showNextStory = useCallback(() => {
    if (canGoNext) {
      setSelectedStoryId(storyPreviews[selectedStoryIndex + 1].id);
    }
  }, [canGoNext, selectedStoryIndex, storyPreviews]);

  const handleViewerOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setSelectedStoryId(null);
    }
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    function handleFocus() {
      void removeExpired();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void removeExpired();
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === STORY_STORAGE_KEY || event.key === null) {
        void refresh();
      }
    }

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refresh, removeExpired]);

  useEffect(() => {
    if (status !== 'ready' || stories.length === 0) {
      return;
    }

    const nearestExpiry = Math.min(...stories.map((story) => story.expiresAt));
    const delay = Math.min(Math.max(nearestExpiry - Date.now() + 10, 0), MAX_TIMER_DELAY);
    const timer = window.setTimeout(() => void removeExpired(), delay);

    return () => window.clearTimeout(timer);
  }, [removeExpired, status, stories]);

  const isLoading = status === 'idle' || status === 'loading';

  return (
    <main className="min-h-screen bg-page text-text">
      <div className="flex min-h-screen w-full flex-col">
        <header className="w-full border-b border-border">
          <div className="flex items-center justify-between gap-4 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <p className="min-w-0 text-sm font-semibold tracking-[-0.02em]">Story Feature</p>

            <div className="flex shrink-0 items-center gap-3">
              <Link
                href="/about"
                className="text-sm font-medium text-text-muted transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                About
              </Link>

              <span className="rounded-full border border-border bg-panel px-3 py-1 text-xs font-medium text-text-muted">
                Local only
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <section className="mx-auto w-full max-w-3xl text-center">
            <div className="pb-10 sm:pb-12">
              <h1 className="[overflow-wrap:anywhere] text-4xl leading-tight font-semibold sm:text-5xl">24H Story</h1>

              <p className="mt-5 text-center text-base leading-7 text-text-muted sm:text-lg sm:leading-8">
                24H 后抹除上传记录
              </p>
            </div>

            <div className="border-y border-border py-8 sm:py-10">
              {isLoading ? (
                <div
                  role="status"
                  className="rounded-panel border border-dashed border-border px-5 py-10 text-sm text-text-muted"
                >
                  正在读取本地 Story…
                </div>
              ) : (
                <StoryRail
                  stories={storyPreviews}
                  onStorySelect={(story) => {
                    setSelectedStoryId(story.id);
                  }}
                  action={
                    <AddStoryButton
                      onImageReady={(image) => {
                        return addStory(image);
                      }}
                    />
                  }
                />
              )}

              {errorMessage ? (
                <p role="alert" className="mt-5 border-t border-destructive/30 pt-4 text-sm text-destructive">
                  {errorMessage}
                </p>
              ) : null}
            </div>
          </section>
        </div>

        <footer className="w-full border-t border-border">
          <div className="flex flex-col gap-4 px-4 py-5 text-xs leading-5 text-text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>Next.js · React · TypeScript · Tailwind CSS</p>

            <nav aria-label="外部链接" className="flex items-center gap-2 self-end">
              <a
                href="https://github.com/Uonlra"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                title="GitHub"
                className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-panel text-text-muted transition-[background-color,border-color,color,transform] duration-200 ease-out hover:border-brand/50 hover:bg-brand-soft hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-95"
              >
                <GitFork aria-hidden="true" className="size-4" />
              </a>

              <a
                href="https://www.uon1ra.top/"
                target="_blank"
                rel="noreferrer"
                aria-label="个人网站"
                title="个人网站"
                className="inline-flex size-11 items-center justify-center rounded-full border border-border bg-panel text-text-muted transition-[background-color,border-color,color,transform] duration-200 ease-out hover:border-brand/50 hover:bg-brand-soft hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-95"
              >
                <Globe2 aria-hidden="true" className="size-4" />
              </a>
            </nav>
          </div>
        </footer>
      </div>

      <StoryViewer
        story={selectedStory}
        storyCount={storyPreviews.length}
        storyIndex={selectedStoryIndex}
        canGoPrevious={canGoPrevious}
        canGoNext={canGoNext}
        onPrevious={showPreviousStory}
        onNext={showNextStory}
        loadOriginalImage={loadOriginalImage}
        onOpenChange={handleViewerOpenChange}
      />
    </main>
  );
}
