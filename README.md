# SakiVault

SakiVault 是一个基于 Vue 3 + TypeScript 的番剧信息浏览与收藏管理应用。项目接入 Bangumi API，提供热门番剧浏览、番剧搜索、详情页信息展示、本地收藏、Bangumi Token 登录以及收藏同步等功能。

这个项目的重点不是单纯展示列表，而是围绕“查找番剧 -> 查看详情 -> 管理收藏 -> 同步 Bangumi 收藏”的完整使用路径，练习真实 API 接入、前端状态管理、路由拆分、响应式界面和基础测试。

## 功能特性

- 首页展示热门番剧与轮播推荐，支持从首页快速进入搜索。
- 搜索页支持关键词、年份、评分、标签筛选，并将筛选条件同步到 URL query。
- 详情页使用嵌套路由拆分概览、吐槽、角色、评论、制作人员等内容。
- 收藏功能支持“想看 / 在看 / 看过 / 搁置 / 抛弃”等状态，并持久化到 LocalStorage。
- 登录页支持粘贴 Bangumi Access Token 获取用户信息。
- 收藏同步支持从 Bangumi 拉取收藏，并将本地更新推送回 Bangumi。
- 页面适配桌面端和移动端，收藏页使用书架式时间分组展示。
- 使用 Vitest 覆盖组件、Store、Composable 的基础逻辑，使用 Playwright 做基础 E2E 测试。

## 技术栈

| 技术 | 用途 |
| --- | --- |
| Vue 3 | 页面与组件开发 |
| TypeScript | 类型约束 |
| Vite | 开发服务器与构建 |
| Vue Router | 页面路由与详情页子路由 |
| Pinia | 收藏、登录、同步状态管理 |
| Axios | Bangumi API 请求 |
| VueUse | 防抖、点击外部关闭、尺寸监听等组合式工具 |
| Vitest | 单元测试 |
| Playwright | E2E 测试 |
| ESLint / Oxlint / Prettier | 代码检查与格式化 |

## 项目结构

```text
src/
├── api/                  # Bangumi API 封装
│   └── bangumi.ts
├── components/           # 通用组件
├── composables/          # 可复用组合式逻辑
│   ├── useAnimeSearch.ts
│   └── useFavorites.ts
├── router/               # Vue Router 路由配置
├── stores/               # Pinia 状态管理
│   ├── authStore.ts
│   ├── favStore.ts
│   └── syncStore.ts
├── types/                # TypeScript 类型定义
├── views/                # 页面组件
│   ├── HomeView.vue
│   ├── SearchView.vue
│   ├── DetailView.vue
│   ├── FavoritesView.vue
│   ├── LoginView.vue
│   └── tabs/             # 详情页子标签页
└── assets/               # 全局样式、字体、图标资源
```

## 核心实现

### Bangumi API 封装

项目在 `src/api/bangumi.ts` 中统一管理 Bangumi 相关请求，包括热门条目、搜索、详情、评论、角色、制作人员、用户信息和用户收藏等接口。公开 API 走 `https://api.bgm.tv`，部分 next.bgm.tv 接口通过本地开发代理或 Vercel API 代理访问。

### 搜索状态管理

搜索逻辑封装在 `src/composables/useAnimeSearch.ts` 中，负责维护关键词、年份、评分、标签、分页、加载状态和错误状态。页面层 `SearchView.vue` 负责把这些状态同步到 URL query，刷新页面或分享链接时可以保留筛选条件。

### 收藏与同步

本地收藏由 `src/stores/favStore.ts` 管理，数据写入 LocalStorage。收藏同步由 `src/stores/syncStore.ts` 负责，流程包括：

- 分页拉取 Bangumi 用户收藏。
- 将 Bangumi 收藏状态码映射成本地状态。
- 通过更新时间比较本地和远端数据。
- 远端较新时拉取更新，本地较新时推送到 Bangumi。
- 记录同步统计，包括拉取、推送、冲突和跳过数量。

### 详情页路由拆分

详情页路径为 `/anime/:id`，并通过子路由拆分为：

- `/anime/:id/overview`
- `/anime/:id/comments`
- `/anime/:id/characters`
- `/anime/:id/reviews`
- `/anime/:id/staff`

这种结构让详情页主体信息和标签页内容分离，后续扩展新标签页时不会让单个页面组件持续膨胀。

## 本地运行

### 环境要求

- Node.js `^22.18.0 || >=24.12.0`
- npm

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

默认访问地址：

```text
http://localhost:5173
```

### 构建

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 测试与质量检查

### 类型检查

```bash
npm run type-check
```

### 单元测试

```bash
npm run test:unit
```

### E2E 测试

```bash
npm run test:e2e
```

### 代码检查

```bash
npm run lint
```

### 代码格式化

```bash
npm run format
```

## Bangumi 登录说明

登录页使用 Bangumi Access Token 进行身份识别。Token 会保存在浏览器 LocalStorage 中，用于后续调用 `/v0/me` 和用户收藏相关接口。

获取 Token：

```text
https://next.bgm.tv/demo/access-token
```

注意：当前项目适合个人学习和作品展示，不建议在公共设备上保存自己的 Bangumi Token。

## 部署说明

项目包含 Vercel 构建脚本：

```bash
npm run build:vercel
```

生产环境中，部分 next.bgm.tv 请求会走 `/api/proxy`。如果部署环境没有配置代理接口，需要补充对应的服务端代理逻辑，或者改用可直接访问的公开 API。

## 项目亮点

- 真实第三方 API 接入，而不是静态 mock 数据。
- 搜索条件与 URL 同步，支持刷新保留状态。
- 使用 Pinia 拆分收藏、登录、同步三个状态模块。
- 收藏同步包含本地与远端时间戳比较，具备基本冲突判断思路。
- 详情页使用嵌套路由组织复杂页面内容。
- 有 Vitest 和 Playwright 测试基础，便于后续继续补覆盖率。

## 后续优化方向

- 完善 API 返回值类型，减少接口层的内联类型声明。
- 给同步流程补充更完整的单元测试和异常场景测试。
- 优化 Bangumi Token 的存储与失效处理。
- 完善生产环境代理配置说明。
- 补充项目截图、在线预览地址和核心流程动图。
