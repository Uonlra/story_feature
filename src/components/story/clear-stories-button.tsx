'use client';

import { useEffect, useState } from 'react';
import { useStore } from 'zustand';

import { storyStore, type StoryStoreApi } from '@/store/story-store';

type ClearStoriesButtonProps = {
  store?: StoryStoreApi;
};

export function ClearStoriesButton({ store = storyStore }: ClearStoriesButtonProps) {
  const stories = useStore(store, (state) => state.stories);
  const status = useStore(store, (state) => state.status);
  const errorMessage = useStore(store, (state) => state.errorMessage);
  const hydrate = useStore(store, (state) => state.hydrate);
  const clearStories = useStore(store, (state) => state.clearStories);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    if (status === 'idle') {
      void hydrate();
    }
  }, [hydrate, status]);

  async function handleClear() {
    if (isClearing || stories.length === 0) {
      return;
    }

    const confirmed = window.confirm(`确定清空 ${stories.length} 条本地 Story 吗？此操作无法撤销。`);

    if (!confirmed) {
      return;
    }

    setIsClearing(true);

    try {
      await clearStories();
    } catch {
      // Store 已经负责写入 errorMessage，这里只负责结束处理中状态。
    } finally {
      setIsClearing(false);
    }
  }

  const isBusy = isClearing || status === 'loading';
  const isEmpty = stories.length === 0;

  return (
    <div className="flex flex-col items-start gap-3 sm:items-end">
      <button
        type="button"
        onClick={handleClear}
        disabled={isBusy || isEmpty}
        aria-busy={isClearing}
        className="inline-flex min-h-11 items-center justify-center rounded-button border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:border-destructive hover:bg-destructive-soft disabled:cursor-not-allowed disabled:border-border disabled:bg-disabled-surface disabled:text-disabled-ink"
      >
        {isClearing ? '正在清空…' : isEmpty ? '暂无本地 Story' : '清空本地 Story'}
      </button>

      <p className="text-sm text-text-muted">
        {isEmpty ? '当前没有需要清理的内容。' : `当前有 ${stories.length} 条本地 Story。`}
      </p>

      {errorMessage ? (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
