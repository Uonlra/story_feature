'use client';

import { useState } from 'react';

import { AddStoryButton } from '@/components/story/add-story-button';
import { StoryRail } from '@/components/story/story-rail';
import { storyFixtures } from '@/data/story-fixtures';
import type { EncodedImage } from '@/lib/image-processing';
import { STORY_LIFETIME_MS, type StoryPreview } from '@/types/story';

export default function Home() {
  const [stories, setStories] = useState<StoryPreview[]>(storyFixtures);

  function handleImageReady(image: EncodedImage) {
    const createdAt = Date.now();

    setStories((currentStories) => [
      ...currentStories,
      {
        id: crypto.randomUUID(),
        label: '刚刚添加',
        imageSrc: image.dataUrl,
        width: image.width,
        height: image.height,
        createdAt,
        expiresAt: createdAt + STORY_LIFETIME_MS,
      },
    ]);
  }

  return (
    <main className="min-h-screen bg-page text-text">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-border pb-5">
          <p className="min-w-0 text-sm font-semibold tracking-[-0.02em]">Story Feature</p>

          <span className="shrink-0 rounded-full border border-border bg-panel px-3 py-1 text-xs font-medium text-text-muted">
            Local only
          </span>
        </header>

        <section className="flex flex-1 items-center py-12 md:py-16">
          <div className="w-full min-w-0">
            <p className="font-mono text-xs font-medium tracking-[0.04em] text-brand">STAGE 1 · STATIC STORY RAIL</p>

            <h1 className="mt-5 [overflow-wrap:anywhere] text-4xl leading-[1.15] font-semibold tracking-[-0.035em] sm:text-5xl">
              留住此刻，直到明天。
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-text-muted sm:text-lg sm:leading-8">
              图片会在浏览器中完成处理与保存。Story 不会上传到服务器，并会在创建后的二十四小时自动过期。
            </p>

            <div className="mt-10 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-text-muted">在此设备上添加一张图片，立即加入 Story 列表。</p>
                <AddStoryButton onImageReady={handleImageReady} />
              </div>

              <StoryRail stories={stories} />
            </div>
          </div>
        </section>

        <footer className="border-t border-border pt-5 text-xs leading-5 text-text-muted">
          Next.js · React · TypeScript · Tailwind CSS
        </footer>
      </div>
    </main>
  );
}
