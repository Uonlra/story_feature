import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { StoryStudio } from '@/components/story/story-studio';
import { createStoryRepository, type StoryRepository } from '@/services/story-repository';
import { createStoryStore } from '@/store/story-store';
import { STORY_LIFETIME_MS, STORY_STORAGE_KEY, type Story } from '@/types/story';

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

  it('removes expired stories when the window regains focus', () => {
    const now = Date.now();

    const expiredStory: Story = {
      id: 'expired-on-focus',
      imageDataUrl: 'data:image/webp;base64,encoded',
      mimeType: 'image/webp',
      width: 800,
      height: 600,
      createdAt: now - STORY_LIFETIME_MS,
      expiresAt: now,
    };

    const repository: StoryRepository = {
      loadStories: vi.fn().mockReturnValue([expiredStory]),
      saveStories: vi.fn(),
      clearStories: vi.fn(),
    };

    const store = createStoryStore(repository);

    render(<StoryStudio store={store} />);

    expect(screen.getByText('1 条记录')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(screen.getByText('0 条记录')).toBeInTheDocument();
    expect(repository.saveStories).toHaveBeenCalledWith([]);
  });

  it('removes expired stories when the document becomes visible', () => {
    const now = Date.now();

    const expiredStory: Story = {
      id: 'expired-on-visibility',
      imageDataUrl: 'data:image/webp;base64,encoded',
      mimeType: 'image/webp',
      width: 800,
      height: 600,
      createdAt: now - STORY_LIFETIME_MS,
      expiresAt: now,
    };

    const repository: StoryRepository = {
      loadStories: vi.fn().mockReturnValue([expiredStory]),
      saveStories: vi.fn(),
      clearStories: vi.fn(),
    };

    const visibilityStateSpy = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    const store = createStoryStore(repository);

    try {
      render(<StoryStudio store={store} />);

      expect(screen.getByText('1 条记录')).toBeInTheDocument();

      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(screen.getByText('0 条记录')).toBeInTheDocument();
      expect(repository.saveStories).toHaveBeenCalledWith([]);
    } finally {
      visibilityStateSpy.mockRestore();
    }
  });

  it('restores persisted stories when the page mounts again', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };
    const now = Date.now();
    const persistedStory: Story = {
      id: 'persisted-story',
      imageDataUrl: 'data:image/webp;base64,encoded',
      mimeType: 'image/webp',
      width: 800,
      height: 600,
      createdAt: now - 1_000,
      expiresAt: now - 1_000 + STORY_LIFETIME_MS,
    };
    const repository = createStoryRepository({ storage });

    try {
      repository.saveStories([persistedStory]);

      const refreshedStore = createStoryStore(repository);

      render(<StoryStudio store={refreshedStore} />);

      expect(screen.getByText('1 条记录')).toBeInTheDocument();
      expect(refreshedStore.getState().stories).toEqual([persistedStory]);
    } finally {
      values.clear();
    }
  });

  it('refreshes the story list when the storage key changes', () => {
    const now = Date.now();
    const repository: StoryRepository = {
      loadStories: vi.fn().mockReturnValue([]),
      saveStories: vi.fn(),
      clearStories: vi.fn(),
    };
    const store = createStoryStore(repository);
    const newStory: Story = {
      id: 'storage-event-story',
      imageDataUrl: 'data:image/webp;base64,encoded',
      mimeType: 'image/webp',
      width: 800,
      height: 600,
      createdAt: now,
      expiresAt: now + STORY_LIFETIME_MS,
    };

    render(<StoryStudio store={store} />);
    expect(screen.getByText('0 条记录')).toBeInTheDocument();

    vi.mocked(repository.loadStories).mockReturnValue([newStory]);

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: STORY_STORAGE_KEY }));
    });

    expect(screen.getByText('1 条记录')).toBeInTheDocument();
    expect(store.getState().stories).toEqual([newStory]);
    expect(repository.loadStories).toHaveBeenCalledTimes(2);
  });
});
