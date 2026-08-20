import { STORY_LIFETIME_MS, type StoryPreview } from '@/types/story';

const FIXTURE_BASE_TIME = Date.UTC(2030, 0, 1, 8);

export const storyFixtures = [
  {
    id: 'fixture-morning',
    imageSrc: '/stories/morning.svg',
    width: 720,
    height: 1280,
    createdAt: FIXTURE_BASE_TIME,
    expiresAt: FIXTURE_BASE_TIME + STORY_LIFETIME_MS,
  },
  {
    id: 'fixture-coast',
    imageSrc: '/stories/coast.svg',
    width: 720,
    height: 1280,
    createdAt: FIXTURE_BASE_TIME + 1_000,
    expiresAt: FIXTURE_BASE_TIME + 1_000 + STORY_LIFETIME_MS,
  },
  {
    id: 'fixture-night',
    imageSrc: '/stories/night.svg',
    width: 720,
    height: 1280,
    createdAt: FIXTURE_BASE_TIME + 2_000,
    expiresAt: FIXTURE_BASE_TIME + 2_000 + STORY_LIFETIME_MS,
  },
] satisfies StoryPreview[];
