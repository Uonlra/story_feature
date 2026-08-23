import { describe, expect, it } from 'vitest';

import { createStoryRepository } from '@/services/story-repository';
import { STORY_LIFETIME_MS, STORY_STORAGE_KEY, type Story } from '@/types/story';

function repository() {
  return createStoryRepository({ databaseName: `story-test-${crypto.randomUUID()}` });
}

function createStoredStory(id: string, createdAt: number): Story {
  return {
    id,
    imageDataUrl: 'data:image/webp;base64,encoded',
    mimeType: 'image/webp',
    width: 800,
    height: 600,
    originalWidth: 1600,
    originalHeight: 1200,
    createdAt,
    expiresAt: createdAt + STORY_LIFETIME_MS,
  };
}

describe('story repository', () => {
  it('returns an empty list when IndexedDB has no records', async () => {
    await expect(repository().loadStories()).resolves.toEqual([]);
  });

  it('stores metadata and the original image in separate stores', async () => {
    const story = createStoredStory('story-1', Date.now());
    const blob = new Blob(['original'], { type: 'image/png' });
    const repo = repository();

    await repo.saveStory(story, blob);

    await expect(repo.loadStories()).resolves.toEqual([story]);
    const storedBlob = await repo.loadOriginalImage(story.id);
    expect(storedBlob).toBeInstanceOf(Blob);
    await expect(storedBlob?.text()).resolves.toBe('original');
  });

  it('sorts stories and removes expired records with their original blobs', async () => {
    const now = STORY_LIFETIME_MS + 10_000;
    const expired = createStoredStory('expired', 0);
    const newer = createStoredStory('newer', now - 100);
    const older = createStoredStory('older', now - 200);
    const repo = repository();

    await repo.saveStory(newer, new Blob(['newer']));
    await repo.saveStory(expired, new Blob(['expired']));
    await repo.saveStory(older, new Blob(['older']));

    await expect(repo.loadStories(now)).resolves.toEqual([older, newer]);
    await expect(repo.loadOriginalImage(expired.id)).resolves.toBeNull();
  });

  it('migrates valid legacy localStorage metadata into IndexedDB', async () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
    };
    const story = createStoredStory('legacy', Date.now());
    values.set(STORY_STORAGE_KEY, JSON.stringify({ version: 1, stories: [story] }));
    const repo = createStoryRepository({ storage, databaseName: `story-test-${crypto.randomUUID()}` });

    await expect(repo.loadStories()).resolves.toEqual([story]);
    expect(values.has(STORY_STORAGE_KEY)).toBe(false);
  });

  it('deletes both metadata and the original image', async () => {
    const story = createStoredStory('story-1', Date.now());
    const repo = repository();
    await repo.saveStory(story, new Blob(['original']));

    await repo.deleteStory(story.id);

    await expect(repo.loadStories()).resolves.toEqual([]);
    await expect(repo.loadOriginalImage(story.id)).resolves.toBeNull();
  });

  it('clears all metadata and original images', async () => {
    const story = createStoredStory('story-1', 1_000);
    const repo = repository();
    await repo.saveStory(story, new Blob(['original']));

    await repo.clearStories();

    await expect(repo.loadStories()).resolves.toEqual([]);
    await expect(repo.loadOriginalImage(story.id)).resolves.toBeNull();
  });
});
