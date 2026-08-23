export const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000;

export const STORY_STORAGE_KEY = 'story-feature:stories:v1';

export type StoryMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

type StoryBase = {
  id: string;
  width: number;
  height: number;
  /** Dimensions of the original image kept in IndexedDB. */
  originalWidth?: number;
  originalHeight?: number;
  createdAt: number;
  expiresAt: number;
};

export type Story = StoryBase & {
  imageDataUrl: string;
  mimeType: StoryMimeType;
};

export type StoryPreview = StoryBase & {
  imageSrc: string;
  label: string;
};

export type StoryStorageV1 = {
  version: 1;
  stories: Story[];
};
