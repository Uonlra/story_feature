import { StoryRail } from '@/components/story/story-rail';
import { storyFixtures } from '@/data/story-fixtures';

export default function Home() {
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

            <div className="mt-10">
              <StoryRail stories={storyFixtures} />
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
