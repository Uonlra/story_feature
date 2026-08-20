import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StoryRail } from '@/components/story/story-rail';
import { storyFixtures } from '@/data/story-fixtures';

describe('StoryRail', () => {
  it('renders the story count and every story', () => {
    render(<StoryRail stories={storyFixtures} />);

    const rail = screen.getByRole('region', {
      name: '我的 Story',
    });

    expect(within(rail).getByText('3 条')).toBeInTheDocument();
    expect(within(rail).getAllByRole('listitem')).toHaveLength(3);

    expect(within(rail).getByText('清晨')).toBeInTheDocument();
    expect(within(rail).getByText('海边')).toBeInTheDocument();
    expect(within(rail).getByText('夜色')).toBeInTheDocument();
  });

  it('renders an empty state when there are no stories', () => {
    render(<StoryRail stories={[]} />);

    const status = screen.getByRole('status');

    expect(status).toHaveTextContent('还没有 Story');
    expect(status).toHaveTextContent('添加一张图片，记录现在这一刻。');
    expect(screen.getByText('0 条')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
