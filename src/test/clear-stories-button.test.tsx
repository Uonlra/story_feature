import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ClearStoriesButton } from '@/components/story/clear-stories-button';
import type { StoryRepository } from '@/services/story-repository';
import { createStoryStore } from '@/store/story-store';
import { STORY_LIFETIME_MS, type Story } from '@/types/story';

afterEach(() => {
  vi.restoreAllMocks();
});

function createStory(id = 'story-1'): Story {
  const createdAt = Date.now();

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

describe('ClearStoriesButton', () => {
  it('keeps local stories when the user cancels confirmation', async () => {
    const user = userEvent.setup();
    const story = createStory();
    const repository = createRepository([story]);
    const store = createStoryStore(repository);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<ClearStoriesButton store={store} />);

    await user.click(await screen.findByRole('button', { name: '清空本地 Story' }));

    expect(confirm).toHaveBeenCalledWith('确定清空 1 条本地 Story 吗？此操作无法撤销。');
    expect(repository.clearStories).not.toHaveBeenCalled();
    expect(screen.getByText('当前有 1 条本地 Story。')).toBeInTheDocument();
  });

  it('clears all stories after confirmation', async () => {
    const user = userEvent.setup();
    const repository = createRepository([createStory()]);
    const store = createStoryStore(repository);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ClearStoriesButton store={store} />);

    await user.click(await screen.findByRole('button', { name: '清空本地 Story' }));

    await waitFor(() => expect(screen.getByRole('button', { name: '暂无本地 Story' })).toBeDisabled());
    expect(repository.clearStories).toHaveBeenCalledOnce();
    expect(screen.getByText('当前没有需要清理的内容。')).toBeInTheDocument();
  });

  it('shows the repository error and re-enables the button when clearing fails', async () => {
    const user = userEvent.setup();
    const repository = createRepository([createStory()]);
    vi.mocked(repository.clearStories).mockRejectedValue(new Error('无法清空本地 Story。'));
    const store = createStoryStore(repository);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ClearStoriesButton store={store} />);

    await user.click(await screen.findByRole('button', { name: '清空本地 Story' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('无法清空本地 Story。');
    expect(screen.getByRole('button', { name: '清空本地 Story' })).toBeEnabled();
    expect(screen.getByText('当前有 1 条本地 Story。')).toBeInTheDocument();
  });
});
