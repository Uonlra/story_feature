import { StoryAvatar } from '@/components/story/story-avatar';
import type { StoryPreview } from '@/types/story';
import type { ReactNode } from 'react';

type StoryRailProps = {
  stories: readonly StoryPreview[];
  action?: ReactNode;
};

export function StoryRail({ stories, action }: StoryRailProps) {
  return (
    <section aria-labelledby="story-rail-title">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-center">
          <h2 id="story-rail-title" className="text-lg font-semibold max-w-xl">
            Stories
          </h2>

          <p className="mt-1 text-sm text-text-muted ">24 小时后自动过期</p>
        </div>

        <div className="flex flex-col items-center gap-4 text-center font">
          <span className="shrink-0 text-sm text-text-subtle font-bold font-mono">{stories.length} 条记录</span>
          {action}
        </div>
      </div>

      {stories.length === 0 ? (
        <div
          role="status"
          className="mt-6 rounded-panel border border-dashed border-border-strong bg-panel-muted px-5 py-10 text-center"
        >
          <p className="text-sm font-medium text-text">还没有 Story</p>
          <p className="mt-2 text-sm text-text-muted">添加一张图片，记录现在这一刻。</p>
        </div>
      ) : (
        <ul className="-mx-4 mt-6 flex snap-x snap-proximity justify-start gap-3 overflow-x-auto overscroll-x-contain px-4 pb-3 sm:mx-0 sm:justify-center sm:px-0">
          {stories.map((story) => (
            <li key={story.id} className="snap-start">
              <StoryAvatar story={story} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
