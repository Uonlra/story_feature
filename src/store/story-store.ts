import { createStore, type StoreApi } from 'zustand/vanilla';

import type { EncodedImage } from '@/lib/image-processing';
import { createStory, removeExpiredStories, sortStoriesByCreatedAt } from '@/lib/story-utils';
import { storyRepository, type StoryRepository } from '@/services/story-repository';
import type { Story } from '@/types/story';

export const MAX_STORY_COUNT = 20;

export type StoryStoreStatus = 'idle' | 'loading' | 'ready' | 'error';

export type StoryStoreState = {
  stories: Story[];
  status: StoryStoreStatus;
  errorMessage: string | null;
  hydrate: () => void;
  refresh: () => void;
  addStory: (image: EncodedImage) => Story;
  deleteStory: (storyId: string) => void;
  clearStories: () => void;
  clearError: () => void;
  removeExpired: (now?: number) => void;
};

export type StoryStoreApi = StoreApi<StoryStoreState>;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Story 操作失败，请重试。';
}

export function createStoryStore(repository: StoryRepository = storyRepository): StoryStoreApi {
  return createStore<StoryStoreState>()((set, get) => {
    function readStories(showLoading: boolean): void {
      if (showLoading) {
        set({ status: 'loading', errorMessage: null });
      }

      try {
        set({
          stories: repository.loadStories(),
          status: 'ready',
          errorMessage: null,
        });
      } catch (error) {
        set({
          stories: [],
          status: 'error',
          errorMessage: errorMessage(error),
        });
      }
    }

    return {
      stories: [],
      status: 'idle',
      errorMessage: null,
      hydrate: () => readStories(true),
      refresh: () => readStories(false),
      addStory: (image) => {
        const currentStories = removeExpiredStories(get().stories);

        if (currentStories.length >= MAX_STORY_COUNT) {
          const error = new Error(`最多保存 ${MAX_STORY_COUNT} 条 Story，请删除部分内容后重试。`);
          set({ errorMessage: error.message });
          throw error;
        }

        const story = createStory({
          imageDataUrl: image.dataUrl,
          mimeType: image.mimeType,
          width: image.width,
          height: image.height,
        });
        const nextStories = sortStoriesByCreatedAt([...currentStories, story]);

        try {
          repository.saveStories(nextStories);
          set({ stories: nextStories, status: 'ready', errorMessage: null });
          return story;
        } catch (error) {
          set({ errorMessage: errorMessage(error) });
          throw error;
        }
      },
      deleteStory: (storyId) => {
        const nextStories = get().stories.filter((story) => story.id !== storyId);

        try {
          repository.saveStories(nextStories);
          set({ stories: nextStories, errorMessage: null });
        } catch (error) {
          set({ errorMessage: errorMessage(error) });
          throw error;
        }
      },
      clearStories: () => {
        try {
          repository.clearStories();
          set({ stories: [], status: 'ready', errorMessage: null });
        } catch (error) {
          set({ errorMessage: errorMessage(error) });
          throw error;
        }
      },
      clearError: () => set({ errorMessage: null }),
      removeExpired: (now = Date.now()) => {
        const currentStories = get().stories;
        const validStories = removeExpiredStories(currentStories, now);

        if (validStories.length === currentStories.length) {
          return;
        }

        try {
          repository.saveStories(validStories);
          set({ stories: validStories, errorMessage: null });
        } catch (error) {
          set({
            stories: validStories,
            errorMessage: errorMessage(error),
          });
        }
      },
    };
  });
}

export const storyStore = createStoryStore();
