import Link from 'next/link';
import type { Metadata } from 'next';

import { ClearStoriesButton } from '@/components/story/clear-stories-button';

export const metadata: Metadata = {
  title: 'About',
  description: 'Story Feature 的技术实现、限制和本地数据说明。',
};

const projectDetails = [
  {
    label: '技术栈',
    value: 'Next.js · React · TypeScript · Tailwind CSS · Zustand · Zod',
  },
  {
    label: '图片处理',
    value: 'Canvas 等比压缩，最大输出尺寸 1080 × 1920，支持 JPEG、PNG 和 WebP。',
  },
  {
    label: '本地存储',
    value: '缩略图元数据与原始图片 Blob 保存在浏览器 IndexedDB 中。',
  },
  {
    label: '生命周期',
    value: '每条 Story 保存 24 小时，过期后会从列表和本地数据库中清理。',
  },
];

const privacyNotes = [
  '图片不会上传到服务器。',
  '原始图片只保留在当前浏览器的 IndexedDB 中。',
  '清除浏览器站点数据会同时移除本地 Story。',
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-page text-text">
      <div className="flex min-h-screen w-full flex-col">
        <header className="w-full border-b border-border">
          <div className="flex items-center justify-between gap-4 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <Link href="/" className="text-sm font-semibold text-text transition-colors hover:text-brand">
              Story Feature
            </Link>

            <span className="font-mono text-xs text-text-subtle">ABOUT</span>
          </div>
        </header>

        <div className="flex-1 px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <article className="mx-auto w-full max-w-3xl">
            <div className="pb-10 sm:pb-12">
              <p className="font-mono text-xs tracking-[0.04em] text-text-subtle">PROJECT NOTES</p>

              <h1 className="mt-4 text-4xl leading-tight font-semibold sm:text-5xl">Story Feature</h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-text-muted sm:text-lg sm:leading-8">
                一个只在本地运行的图片 Story 体验，用来练习图片处理、状态管理和浏览器存储。
              </p>
            </div>

            <div className="divide-y divide-border border-y border-border">
              <section className="py-8 sm:py-10" aria-labelledby="details-title">
                <h2 id="details-title" className="text-lg font-semibold">
                  实现概览
                </h2>

                <dl className="mt-6 divide-y divide-border">
                  {projectDetails.map((item) => (
                    <div key={item.label} className="grid gap-2 py-4 sm:grid-cols-[9rem_1fr] sm:gap-6">
                      <dt className="text-sm font-medium text-text">{item.label}</dt>
                      <dd className="text-sm leading-6 text-text-muted">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="py-8 sm:py-10" aria-labelledby="privacy-title">
                <h2 id="privacy-title" className="text-lg font-semibold">
                  隐私与限制
                </h2>

                <ul className="mt-6 space-y-3 text-sm leading-6 text-text-muted">
                  {privacyNotes.map((note) => (
                    <li key={note} className="border-l-2 border-brand/40 pl-4">
                      {note}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:py-10">
                <div>
                  <h2 className="text-lg font-semibold">本地数据</h2>
                  <p className="mt-2 text-sm leading-6 text-text-muted">清空当前浏览器保存的全部 Story 和原图。</p>
                </div>

                <ClearStoriesButton />
              </section>
            </div>
          </article>
        </div>

        <footer className="w-full border-t border-border">
          <div className="px-4 py-5 text-xs leading-5 text-text-muted sm:px-6 lg:px-8">
            Next.js · React · TypeScript · Tailwind CSS
          </div>
        </footer>
      </div>
    </main>
  );
}
