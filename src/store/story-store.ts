import { createStore, type StoreApi } from 'zustand/vanilla';

import type { ProcessedImage } from '@/lib/image-processing';
import { createStory, removeExpiredStories, sortStoriesByCreatedAt } from '@/lib/story-utils';
import { storyRepository, type StoryRepository } from '@/services/story-repository';
import type { Story } from '@/types/story';

export const MAX_STORY_COUNT = 20;

export type StoryStoreStatus = 'idle' | 'loading' | 'ready' | 'error';

export type StoryStoreState = {
  stories: Story[];
  status: StoryStoreStatus;
  errorMessage: string | null;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  addStory: (image: ProcessedImage) => Promise<Story>;
  loadOriginalImage: (storyId: string) => Promise<Blob | null>;
  deleteStory: (storyId: string) => Promise<void>;
  clearStories: () => Promise<void>;
  clearError: () => void;
  removeExpired: (now?: number) => Promise<void>;
};

export type StoryStoreApi = StoreApi<StoryStoreState>;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Story 操作失败，请重试。';
}

export function createStoryStore(repository: StoryRepository = storyRepository): StoryStoreApi {
  return createStore<StoryStoreState>()((set, get) => {
    async function readStories(showLoading: boolean): Promise<void> {
      if (showLoading) {
        set({ status: 'loading', errorMessage: null });
      }

      try {
        set({
          stories: await repository.loadStories(),
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
      addStory: async (image) => {
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
          originalWidth: image.originalWidth,
          originalHeight: image.originalHeight,
        });
        const nextStories = sortStoriesByCreatedAt([...currentStories, story]);

        try {
          await repository.saveStory(story, image.originalBlob);
          if (currentStories.length !== get().stories.length) {
            await repository.saveStories(nextStories);
          }
          set({ stories: nextStories, status: 'ready', errorMessage: null });
          return story;
        } catch (error) {
          set({ errorMessage: errorMessage(error) });
          throw error;
        }
      },
      loadOriginalImage: async (storyId) => {
        try {
          return await repository.loadOriginalImage(storyId);
        } catch (error) {
          set({ errorMessage: errorMessage(error) });
          return null;
        }
      },
      deleteStory: async (storyId) => {
        try {
          await repository.deleteStory(storyId);
          set({ stories: get().stories.filter((story) => story.id !== storyId), errorMessage: null });
        } catch (error) {
          set({ errorMessage: errorMessage(error) });
          throw error;
        }
      },
      clearStories: async () => {
        try {
          await repository.clearStories();
          set({ stories: [], status: 'ready', errorMessage: null });
        } catch (error) {
          set({ errorMessage: errorMessage(error) });
          throw error;
        }
      },
      clearError: () => set({ errorMessage: null }),
      removeExpired: async (now = Date.now()) => {
        const currentStories = get().stories;
        const validStories = removeExpiredStories(currentStories, now);

        if (validStories.length === currentStories.length) {
          return;
        }

        try {
          await repository.saveStories(validStories);
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
