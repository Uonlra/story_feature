import { describe, expect, it, vi } from 'vitest';

import type { EncodedImage } from '@/lib/image-processing';
import type { StoryRepository } from '@/services/story-repository';
import { createStoryStore, MAX_STORY_COUNT } from '@/store/story-store';
import { STORY_LIFETIME_MS, type Story } from '@/types/story';

const encodedImage: EncodedImage = {
  dataUrl: 'data:image/webp;base64,encoded',
  mimeType: 'image/webp',
  width: 800,
  height: 600,
};

function createStoredStory(id: string, createdAt = 1_000): Story {
  return {
    id,
    imageDataUrl: encodedImage.dataUrl,
    mimeType: encodedImage.mimeType,
    width: encodedImage.width,
    height: encodedImage.height,
    createdAt,
    expiresAt: createdAt + STORY_LIFETIME_MS,
  };
}

function createRepository(stories: Story[] = []): StoryRepository {
  return {
    loadStories: vi.fn().mockReturnValue(stories),
    saveStories: vi.fn(),
    clearStories: vi.fn(),
  };
}

describe('story store', () => {
  it('hydrates stories from the repository', () => {
    const storedStory = createStoredStory('stored');
    const repository = createRepository([storedStory]);
    const store = createStoryStore(repository);

    store.getState().hydrate();

    expect(store.getState()).toMatchObject({
      stories: [storedStory],
      status: 'ready',
      errorMessage: null,
    });
  });

  it('enters an error state when hydration fails', () => {
    const repository = createRepository();

    vi.mocked(repository.loadStories).mockImplementation(() => {
      throw new Error('无法读取浏览器中的 Story。');
    });

    const store = createStoryStore(repository);

    store.getState().hydrate();

    expect(store.getState()).toMatchObject({
      stories: [],
      status: 'error',
      errorMessage: '无法读取浏览器中的 Story。',
    });
  });

  it('creates and persists a processed image', () => {
    const repository = createRepository();
    const store = createStoryStore(repository);

    const story = store.getState().addStory(encodedImage);

    expect(story).toMatchObject({
      imageDataUrl: encodedImage.dataUrl,
      mimeType: encodedImage.mimeType,
      width: encodedImage.width,
      height: encodedImage.height,
    });
    expect(repository.saveStories).toHaveBeenCalledWith([story]);
    expect(store.getState().stories).toEqual([story]);
  });

  it('removes expired in-memory stories before adding a new story', () => {
    const expired = createStoredStory('expired', Date.now() - STORY_LIFETIME_MS - 1);
    const repository = createRepository([expired]);
    const store = createStoryStore(repository);

    store.getState().hydrate();

    const newStory = store.getState().addStory(encodedImage);

    expect(newStory.id).not.toBe('expired');
    expect(store.getState().stories).toEqual([newStory]);
    expect(repository.saveStories).toHaveBeenCalledWith([newStory]);
  });

  it('preserves the current collection when persistence fails', () => {
    const storedStory = createStoredStory('stored');
    const repository = createRepository([storedStory]);
    vi.mocked(repository.saveStories).mockImplementation(() => {
      throw new Error('存储空间不足');
    });
    const store = createStoryStore(repository);
    store.getState().hydrate();

    expect(() => store.getState().addStory(encodedImage)).toThrow('存储空间不足');
    expect(store.getState().stories).toEqual([storedStory]);
    expect(store.getState().errorMessage).toBe('存储空间不足');
  });

  it('enforces the soft story count limit before writing', () => {
    const now = Date.now();
    const stories = Array.from({ length: MAX_STORY_COUNT }, (_, index) =>
      createStoredStory(`story-${index}`, now - index),
    );
    const repository = createRepository(stories);
    const store = createStoryStore(repository);
    store.getState().hydrate();

    expect(() => store.getState().addStory(encodedImage)).toThrow(`最多保存 ${MAX_STORY_COUNT} 条 Story`);
    expect(repository.saveStories).not.toHaveBeenCalled();
  });

  it('removes expired stories from state and storage', () => {
    const expired = createStoredStory('expired', 0);
    const valid = createStoredStory('valid', STORY_LIFETIME_MS);
    const repository = createRepository([expired, valid]);
    const store = createStoryStore(repository);
    store.getState().hydrate();

    store.getState().removeExpired(STORY_LIFETIME_MS + 1);

    expect(store.getState().stories).toEqual([valid]);
    expect(repository.saveStories).toHaveBeenCalledWith([valid]);
  });

  it('deletes and clears stories through the repository', () => {
    const first = createStoredStory('first');
    const second = createStoredStory('second', 2_000);
    const repository = createRepository([first, second]);
    const store = createStoryStore(repository);
    store.getState().hydrate();

    store.getState().deleteStory(first.id);
    expect(repository.saveStories).toHaveBeenCalledWith([second]);
    expect(store.getState().stories).toEqual([second]);

    store.getState().clearStories();
    expect(repository.clearStories).toHaveBeenCalledOnce();
    expect(store.getState().stories).toEqual([]);
  });
});
