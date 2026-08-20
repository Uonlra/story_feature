import { StoryAvatar } from '@/components/story/story-avatar';
import type { StoryPreview } from '@/types/story';

type StoryRailProps = {
  stories: readonly StoryPreview[];
};

export function StoryRail({ stories }: StoryRailProps) {
  return (
    <section aria-labelledby="story-rail-title">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="story-rail-title" className="text-lg font-semibold">
            我的 Story
          </h2>

          <p className="mt-1 text-sm text-text-muted">图片将在创建 24 小时后自动过期。</p>
        </div>

        <span className="shrink-0 text-sm text-text-subtle">{stories.length} 条</span>
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
        <ul className="-mx-4 mt-6 flex snap-x snap-proximity gap-3 overflow-x-auto overscroll-x-contain px-4 pb-3 sm:mx-0 sm:px-0">
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
