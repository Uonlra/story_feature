import { STORY_LIFETIME_MS, type Story, type StoryMimeType } from '@/types/story';

export type CreateStoryInput = {
  imageDataUrl: string;
  mimeType: StoryMimeType;
  width: number;
  height: number;
};

export type CreateStoryOptions = {
  id?: string;
  now?: number;
};

export function createStory(input: CreateStoryInput, options: CreateStoryOptions = {}): Story {
  const createdAt = options.now ?? Date.now();

  return {
    id: options.id ?? crypto.randomUUID(),
    imageDataUrl: input.imageDataUrl,
    mimeType: input.mimeType,
    width: input.width,
    height: input.height,
    createdAt,
    expiresAt: createdAt + STORY_LIFETIME_MS,
  };
}

export function isStoryExpired(story: Pick<Story, 'expiresAt'>, now = Date.now()): boolean {
  return story.expiresAt <= now;
}

export function removeExpiredStories(stories: readonly Story[], now = Date.now()): Story[] {
  return stories.filter((story) => !isStoryExpired(story, now));
}

export function sortStoriesByCreatedAt(stories: readonly Story[]): Story[] {
  return [...stories].sort((firstStory, secondStory) => firstStory.createdAt - secondStory.createdAt);
}
