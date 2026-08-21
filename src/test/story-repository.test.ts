import { describe, expect, it, vi } from 'vitest';

import { createStoryRepository, StoryRepositoryError } from '@/services/story-repository';
import { STORY_LIFETIME_MS, STORY_STORAGE_KEY, type Story } from '@/types/story';

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

function createStoredStory(id: string, createdAt: number): Story {
  return {
    id,
    imageDataUrl: 'data:image/webp;base64,encoded',
    mimeType: 'image/webp',
    width: 800,
    height: 600,
    createdAt,
    expiresAt: createdAt + STORY_LIFETIME_MS,
  };
}

describe('story repository', () => {
  it('returns an empty list when storage has no payload', () => {
    const repository = createStoryRepository({ storage: new MemoryStorage() });

    expect(repository.loadStories()).toEqual([]);
  });

  it('converts storage read failures into a repository error', () => {
    const storage = new MemoryStorage();

    vi.spyOn(storage, 'getItem').mockImplementation(() => {
      throw new Error('read failed');
    });

    const repository = createStoryRepository({ storage });

    expect(() => repository.loadStories()).toThrowError(
      expect.objectContaining<Pick<StoryRepositoryError, 'code'>>({
        code: 'read-failed',
      }),
    );
  });

  it('loads valid stories in creation order and persists expired cleanup', () => {
    const storage = new MemoryStorage();
    const now = STORY_LIFETIME_MS + 10_000;
    const expired = createStoredStory('expired', 0);
    const newer = createStoredStory('newer', now - 100);
    const older = createStoredStory('older', now - 200);
    storage.setItem(
      STORY_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        stories: [newer, expired, older],
      }),
    );
    const repository = createStoryRepository({ storage });

    expect(repository.loadStories(now).map((story) => story.id)).toEqual(['older', 'newer']);
    expect(JSON.parse(storage.getItem(STORY_STORAGE_KEY) ?? '').stories).toEqual([older, newer]);
  });

  it.each(['not-json', JSON.stringify({ version: 2, stories: [] })])(
    'ignores and removes damaged external data: %s',
    (payload) => {
      const storage = new MemoryStorage();
      storage.setItem(STORY_STORAGE_KEY, payload);
      const repository = createStoryRepository({ storage });

      expect(repository.loadStories()).toEqual([]);
      expect(storage.getItem(STORY_STORAGE_KEY)).toBeNull();
    },
  );

  it('rejects payloads over the configured storage target before writing', () => {
    const storage = new MemoryStorage();
    const repository = createStoryRepository({ storage, maximumBytes: 80 });

    expect(() => repository.saveStories([createStoredStory('story-1', 1_000)])).toThrowError(
      expect.objectContaining<Pick<StoryRepositoryError, 'code'>>({ code: 'storage-full' }),
    );
    expect(storage.getItem(STORY_STORAGE_KEY)).toBeNull();
  });

  it('converts browser quota failures into a clear storage error', () => {
    const storage = new MemoryStorage();
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new DOMException('quota reached', 'QuotaExceededError');
    });
    const repository = createStoryRepository({ storage });

    expect(() => repository.saveStories([createStoredStory('story-1', 1_000)])).toThrowError(
      expect.objectContaining<Pick<StoryRepositoryError, 'code'>>({ code: 'storage-full' }),
    );
  });

  it('converts generic storage write failures into a repository error', () => {
    const storage = new MemoryStorage();
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new Error('write failed');
    });
    const repository = createStoryRepository({ storage });

    expect(() => repository.saveStories([createStoredStory('story-1', 1_000)])).toThrowError(
      expect.objectContaining<Pick<StoryRepositoryError, 'code'>>({ code: 'write-failed' }),
    );
  });

  it('clears the versioned storage key', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORY_STORAGE_KEY, 'payload');
    const repository = createStoryRepository({ storage });

    repository.clearStories();

    expect(storage.getItem(STORY_STORAGE_KEY)).toBeNull();
  });

  it('removes a story at the exact expiry boundary and rewrites storage', () => {
    const storage = new MemoryStorage();
    const now = STORY_LIFETIME_MS + 10_000;

    const expiring = createStoredStory('expiring', 10_000);
    const valid = createStoredStory('valid', 10_001);

    storage.setItem(
      STORY_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        stories: [expiring, valid],
      }),
    );

    const repository = createStoryRepository({ storage });
    const stories = repository.loadStories(now);

    expect(stories.map((story) => story.id)).toEqual(['valid']);

    const persistedPayload = JSON.parse(storage.getItem(STORY_STORAGE_KEY) ?? '');

    expect(persistedPayload.stories).toEqual([valid]);
  });
});
