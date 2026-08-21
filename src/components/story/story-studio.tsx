'use client';

import { useEffect, useMemo } from 'react';
import { useStore } from 'zustand';

import { AddStoryButton } from '@/components/story/add-story-button';
import { StoryRail } from '@/components/story/story-rail';
import { storyStore, type StoryStoreApi } from '@/store/story-store';
import { STORY_STORAGE_KEY, type StoryPreview } from '@/types/story';

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
  const removeExpired = useStore(store, (state) => state.removeExpired);

  const storyPreviews = useMemo<StoryPreview[]>(
    () =>
      stories.map((story, index) => ({
        id: story.id,
        imageSrc: story.imageDataUrl,
        label: ` NO. ${index + 1} `,
        width: story.width,
        height: story.height,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
      })),
    [stories],
  );

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    function handleFocus() {
      removeExpired();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        removeExpired();
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === STORY_STORAGE_KEY || event.key === null) {
        refresh();
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
    const timer = window.setTimeout(() => removeExpired(), delay);

    return () => window.clearTimeout(timer);
  }, [removeExpired, status, stories]);

  const isLoading = status === 'idle' || status === 'loading';

  return (
    <main className="min-h-screen bg-page text-text">
      <div className="flex min-h-screen w-full flex-col">
        <header className="w-full border-b border-border">
          <div className="flex items-center justify-between gap-4 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <p className="min-w-0 text-sm font-semibold tracking-[-0.02em]">Story Feature</p>

            <span className="shrink-0 rounded-full border border-border bg-panel px-3 py-1 text-xs font-medium text-text-muted">
              Local only
            </span>
          </div>
        </header>

        <div className="flex-1 px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <section className="mx-auto w-full max-w-3xl text-center">
            <h1 className="[overflow-wrap:anywhere] text-4xl leading-tight font-semibold sm:text-5xl">24H Story</h1>

            <p className="mt-5 text-center text-base leading-7 text-text-muted sm:text-lg sm:leading-8">
              24 小时后过期。
            </p>

            <p className="mt-5 font-mono text-xs text-text-subtle">Local · ≤10 MB · 1080×1920 · 24h</p>

            <div className="mt-12">
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
                  action={
                    <AddStoryButton
                      onImageReady={(image) => {
                        addStory(image);
                      }}
                    />
                  }
                />
              )}

              {errorMessage ? (
                <p role="alert" className="mt-4 text-sm text-destructive">
                  {errorMessage}
                </p>
              ) : null}
            </div>
          </section>
        </div>

        <footer className="w-full border-t border-border">
          <div className="px-4 py-5 text-xs leading-5 text-text-muted sm:px-6 lg:px-8">
            Next.js · React · TypeScript · Tailwind CSS
          </div>
        </footer>
      </div>
    </main>
  );
}
