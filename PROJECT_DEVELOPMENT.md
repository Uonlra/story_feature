# Story Feature 项目开发文档

> 项目定位：前端求职展示型 Story 功能练习项目  
> 项目目录：`D:\Studys\vibe_coding\fronted\Web_Fronted\Projects\22-StoryFeature`  
> 开发方式：一次只实现一类功能，先代码，再测试，再验收  
> 文档版本：v1.1（2026-08-20）

## 1. 项目目标

实现一个类似 Instagram / WhatsApp 的 Story 功能，但只做客户端本地版：

- 顶部显示 Story 列表和新增入口。
- 用户选择一张本地图片后，压缩、缩放并转成 Base64 Data URL。
- 图片和元数据存入 `localStorage`，刷新后仍可恢复。
- 每条 Story 在 24 小时后自动过期并从界面与存储中移除。
- 用户可以打开查看器查看 Story，支持按钮和键盘切换。
- 首版只做单图选择，不做多图批量上传。
- 移动端滑动作为核心功能完成后的增强项。

这个项目的重点不是“做一个轮播图”，而是练习 React、TypeScript、CSS、Next.js、浏览器 API、可访问性、测试和 CI 的完整闭环。

## 2. 需求边界

### 2.1 必须完成

- 页面顶部展示 Story 列表和新增按钮。
- 首版只允许一次选择一张图片。
- 支持 JPEG、PNG、WebP。
- 原始图片最大允许 10 MB，超过直接拒绝。
- 图片输出前必须等比缩放到不超过 `1080 x 1920`，小图不放大。
- 处理结果保存为 Base64 Data URL。
- Story 按创建时间排序，新的追加到末尾。
- Story 数据持久化到 `localStorage`。
- Story 到期后自动清理。
- 支持查看器打开、关闭、上一条、下一条。
- 支持键盘 `Escape`、`ArrowLeft`、`ArrowRight`。
- 支持删除当前 Story，并在删除前二次确认。
- 支持空状态、加载状态、错误状态、删除状态。
- `/about` 页面用于展示项目说明、技术栈、限制和清空本地数据入口。
- 响应式适配移动端和桌面端。

### 2.2 本项目不做

- 不做登录、账号体系、后端、云同步、多人共享。
- 不做视频、滤镜、拍照、贴纸、评论、点赞、好友关系。
- 不做复杂社交信息流、用户主页、侧边栏。
- 不做多图 Story、批量上传、草稿箱、协作编辑。
- 不引入 Ant Design。
- 不把移动端滑动放到首版完成标准里。

## 3. 技术选型

### 3.1 核心技术栈

| 类别     | 选择                                         | 用途                                                                    |
| -------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| 框架     | Next.js App Router                           | 多页面路由、Server Component / Client Component 边界、工程展示更完整    |
| UI       | React 19                                     | 组件拆分、状态管理和交互编排                                            |
| 语言     | TypeScript strict                            | 为 Story 数据、存储结构和工具函数建立强约束                             |
| 样式     | Tailwind CSS + CSS Modules                   | Tailwind 负责常规布局与视觉，CSS Modules 只用于少量动画、遮罩和复杂过渡 |
| 组件基础 | shadcn/ui                                    | 提供 Button、Dialog、AlertDialog、Tooltip、Sonner 等基础交互组件        |
| 状态管理 | Zustand                                      | 管理 Story 集合、增删改清、过期过滤和存储同步                           |
| 校验     | Zod                                          | 校验 `localStorage` 数据版本与结构                                      |
| 图片处理 | 原生 File API + `createImageBitmap` + Canvas | 读取、缩放、压缩和导出 Data URL                                         |
| 本地存储 | `localStorage`                               | 满足题目要求，作为唯一数据源                                            |
| 图标     | lucide-react                                 | 统一使用语义清晰的图标                                                  |
| 单测     | Vitest + Testing Library + user-event        | 覆盖工具函数、状态逻辑和交互行为                                        |
| E2E      | Playwright                                   | 验证真实浏览器中的上传、恢复、过期和查看流程                            |
| 可访问性 | axe-core + Playwright                        | 运行首页与查看器的 a11y 扫描                                            |
| CI       | GitHub Actions                               | 在 push / PR 上跑 lint、typecheck、test、build 和 E2E                   |
| 包管理   | pnpm                                         | 与现有环境保持一致                                                      |

