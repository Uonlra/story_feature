import { StoryAvatar } from '@/components/story/story-avatar';
import type { StoryPreview } from '@/types/story';
import type { ReactNode } from 'react';

type StoryRailProps = {
  stories: readonly StoryPreview[];
  action?: ReactNode;
  onStorySelect?: (story: StoryPreview) => void;
};

export function StoryRail({ stories, action, onStorySelect }: StoryRailProps) {
  return (
    <section aria-labelledby="story-rail-title">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-center">
          <h2 id="story-rail-title" className="text-lg font-semibold max-w-xl">
            Stories
          </h2>
        </div>

        <div className="flex flex-col items-center gap-4 text-center font">
          <span className="shrink-0 text-sm text-text-subtle font-bold font-mono">{stories.length} 条记录</span>
          {action}
        </div>
      </div>

      {stories.length === 0 ? (
        <div
          role="status"
          className="mt-8 rounded-panel border border-dashed border-border-strong bg-panel-muted px-5 py-12 text-center"
        >
          <p className="text-sm font-medium text-text">还没有 Story</p>
          <p className="mt-2 text-sm text-text-muted">添加一张图片，记录现在这一刻。</p>
        </div>
      ) : (
        <ul className="mx-auto mt-8 grid max-w-xl grid-cols-3 gap-x-4 gap-y-7 sm:grid-cols-4">
          {stories.map((story) => (
            <li key={story.id} className="flex justify-center">
              <StoryAvatar story={story} onSelect={onStorySelect ? () => onStorySelect(story) : undefined} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
