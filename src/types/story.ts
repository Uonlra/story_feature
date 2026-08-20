export const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000;

export const STORY_STORAGE_KEY = 'story-feature:stories:v1';

export type StoryMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

type StoryBase = {
  id: string;
  imageSrc: string;
  width: number;
  height: number;
  createdAt: number;
  expiresAt: number;
};

export type Story = StoryBase & {
  mimeType: StoryMimeType;
};

export type StoryPreview = StoryBase;

export type StoryStorageV1 = {
  version: 1;
  stories: Story[];
};