### 3.2 技术边界

- shadcn/ui 只承担通用交互基础设施，不负责 Story 业务。
- StoryRail、StoryViewer、图片压缩、过期清理和手势逻辑自研。
- `/about` 页面主体保持 Server Component。
- `/about` 中的清空按钮单独做成局部 Client Component。
- 不使用 Ant Design，不引入额外大而全组件库。
- 不依赖网络图片，所有测试 fixture 都放在仓库内。
- 查看器首版默认自动播放，每条 Story 展示 5 秒。
- 页面不可见时暂停计时，恢复可见后继续当前条目剩余时间。
- 单条图片上传后的体积目标尽量控制在约 800 KB。
- 本地存储总量目标控制在约 4 MB 内，超过时要给出明确错误。
- Story 数量软上限为 20 条。

### 3.3 浏览器与运行环境

- 目标浏览器：近两个版本的 Chrome、Edge、Firefox、Safari。
- 移动端：iOS Safari 16+。
- 不支持 IE 和旧 Android WebView。
- 保持当前 Node.js 版本策略，不额外引入降级锁定文件。

## 4. 视觉方向

整体气质偏“图片优先、克制、简洁”，参考方向是 Pinterest + Spotify + Linear 的组合，但不做花哨装饰。

推荐 Token：

- `canvas`: `#f7f8f5`
- `surface`: `#ffffff`
- `ink`: `#171b1a`
- `muted`: `#6f7975`
- `hairline`: `#dfe5df`
- `primary`: `#5e6ad2`
- `viewer`: `#101112`
- `success`: `#2f9e68`
- `warning`: `#d8892f`
- `danger`: `#d95454`
- `radius-card`: `12px`
- `radius-pill`: `9999px`

布局原则：

- 首页以浅色画布为主，图片是主角。
- 查看器使用近黑背景，突出沉浸式观看。
- 细边框、低饱和文字和严格间距优先。
- 不使用大面积渐变和装饰性背景图形。
- 图标按钮要有清晰的 `aria-label` 和 tooltip。

## 5. 数据模型

```ts
export type Story = {
  id: string;
  imageDataUrl: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  width: number;
  height: number;
  createdAt: number;
  expiresAt: number;
};

export type StoryStorageV1 = {
  version: 1;
  stories: Story[];
};
```

规则：

- 使用 `crypto.randomUUID()` 生成 `id`。
- `createdAt` 和 `expiresAt` 使用 Unix 毫秒时间戳。
- `expiresAt = createdAt + 24 * 60 * 60 * 1000`。
- 读取到的外部数据必须先做结构校验。
- 损坏数据直接忽略并回退为空列表。
- UI 上的索引、剩余时间等信息都从当前状态派生，不写回存储。

建议的存储键：

```ts
export const STORY_STORAGE_KEY = "story-feature:stories:v1";
```

## 6. 代码规划

```text
app/
├─ layout.tsx
├─ page.tsx
├─ about/
│  └─ page.tsx
├─ not-found.tsx
└─ globals.css

components/
├─ story/
│  ├─ story-studio.tsx
│  ├─ story-rail.tsx
│  ├─ story-avatar.tsx
│  ├─ story-viewer.tsx
│  ├─ story-progress.tsx
│  ├─ add-story-button.tsx
│  └─ delete-story-dialog.tsx
└─ about/
   └─ clear-stories-button.tsx

store/
└─ story-store.ts

services/
└─ story-repository.ts

lib/
├─ image-processing.ts
├─ story-schema.ts
├─ story-utils.ts
└─ time.ts

tests/
├─ unit/
├─ components/
└─ e2e/
```

职责边界：

- `components` 只做渲染和事件转发，不直接读写 `localStorage`。
- `store/story-store.ts` 负责集合状态、创建、删除、过期清理和持久化协调。
- `services/story-repository.ts` 负责序列化、反序列化、版本兼容和异常处理。
- `lib/image-processing.ts` 负责校验、解码、缩放和 Data URL 生成。
- `lib/story-utils.ts` 负责创建 Story、判断过期和过滤逻辑。
- `lib/story-schema.ts` 负责 Zod 校验。
- `app/about/page.tsx` 保持 Server Component。

