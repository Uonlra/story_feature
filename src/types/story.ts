export const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000;

export const STORY_STORAGE_KEY = 'story-feature:stories:v1';

export type StoryMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

export type Story = {
  id: string;
  imageSrc: string;
  mimeType: StoryMimeType;
  width: number;
  height: number;
  createdAt: number;
  expiresAt: number;
};

export type StoryStorageV1 = {
  version: 1;
  stories: Story[];
};
