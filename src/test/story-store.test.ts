import { describe, expect, it, vi } from 'vitest';

import type { ProcessedImage } from '@/lib/image-processing';
import type { StoryRepository } from '@/services/story-repository';
import { createStoryStore, MAX_STORY_COUNT } from '@/store/story-store';
import { STORY_LIFETIME_MS, type Story } from '@/types/story';

const processedImage: ProcessedImage = {
  dataUrl: 'data:image/webp;base64,encoded',
  mimeType: 'image/webp',
  width: 800,
  height: 600,
  originalBlob: new Blob(['original'], { type: 'image/webp' }),
  originalWidth: 1600,
  originalHeight: 1200,
};

function createStoredStory(id: string, createdAt = 1_000): Story {
  return {
    id,
    imageDataUrl: processedImage.dataUrl,
    mimeType: processedImage.mimeType,
    width: processedImage.width,
    height: processedImage.height,
    originalWidth: processedImage.originalWidth,
    originalHeight: processedImage.originalHeight,
    createdAt,
    expiresAt: createdAt + STORY_LIFETIME_MS,
  };
}

function createRepository(stories: Story[] = []): StoryRepository {
  return {
    loadStories: vi.fn().mockResolvedValue(stories),
    saveStory: vi.fn().mockResolvedValue(undefined),
    saveStories: vi.fn().mockResolvedValue(undefined),
    loadOriginalImage: vi.fn().mockResolvedValue(processedImage.originalBlob),
    deleteStory: vi.fn().mockResolvedValue(undefined),
    clearStories: vi.fn().mockResolvedValue(undefined),
  };
}

describe('story store', () => {
  it('hydrates stories from the repository', async () => {
    const storedStory = createStoredStory('stored');
    const repository = createRepository([storedStory]);
    const store = createStoryStore(repository);

    await store.getState().hydrate();

    expect(store.getState()).toMatchObject({ stories: [storedStory], status: 'ready', errorMessage: null });
  });

  it('enters an error state when hydration fails', async () => {
    const repository = createRepository();
    vi.mocked(repository.loadStories).mockRejectedValue(new Error('无法读取浏览器中的 Story。'));
    const store = createStoryStore(repository);

    await store.getState().hydrate();

    expect(store.getState()).toMatchObject({
      stories: [],
      status: 'error',
      errorMessage: '无法读取浏览器中的 Story。',
    });
  });

  it('creates and persists a processed image with its original blob', async () => {
    const repository = createRepository();
    const store = createStoryStore(repository);

    const story = await store.getState().addStory(processedImage);

    expect(story).toMatchObject({
      imageDataUrl: processedImage.dataUrl,
      mimeType: processedImage.mimeType,
      width: processedImage.width,
      height: processedImage.height,
      originalWidth: processedImage.originalWidth,
      originalHeight: processedImage.originalHeight,
    });
    expect(repository.saveStory).toHaveBeenCalledWith(story, processedImage.originalBlob);
    expect(store.getState().stories).toEqual([story]);
  });

  it('removes expired in-memory stories before adding a new story', async () => {
    const expired = createStoredStory('expired', Date.now() - STORY_LIFETIME_MS - 1);
    const repository = createRepository([expired]);
    const store = createStoryStore(repository);
    await store.getState().hydrate();

    const newStory = await store.getState().addStory(processedImage);

    expect(newStory.id).not.toBe('expired');
    expect(store.getState().stories).toEqual([newStory]);
    expect(repository.saveStories).toHaveBeenCalledWith([newStory]);
  });

  it('preserves the current collection when persistence fails', async () => {
    const storedStory = createStoredStory('stored');
    const repository = createRepository([storedStory]);
    vi.mocked(repository.saveStory).mockRejectedValue(new Error('存储空间不足'));
    const store = createStoryStore(repository);
    await store.getState().hydrate();

    await expect(store.getState().addStory(processedImage)).rejects.toThrow('存储空间不足');
    expect(store.getState().stories).toEqual([storedStory]);
    expect(store.getState().errorMessage).toBe('存储空间不足');
  });

  it('enforces the soft story count limit before writing', async () => {
    const now = Date.now();
    const stories = Array.from({ length: MAX_STORY_COUNT }, (_, index) =>
      createStoredStory(`story-${index}`, now - index),
    );
    const repository = createRepository(stories);
    const store = createStoryStore(repository);
    await store.getState().hydrate();

    await expect(store.getState().addStory(processedImage)).rejects.toThrow(`最多保存 ${MAX_STORY_COUNT} 条 Story`);
    expect(repository.saveStory).not.toHaveBeenCalled();
  });

  it('removes expired stories from state and storage', async () => {
    const expired = createStoredStory('expired', 0);
    const valid = createStoredStory('valid', STORY_LIFETIME_MS);
    const repository = createRepository([expired, valid]);
    const store = createStoryStore(repository);
    await store.getState().hydrate();

    await store.getState().removeExpired(STORY_LIFETIME_MS + 1);

    expect(store.getState().stories).toEqual([valid]);
    expect(repository.saveStories).toHaveBeenCalledWith([valid]);
  });

  it('deletes and clears stories through the repository', async () => {
    const first = createStoredStory('first');
    const second = createStoredStory('second', 2_000);
    const repository = createRepository([first, second]);
    const store = createStoryStore(repository);
    await store.getState().hydrate();

    await store.getState().deleteStory(first.id);
    expect(repository.deleteStory).toHaveBeenCalledWith(first.id);
    expect(store.getState().stories).toEqual([second]);

    await store.getState().clearStories();
    expect(repository.clearStories).toHaveBeenCalledOnce();
    expect(store.getState().stories).toEqual([]);
  });
});
