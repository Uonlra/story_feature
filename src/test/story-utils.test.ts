import { describe, expect, it } from 'vitest';

import { createStory, isStoryExpired, removeExpiredStories, sortStoriesByCreatedAt } from '@/lib/story-utils';
import { STORY_LIFETIME_MS, type Story } from '@/types/story';

const baseStory: Story = {
  id: 'story-1',
  imageDataUrl: 'data:image/webp;base64,example',
  mimeType: 'image/webp',
  width: 1080,
  height: 1920,
  createdAt: 1_000,
  expiresAt: 1_000 + STORY_LIFETIME_MS,
};

describe('story utilities', () => {
  it('creates a story with a deterministic id and time', () => {
    const story = createStory(
      {
        imageDataUrl: 'data:image/webp;base64,example',
        mimeType: 'image/webp',
        width: 1080,
        height: 1920,
      },
      {
        id: 'story-1',
        now: 1_000,
      },
    );

    expect(story).toEqual(baseStory);
  });

  it('treats the exact expiry time as expired', () => {
    expect(isStoryExpired(baseStory, baseStory.expiresAt - 1)).toBe(false);
    expect(isStoryExpired(baseStory, baseStory.expiresAt)).toBe(true);
  });

  it('removes expired stories without changing the input array', () => {
    const expiredStory: Story = {
      ...baseStory,
      id: 'story-expired',
      expiresAt: 999,
    };
    const stories = [expiredStory, baseStory];

    const result = removeExpiredStories(stories, 1_000);

    expect(result).toEqual([baseStory]);
    expect(stories).toHaveLength(2);
  });

  it('sorts stories from oldest to newest without mutating input', () => {
    const newerStory: Story = {
      ...baseStory,
      id: 'story-2',
      createdAt: 2_000,
      expiresAt: 2_000 + STORY_LIFETIME_MS,
    };
    const stories = [newerStory, baseStory];

    const result = sortStoriesByCreatedAt(stories);

    expect(result.map((story) => story.id)).toEqual(['story-1', 'story-2']);
    expect(stories[0].id).toBe('story-2');
  });
});