## 7. 组件规划

| 组件                   | 责任                          |
| ---------------------- | ----------------------------- |
| `story-studio`         | 组织首页整体布局              |
| `story-rail`           | 渲染 Story 列表和新增入口     |
| `story-avatar`         | 渲染单个 Story 封面           |
| `add-story-button`     | 触发文件选择和处理中状态      |
| `story-viewer`         | 全屏查看、切换和关闭 Story    |
| `story-progress`       | 展示当前序号与自动播放进度    |
| `delete-story-dialog`  | 删除前确认                    |
| `clear-stories-button` | `/about` 中清空全部本地 Story |

说明：

- 查看器使用 shadcn/ui 的 Dialog/AlertDialog 基础能力。
- Story 列表和查看器业务逻辑自研，不使用现成轮播组件。
- 图标按钮统一加 tooltip，避免只靠图标表达含义。

## 8. 核心流程

### 8.1 上传与图片处理

```text
点击新增
  -> 选择单张图片
  -> 校验 MIME 和文件大小
  -> 解码图片并读取原始尺寸
  -> 计算不超过 1080 x 1920 的等比尺寸
  -> Canvas 绘制并压缩
  -> 导出 Base64 Data URL
  -> 创建 Story 数据
  -> 写入 localStorage
  -> 更新 Zustand 状态
```

规则：

- 首版只允许单图选择，不启用 `multiple`。
- 原图超过 10 MB 直接拒绝。
- 图片缩放后尽量控制在可接受的体积内。
- WebP 不可用时回退到 JPEG。
- `createImageBitmap` 不可用时回退到 `HTMLImageElement`。

### 8.2 过期清理

```text
应用启动
  -> 读取并清理过期 Story
  -> 渲染有效数据

新增成功
  -> 重新安排最近过期时间

页面 focus / visibilitychange
  -> 再次清理过期数据

查看器打开时
  -> 若当前 Story 过期则自动切换或关闭
```

说明：

- 不能只靠 `setTimeout(24h)`。
- 每次读取都必须先过滤过期数据。
- 定时器只负责让当前打开的页面更快更新。

### 8.3 查看器交互

- 点击 Story 打开查看器。
- 支持上一条、下一条和关闭。
- 支持 `Escape`、`ArrowLeft`、`ArrowRight`。
- 当前项删除后优先切到下一条，没有下一条则切到上一条。
- 最后一条播放完自动关闭。
- 用户手动切换后重新开始完整 5 秒。
- 页面不可见时暂停，回来后继续剩余时间。
- 首版不把移动端滑动作为验收门槛，放到增强阶段。

## 9. 错误与边界状态

| 场景                   | 预期行为                     |
| ---------------------- | ---------------------------- |
| 用户取消文件选择       | 不报错，不改变现有数据       |
| 非图片文件             | 提示只支持 JPEG / PNG / WebP |
| 图片损坏               | 提示图片无法读取             |
| 文件过大               | 直接拒绝并提示               |
| localStorage 满了      | 提示存储空间不足，保留旧数据 |
| localStorage JSON 损坏 | 回退为空列表，不让页面崩溃   |
| Story 过期             | 自动清理并更新界面           |
| 列表为空               | 显示空状态和新增入口         |
| 快速重复点击           | 处理中禁用入口，避免并发写入 |

## 10. 测试策略

测试原则：优先覆盖用户能感知、又最容易出错的行为，不追求无意义覆盖率。

### 10.1 单元测试（Vitest）

- 图片尺寸计算。
- MIME 校验。
- 过期判断。
- Story 创建与排序。
- Repository 读写、版本校验、损坏数据处理。
- 容量超限错误转换。
- `Zod` schema 校验。

### 10.2 组件测试（Testing Library）

- 新增按钮可触发文件选择。
- 取消选择不报错。
- 非法文件显示可访问错误。
- 处理期间按钮不可重复触发。
- Story 列表按数据渲染。
- 查看器支持切换、关闭和键盘操作。
- 删除确认流程正确。
- 空状态和骨架屏正确显示。

### 10.3 E2E（Playwright）

保留 3 条主流程：

