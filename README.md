# Story Feature

一个本地优先的 24 小时 Story 图片体验，用来练习图片处理、浏览器存储、状态管理、响应式 UI、可访问性和测试。

用户选择一张本地图片后，应用会在浏览器中完成校验、等比压缩和保存。图片不会上传到服务器，Story 会在创建 24 小时后自动过期并清理。

## 功能

- 支持 JPEG、PNG 和 WebP 图片。
- 单张图片最大 10 MB。
- 使用 `createImageBitmap` 和 Canvas 处理图片，输出尺寸不超过 `1080 × 1920`，小图不会被放大。
- Story 缩略图保存为 Data URL，原图以 Blob 保存到 IndexedDB。
- 刷新页面后恢复本地 Story，过期记录会自动清理。
- Story 列表使用响应式 CSS Grid：移动端三列，`sm` 断点以上四列。
- Viewer 按原图比例展示，图片超过视口时才缩小。
- Viewer 支持上一条、下一条、序号、关闭和键盘方向键切换。
- Viewer 每条 Story 自动播放 5 秒，页面不可见时暂停并在恢复后继续。
- `/about` 页面展示技术实现、限制、隐私说明，并提供清空本地 Story 的入口。
- 首页提供 About 导航、GitHub 和个人网站外部链接。

## 页面

| 路径 | 说明 |
| --- | --- |
| `/` | Story 列表、图片上传和 Viewer |
| `/about` | 项目说明、技术栈、隐私限制和清空本地数据 |

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript strict
- Tailwind CSS 4
- Zustand
- Zod
- IndexedDB
- File API、`createImageBitmap`、Canvas
- Radix UI Dialog primitives
- `lucide-react`
- Vitest、Testing Library、user-event
- pnpm

## 本地运行

需要 Node.js 和 pnpm。项目通过 `package.json` 固定使用 pnpm 10.7.0。

```bash
pnpm install
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。

生产构建：

```bash
pnpm build
pnpm start
```

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 创建生产构建 |
| `pnpm start` | 启动生产服务器 |
| `pnpm lint` | 运行 ESLint 和 Oxlint |
| `pnpm typecheck` | 执行 TypeScript 类型检查 |
| `pnpm test` | 运行 Vitest 测试 |
| `pnpm test:watch` | 以 watch 模式运行测试 |
| `pnpm format` | 使用 Prettier 格式化项目 |
| `pnpm format:check` | 检查格式是否符合规范 |

提交前建议执行：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
pnpm build
```

## 数据与隐私

所有图片处理和保存都发生在当前浏览器中：

1. 文件类型和大小通过校验后才会进入解码流程。
2. 图片按原始宽高比缩放到最大 `1080 × 1920`，生成用于列表展示的缩略图 Data URL。
3. Story 元数据保存在 IndexedDB 的 `stories` object store。
4. 原始图片 Blob 保存在 `original-images` object store，Viewer 打开时按 Story id 读取。
5. Story 的有效期为 24 小时；应用启动、窗口重新获得焦点、页面恢复可见和到期定时器都会触发清理。

应用不包含登录、后端接口、云同步或社交分享功能。清除浏览器站点数据会同时移除本地 Story 和原图。

## 项目结构

```text
src/
├─ app/                  # 页面路由和全局样式
├─ components/story/     # Story 列表、上传、Viewer 和清空操作
├─ components/ui/        # 基于 Radix 的通用 Dialog
├─ lib/                  # 图片处理、schema 和 Story 工具函数
├─ services/             # IndexedDB repository
├─ store/                # Zustand 状态和持久化协调
├─ test/                 # 单元测试和组件测试
└─ types/                # Story 和存储类型
```

核心边界：组件只负责渲染和事件转发；Repository 负责 IndexedDB；Zustand store 负责状态、过期清理和持久化协调；图片处理逻辑独立于 UI。

## 当前限制

- 当前只支持一次选择一张图片，不支持批量上传。
- 不支持视频、滤镜、贴纸、评论、点赞、账号和云同步。
- Viewer 的移动端滑动切换、删除当前 Story 的确认流程和真实浏览器 a11y 扫描仍属于后续增强项。
- IndexedDB 容量由浏览器管理；浏览器存储不可用或空间不足时会显示错误状态。

## 设计方向

UI 采用图片优先、低干扰的 Quiet Frame 方向：参考 Cosmos 的内容优先、Linear 的对齐和间距纪律，以及 Story 产品的沉浸式图片观看模式。Header、Main 和 Footer 使用统一水平 gutter，主内容保持居中的垂直流式布局。

## 相关文档

- [项目开发文档](./PROJECT_DEVELOPMENT.md)：阶段规划、架构边界、视觉 Token 和验收标准。
- [About 页面](/about)：运行后可在应用内查看技术实现和隐私说明。
