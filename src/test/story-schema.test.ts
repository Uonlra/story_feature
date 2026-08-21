import { describe, expect, it } from 'vitest';

import { storySchema, storyStorageV1Schema } from '@/lib/story-schema';
import { STORY_LIFETIME_MS, type Story } from '@/types/story';

const validStory: Story = {
  id: 'story-1',
  imageDataUrl: 'data:image/webp;base64,encoded',
  mimeType: 'image/webp',
  width: 800,
  height: 600,
  createdAt: 1_000,
  expiresAt: 1_000 + STORY_LIFETIME_MS,
};

describe('story schema', () => {
  it('accepts a valid story and storage envelope', () => {
    expect(storySchema.parse(validStory)).toEqual(validStory);
    expect(
      storyStorageV1Schema.parse({
        version: 1,
        stories: [validStory],
      }),
    ).toEqual({
      version: 1,
      stories: [validStory],
    });
  });

  it('rejects a Data URL that does not match its MIME type', () => {
    expect(
      storySchema.safeParse({
        ...validStory,
        imageDataUrl: 'data:image/jpeg;base64,encoded',
      }).success,
    ).toBe(false);
  });

  it('rejects a story whose expiry is not exactly 24 hours after creation', () => {
    expect(
      storySchema.safeParse({
        ...validStory,
        expiresAt: validStory.expiresAt + 1,
      }).success,
    ).toBe(false);
  });

  it('rejects unknown storage versions and additional fields', () => {
    expect(storyStorageV1Schema.safeParse({ version: 2, stories: [] }).success).toBe(false);
    expect(storySchema.safeParse({ ...validStory, label: 'external field' }).success).toBe(false);
  });
});
