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

        <section className="grid flex-1 content-center gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-center lg:gap-20">
          <div className="min-w-0 max-w-2xl">
            <p className="font-mono text-xs font-medium tracking-[0.04em] text-brand">STAGE 0 · ENGINEERING BASELINE</p>

            <h1 className="mt-5 [overflow-wrap:anywhere] text-4xl leading-[1.15] font-semibold tracking-[-0.035em] sm:text-5xl">
              留住此刻，直到明天。
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-text-muted sm:text-lg sm:leading-8">
              图片会在浏览器中完成处理与保存。Story 不会上传到服务器，并会在创建后的二十四小时自动过期。
            </p>
          </div>

          <aside
            aria-labelledby="theme-preview-title"
            className="min-w-0 rounded-panel border border-border bg-panel p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="theme-preview-title" className="text-lg font-semibold tracking-[-0.02em]">
                  Quiet Frame
                </h2>

                <p className="mt-1 text-sm leading-6 text-text-muted">图片优先，界面退后。</p>
              </div>

              <span aria-hidden="true" className="mt-1 size-3 shrink-0 rounded-full bg-brand" />
            </div>

            <div className="mt-8 space-y-3">
              <div className="rounded-button bg-brand px-4 py-3 text-sm font-medium text-on-brand">Primary action</div>

              <div className="rounded-button border border-border bg-panel-muted px-4 py-3 text-sm font-medium">
                Quiet surface
              </div>

              <div className="rounded-button bg-viewer-bg px-4 py-3 text-sm font-medium text-viewer-text">
                Immersive viewer
              </div>
            </div>

            <dl className="mt-8 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-border pt-5 text-sm">
              <div>
                <dt className="text-text-subtle">Canvas</dt>
                <dd className="mt-1 font-medium">Warm neutral</dd>
              </div>

              <div>
                <dt className="text-text-subtle">Accent</dt>
                <dd className="mt-1 font-medium">Cool indigo</dd>
              </div>

              <div>
                <dt className="text-text-subtle">Radius</dt>
                <dd className="mt-1 font-medium">12 pixels</dd>
              </div>

              <div>
                <dt className="text-text-subtle">Motion</dt>
                <dd className="mt-1 font-medium">Restrained</dd>
              </div>
            </dl>
          </aside>
        </section>

        <footer className="border-t border-border pt-5 text-xs leading-5 text-text-muted">
          Next.js · React · TypeScript · Tailwind CSS
        </footer>
      </div>
    </main>
  );
}
