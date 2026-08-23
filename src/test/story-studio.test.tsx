import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { StoryStudio } from '@/components/story/story-studio';
import { STORY_AUTOPLAY_DELAY_MS } from '@/components/story/story-viewer';
import type { StoryRepository } from '@/services/story-repository';
import { createStoryStore } from '@/store/story-store';
import { STORY_LIFETIME_MS, STORY_STORAGE_KEY, type Story } from '@/types/story';

afterEach(() => {
  vi.useRealTimers();
});

function createStory(id: string, createdAt = Date.now()): Story {
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

function createRepository(stories: Story[] = []): StoryRepository {
  return {
    loadStories: vi.fn().mockResolvedValue(stories),
    saveStory: vi.fn().mockResolvedValue(undefined),
    saveStories: vi.fn().mockResolvedValue(undefined),
    loadOriginalImage: vi.fn().mockResolvedValue(null),
    deleteStory: vi.fn().mockResolvedValue(undefined),
    clearStories: vi.fn().mockResolvedValue(undefined),
  };
}

describe('StoryStudio expiry scheduling', () => {
  it('removes the nearest story when its expiry time is reached', async () => {
    vi.useFakeTimers();
    const now = Date.UTC(2026, 7, 21, 1);
    vi.setSystemTime(now);
    const story = createStory('expiring-story', now + 100 - STORY_LIFETIME_MS);
    const repository = createRepository([story]);
    const store = createStoryStore(repository);

    render(<StoryStudio store={store} />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText('1 条记录')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(110);
      await Promise.resolve();
    });

    expect(screen.getByText('0 条记录')).toBeInTheDocument();
    expect(repository.saveStories).toHaveBeenCalledWith([]);
  });

  it('removes expired stories when the window regains focus', async () => {
    const story = createStory('expired-on-focus', Date.now() - STORY_LIFETIME_MS);
    const repository = createRepository([story]);
    const store = createStoryStore(repository);

    render(<StoryStudio store={store} />);
    expect(await screen.findByText('1 条记录')).toBeInTheDocument();

    act(() => window.dispatchEvent(new Event('focus')));

    await waitFor(() => expect(screen.getByText('0 条记录')).toBeInTheDocument());
    expect(repository.saveStories).toHaveBeenCalledWith([]);
  });

  it('removes expired stories when the document becomes visible', async () => {
    const story = createStory('expired-on-visibility', Date.now() - STORY_LIFETIME_MS);
    const repository = createRepository([story]);
    const store = createStoryStore(repository);
    const visibilityStateSpy = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');

    try {
      render(<StoryStudio store={store} />);
      expect(await screen.findByText('1 条记录')).toBeInTheDocument();
      act(() => document.dispatchEvent(new Event('visibilitychange')));
      await waitFor(() => expect(screen.getByText('0 条记录')).toBeInTheDocument());
    } finally {
      visibilityStateSpy.mockRestore();
    }
  });

  it('refreshes the story list when the legacy storage key changes', async () => {
    const repository = createRepository();
    const store = createStoryStore(repository);
    const newStory = createStory('storage-event-story');

    render(<StoryStudio store={store} />);
    expect(await screen.findByText('0 条记录')).toBeInTheDocument();
    vi.mocked(repository.loadStories).mockResolvedValue([newStory]);

    act(() => window.dispatchEvent(new StorageEvent('storage', { key: STORY_STORAGE_KEY })));

    await waitFor(() => expect(screen.getByText('1 条记录')).toBeInTheDocument());
    expect(store.getState().stories).toEqual([newStory]);
  });
});

describe('StoryStudio viewer', () => {
  it('opens the selected story and closes it', async () => {
    const user = userEvent.setup();
    const story = createStory('viewer-story');
    const repository = createRepository([story]);
    const store = createStoryStore(repository);

    render(<StoryStudio store={store} />);
    await user.click(await screen.findByRole('button', { name: /打开.*NO\. 1.*Story/ }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'NO. 1 Story' })).toBeInTheDocument();
    expect(screen.getByText('1 / 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '关闭对话框' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('moves between stories with controls and arrow keys', async () => {
    const user = userEvent.setup();
    const stories = [createStory('first-story'), createStory('second-story', Date.now() + 1_000)];
    const repository = createRepository(stories);
    const store = createStoryStore(repository);

    render(<StoryStudio store={store} />);
    await user.click(await screen.findByRole('button', { name: /打开.*NO\. 1.*Story/ }));

    expect(screen.getByRole('button', { name: '上一条 Story' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '下一条 Story' })).toBeEnabled();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '下一条 Story' }));
    expect(screen.getByRole('img', { name: /NO\. 2.*Story/ })).toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('img', { name: /NO\. 1.*Story/ })).toBeInTheDocument();
  });

  it('advances every five seconds and closes after the last story', async () => {
    vi.useFakeTimers();
    const stories = [createStory('autoplay-first'), createStory('autoplay-second', Date.now() + 1_000)];
    const repository = createRepository(stories);
    const store = createStoryStore(repository);

    render(<StoryStudio store={store} />);
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.click(screen.getByRole('button', { name: /打开.*NO\. 1.*Story/ }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(STORY_AUTOPLAY_DELAY_MS - 1);
    });
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
      await Promise.resolve();
    });
    expect(screen.getByText('2 / 2')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(STORY_AUTOPLAY_DELAY_MS);
      await Promise.resolve();
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('pauses autoplay while the page is hidden and resumes remaining time when visible', async () => {
    vi.useFakeTimers();
    const visibilityStateSpy = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    const stories = [createStory('pause-first'), createStory('pause-second', Date.now() + 1_000)];
    const repository = createRepository(stories);
    const store = createStoryStore(repository);

    try {
      render(<StoryStudio store={store} />);
      await act(async () => {
        await Promise.resolve();
      });
      fireEvent.click(screen.getByRole('button', { name: /打开.*NO\. 1.*Story/ }));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2_000);
      });
      visibilityStateSpy.mockReturnValue('hidden');
      act(() => document.dispatchEvent(new Event('visibilitychange')));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STORY_AUTOPLAY_DELAY_MS);
      });
      expect(screen.getByText('1 / 2')).toBeInTheDocument();

      visibilityStateSpy.mockReturnValue('visible');
      act(() => document.dispatchEvent(new Event('visibilitychange')));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(STORY_AUTOPLAY_DELAY_MS - 2_001);
      });
      expect(screen.getByText('1 / 2')).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
        await Promise.resolve();
      });
      expect(screen.getByText('2 / 2')).toBeInTheDocument();
    } finally {
      visibilityStateSpy.mockRestore();
    }
  });
});