1. 上传一张图片 -> 列表出现 -> 打开查看器 -> 图片正确渲染。
2. 上传两张图片 -> 刷新页面 -> 数据恢复 -> 键盘可切换。
3. 预置已过期数据 -> 打开页面 -> Story 不显示且存储被清理。

### 10.4 可访问性

- 使用 `axe-core` 检查首页和查看器。
- 文件输入必须有标签。
- 图标按钮必须有可访问名称。
- 错误消息使用 `role="alert"`。
- Dialog 打开后焦点进入查看器，关闭后返回触发点。

### 10.5 质量门禁

每个阶段至少执行：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

最终阶段再执行：

```bash
pnpm test:e2e
```

不设置全局覆盖率百分比门槛。

## 11. 分阶段开发计划

每次只做一个阶段。上一阶段没验收通过，不进入下一阶段。

### 阶段 0：工程基线

- 初始化 Next.js + TypeScript + Tailwind + shadcn/ui。
- 配好路径别名、ESLint / Oxlint、Prettier。
- 建立全局样式、设计 Token 和页面壳。
- 搭好测试基线。

验收：`lint`、`typecheck`、空测试和 `build` 通过。

### 阶段 1：Story 静态列表

- 定义 `Story` 类型和静态 fixture。
- 实现 `story-rail` 和 `story-avatar`。
- 完成空状态与响应式列表。

验收：桌面和 `320px` 宽度无溢出，组件测试通过。

### 阶段 2：单图上传与尺寸约束

- 实现单图选择。
- 完成类型校验、解码、缩放和导出。
- 展示处理中和错误状态。

验收：尺寸计算、非法文件和上传流程测试通过。

### 阶段 3：持久化与 24 小时过期

- 实现 `story-repository`。
- 实现 Zustand store。
- 处理刷新恢复、过期清理和配额错误。

验收：刷新恢复正常，过期数据可自动清理。

### 阶段 4：Story 查看器

- 使用 shadcn/ui Dialog 构建查看器。
- 完成切换、关闭、键盘、删除确认。
- 处理查看过程中 Story 过期。

验收：焦点管理、边界切换和删除路径可测。

### 阶段 5：项目说明页

- 完成 `/about` 页面。
- 加入技术栈、限制、隐私与 localStorage 说明。
- 提供清空本地 Story 的入口。

验收：页面主体为 Server Component，清空按钮独立工作。

### 阶段 6：增强与质量收尾

- 补移动端滑动。
- 补性能检查、a11y 扫描和 CI。
- 完成 README 与演示说明。

验收：核心流程、测试、构建和 CI 都能稳定通过。

## 12. 性能与安全注意事项

- 先限制 10 MB，再进入图片解码和 Canvas。
- 处理结束后释放临时资源，不长期持有文件对象。
- 不使用 `dangerouslySetInnerHTML`。
- Data URL 只作为 `<img src>` 使用。
- Story 数量设置软上限，例如 20 条。
- 图片处理和查看器过渡不应阻塞核心交互。
- 先做实测，再决定是否需要更复杂的优化。
- 输出图片优先使用 WebP，浏览器不支持时回退 JPEG。

## 13. Git 提交建议

建议按阶段提交：

```text
chore: bootstrap story feature app
feat: build story rail and static layout
feat: add single image upload and resizing
feat: persist stories and clear expired items
feat: add accessible story viewer
feat: add about page and local cleanup action
test: cover critical story flows
docs: update architecture and tradeoffs
```

每个提交都应能说明“解决了什么问题”和“如何验证”。

## 14. 完成定义

- 首页、查看器和 `/about` 页面都可独立访问。
- 单图上传、压缩、持久化、刷新恢复、过期清理都正常。
- 删除、清空、空状态和错误状态都有处理。
- 键盘可操作，基本可访问性通过检查。
- 关键单测、组件测试、E2E 和生产构建通过。
- README 能清楚解释本地存储、图片缩放、过期策略和技术取舍。

## 15. 第一轮实施范围

下一轮只做“阶段 0：工程基线”。完成后先停下来，确认目录、路由、工具链和测试基线都正常，再进入“阶段 1：Story 静态列表”。这样每轮只学习一类问题，不把项目一次性摊平。
