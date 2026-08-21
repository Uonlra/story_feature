import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { StoryStudio } from '@/components/story/story-studio';
import type { StoryRepository } from '@/services/story-repository';
import { createStoryStore } from '@/store/story-store';
import { STORY_LIFETIME_MS, type Story } from '@/types/story';

afterEach(() => {
  vi.useRealTimers();
});

describe('StoryStudio expiry scheduling', () => {
  it('removes the nearest story when its expiry time is reached', () => {
    vi.useFakeTimers();
    const now = Date.UTC(2026, 7, 21, 1);
    vi.setSystemTime(now);
    const story: Story = {
      id: 'expiring-story',
      imageDataUrl: 'data:image/webp;base64,encoded',
      mimeType: 'image/webp',
      width: 800,
      height: 600,
      createdAt: now + 100 - STORY_LIFETIME_MS,
      expiresAt: now + 100,
    };
    const repository: StoryRepository = {
      loadStories: vi.fn().mockReturnValue([story]),
      saveStories: vi.fn(),
      clearStories: vi.fn(),
    };
    const store = createStoryStore(repository);

    render(<StoryStudio store={store} />);
    expect(screen.getByText('1 条记录')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(110);
    });

    expect(screen.getByText('0 条记录')).toBeInTheDocument();
    expect(repository.saveStories).toHaveBeenCalledWith([]);
  });
});
