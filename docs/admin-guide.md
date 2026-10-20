# Amelife 可视化文章管理

入口：**https://amelife.pages.dev/admin/**（`/admin` 会由 Pages 规范化到 `/admin/`）。

## 项目与方案

经检查，本项目使用 Astro 7.3.5 静态输出、TypeScript、Markdown/MDX 内容集合。文章目录为 `src/content/blog/`，字段约束在 `src/content.config.ts`，公开文章通过 `src/utils/posts.ts` 的 `sortPosts()` 统一过滤草稿。文章、列表、分类、标签、搜索和 RSS 均使用此过滤。文章 URL 来自 Astro 生成的文件 ID，不从标题字段重新命名。

后台采用 Decap CMS 3.17.1 + GitHub backend。它直接读写 `Ameyur1/amelife` 的 `main` 分支，复用当前 Cloudflare Pages Git 集成。没有数据库、内容迁移或常驻服务器。CMS 页面静态托管；`/api/cms/auth`、`/api/cms/callback` 和限定仓库路径的 `/api/github/*` 使用 Pages Functions。最后一个端点把 Decap 的 GitHub 内容与媒体请求从同域转发到 GitHub API，避免浏览器直连 GitHub 时图片上传失败。它只接受 GitHub App 的短期 `ghu_` 令牌，只允许访问当前账号信息及 `Ameyur1/amelife`，不保存令牌。`public/_routes.json` 保证普通博客页面继续走静态资源，不消耗 Functions 请求。

Decap 支持原生 Markdown 编辑、预览、媒体库、GitHub 内容提交，适合这个仓库。Sveltia CMS 也支持类似工作流，但本次选择 Decap 的现成字段和媒体编辑能力，避免自行实现 GitHub 编辑器。

## 一次性配置：GitHub

### 1. 注册 GitHub App（不要选择 OAuth Apps）

在 GitHub 个人 Settings → Developer settings → **GitHub Apps** → **New GitHub App** 创建：

| 设置 | 值 |
| --- | --- |
| GitHub App name | 自选唯一名称，例如 Amelife Article Editor |
| Homepage URL | `https://amelife.pages.dev/admin/` |
| Callback URL | `https://amelife.pages.dev/api/cms/callback` |
| Request user authorization during installation | 不勾选；从后台发起登录 |
| Enable Device Flow | 不勾选 |
| Webhook → Active | 不勾选；Pages 的既有 Git 集成负责触发部署 |
| Repository permissions → Contents | **Read and write** |
| Repository permissions → Metadata | Read-only（默认） |
| 其他仓库/组织/账户权限 | 不需要 |
| Where can this GitHub App be installed? | Only on this account |

保持 **Expire user authorization tokens** 开启。如果页面位于 Optional features，确认启用 expiring user-to-server access tokens。后台只接受 `ghu_` 前缀且有效期不超过 8 小时的用户令牌，不接受 PAT 或长期 OAuth App 令牌。

创建后记录 **Client ID**（不是 App ID），点击 **Generate a new client secret** 取得 Client Secret。这里不需要生成 Private key，也不需要个人访问令牌。

### 2. 安装到仓库

在该 App 的 **Install App** 中安装到你的账号，选择 **Only select repositories → amelife**。账号自身也必须拥有该仓库的写入权限。若 `main` 存在必须 PR 才能写入的分支保护规则，本方案的直接发布会被 GitHub 拒绝；应按你自己的仓库策略决定是否允许管理员直接写入，或另行改为审核工作流。不要为了登录额外授予全仓库或组织权限。

### 3. 获取 Repository ID

打开 `https://api.github.com/repos/Ameyur1/amelife`，找到顶层数字 `id`（不是 owner.id，也不是 node_id）。也可以用 PowerShell：

```powershell
(Invoke-RestMethod 'https://api.github.com/repos/Ameyur1/amelife').id
```

如果仓库私有，用已登录的 GitHub CLI：`gh api repos/Ameyur1/amelife --jq .id`。不要把令牌写进命令、截图或仓库。

## 一次性配置：Cloudflare Pages

1. 进入 Workers & Pages → **amelife** → Settings → Variables and Secrets（或环境变量设置）。
2. 为 **Production** 添加下面的运行时绑定。秘密值请选择 **Secret / Encrypt**。不要给变量加 `PUBLIC_` 前缀，不要写进 `/admin/config.yml`。

| 名称 | 内容 | 类型 |
| --- | --- | --- |
| `GITHUB_CLIENT_ID` | GitHub App 的 Client ID | 文本或 Secret |
| `GITHUB_CLIENT_SECRET` | GitHub App 的 Client Secret | **Secret** |
| `OAUTH_STATE_SECRET` | 至少 32 字符随机值，建议下方生成的 64 字符 | **Secret** |
| `GITHUB_REPOSITORY_ID` | 上一步的仓库数字 ID，以字符串填写 | 文本 |
| `CMS_ALLOWED_USERS` | `Ameyur1`；多个登录名用英文逗号分隔 | 文本 |

生成随机值（在本机执行，结果仅粘贴到 Cloudflare Secret）：

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

3. 保持既有设置：Production branch=`main`，Build command=`npm run build`，Build output directory=`dist`，Root directory 为该项目根目录。
4. 提交本次新增文件并推送后等待最新生产部署 **Success**。根目录 `functions/` 会由 Pages Git 集成编译；`astro build` 只构建静态部分，这是正常的。无需 Astro 服务端适配器。
5. Secrets 变更后需要新建或重试生产部署才会应用。确认部署的 Functions 信息能看到 `/api/cms/auth`、`/api/cms/callback` 与 `/api/github/*`。
6. 打开正式网址 `/admin/`，点击 GitHub 登录；完成授权后弹窗返回后台。

没有完成密钥配置时，认证端点返回 503 提示，默认拒绝登录。预览部署域名与 localhost 不允许使用生产 OAuth。不要给 Preview 环境复制生产密钥；只从正式网址管理文章。

## 日常使用

### 创建和发布 Markdown 文章

1. 登录 `/admin/`，选择 **文章（Markdown）→ ＋文章**。
2. 输入标题、简介，日期自动填当天；选择学术、杂谈或日常。
3. 添加标签。`draft` 与 `featured` 默认关闭。
4. 在正文区域编写 Markdown 源码，旁边查看实时预览。源码模式可保留既有表格、代码块、原始 HTML 和特殊格式，避免富文本转换改变内容。
5. 可选自定义封面；留空使用现有分类默认封面。原有 `updated`、`cover`、`coverAlt`、`coverPosition` 都可以编辑，留空时不会写入 `null` 导致 Astro 构建失败。
6. 点击 **发布 / Publish**（具体中文按钮取决于 Decap 界面）。后台直接创建 GitHub commit；新文章文件名由标题生成，文件格式为 YAML Frontmatter + Markdown。发布日期以 Frontmatter 为准，避免不同时区在午夜附近生成错误的日期前缀。
7. 去 Cloudflare 确认新 commit 的部署成功后，网站才会更新。保存成功不等于已经部署成功。

示例生成格式：

```markdown
---
title: 我的新文章
description: 文章简介
date: 2026-10-19
category: 日常
tags:
  - 随笔
draft: false
featured: false
---

这里开始写正文。
```

日期表示编辑者浏览器本地日期。前台继续按现有日期排序规则显示。

### 编辑现有文章与保留旧链接

在列表中打开文章，编辑后发布。Decap 更新原有文件路径；本次没有重命名旧文件或更改 Astro 路由。修改标题不会主动改名。请不要在 GitHub 手动重命名文件，否则旧 URL 会随文件名变化。新文章使用不同标题或调整新建文件名以避免重名。

本地仍可以手工写 Markdown。若你也在本地工作，每次编辑前先 `git pull --ff-only`，以取回后台提交，避免双方覆盖或推送冲突。多人同时编辑同一文章应互相协调。

### 草稿与精选

- 开启“草稿（网站隐藏）”并发布/保存，会提交 `draft: true` 到 GitHub。下一次成功构建不生成该文章页面，也不在列表、分类、标签、搜索或 RSS 中显示。想公开时关闭草稿，再发布。
- 草稿开关是前台显示规则，不是保密功能。公开仓库中的草稿源文件仍然公开；不要在其中存放私人信息。
- 简单发布模式没有独立审核队列。编辑器中未保存的内容不等于 GitHub 草稿；离开前保存为草稿或复制备份。
- 精选开关控制已有首页精选规则，不改变访问权限。

### 上传和插入图片

正文工具栏点击图片按钮 → 上传/选择媒体 → 填写图片说明 → 插入。媒体写入 `public/images/posts/`，正文链接形如 `![说明](/images/posts/example.jpg)`。封面图片字段也使用同一媒体库。上传请求经本站的 `/api/github/*` 同域转发，仍由 GitHub 对短期令牌和仓库写权限进行最终校验。

上传前压缩大图，推荐 WebP/JPEG 和简单唯一文件名；不要上传几十 MB 原图。媒体上传可能单独生成一次提交/部署，正文发布后再确认最终部署。不要随意删除媒体库文件：图片可能被别的文章引用。删除文章不会自动删除共享图片。

### 删除文章

打开文章，通过菜单选择删除并确认。该操作提交 GitHub 删除记录；下一次部署后文章消失、旧地址正常返回 404。若误删，可在 GitHub 历史中恢复文件并重新部署。不要删除仍希望保留访问的文章。

### MDX

**文章（MDX）** 集合对应同一文章目录下的 `.mdx` 文件，写入相同 Frontmatter。Astro 的 MDX 构建能力保持不变。Decap 不执行 MDX 中的 import/JSX 组件，因此这个集合关闭预览；请使用源码编辑，复杂组件通过本地 `npm run dev` 验证最终效果。普通 Markdown 集合提供实时预览。

### 登录过期和退出

GitHub App 用户令牌最长 8 小时，到期后重新登录；本实现不自动刷新。Decap 会在浏览器中保存短期访问令牌，这是 GitHub backend 的正常工作方式。Client Secret、登录校验密钥和 6 个月刷新令牌不会进入客户端。不要在共享设备上保持登录；完成编辑后在账户菜单退出。

移除允许名单会阻止后续登录，但不会立即撤销已签发令牌。紧急撤销时去 GitHub Settings → Applications → Authorized GitHub Apps 撤销授权，或卸载该 App；也可撤销协作者仓库权限。仅修改 Cloudflare Secret 不能撤回浏览器已有的 GitHub 令牌。

## 安全与能力边界

- 认证使用加密的 `HttpOnly; Secure; SameSite=Lax` Cookie，10 分钟过期；随机 state、防篡改与 PKCE S256 校验。
- 服务端验证 GitHub 用户允许名单、仓库 ID 和 `permissions.push`。GitHub API 对每次读写再执行真实权限检查；打开公开 `/admin/` 不会授予仓库权限。
- 登录结果只通过固定 origin 与 opener 校验的 `postMessage` 返回。认证页面禁用缓存，限制脚本 CSP，不记录密钥或上游响应内容。
- GitHub App 仅安装到目标仓库，申请 Contents 写权限；该权限覆盖仓库内容，不是按目录隔离。允许名单中的用户必须是你信任的仓库维护者。MDX 能参与构建，不能给不可信作者写入权限。
- Decap 通过固定版本 CDN 加载，带 SRI 校验；不会在其他博客页面加载，也不改变播放器或前台视觉。若 CDN 不可达，后台会显示加载失败，前台继续可用。
- 后台的 CSP 允许 Decap bundle 所需的 `unsafe-eval`，仅作用于 `/admin/*`；OAuth 回调使用独立 nonce CSP。正文预览不是最终 Astro 页面截图。
- 本地测试以 GitHub 模拟响应验证权限拒绝逻辑，不会发布测试文章到真实仓库。真正的授权、GitHub 写入、Cloudflare 自动部署仍需完成上述外部配置后验收。

## 验收清单

完成配置后按顺序执行：

1. 未登录浏览器访问 `/admin/`：只能看到登录页面。
2. 用不在名单/无仓库写权限的账号授权：应拒绝，不能进入编辑。
3. 允许账号登录，创建唯一标题的测试文章，默认日期为当天、草稿与精选均关闭。
4. 上传测试图片并插入，发布后在 GitHub 检查图片路径和 YAML 字段，再确认 Pages 最新提交部署成功。
5. 网站打开新文章与图片，检查 Markdown、代码块、目录及播放器。
6. 编辑简介并发布，确认 URL 不变；开启草稿发布后确认网站文章地址返回 404，列表、搜索、RSS 不含它。关闭草稿后再次出现。
7. 删除测试文章并部署，确认文章返回 404。不要删除既有文章来测试。
8. 打开原有首页、列表、分类、标签、归档及长文章《秘密》，检查旧地址继续可读。

## 故障排查

| 现象 | 检查 |
| --- | --- |
| 认证 503 | Production 运行时变量是否齐全；Secret 设置后是否重新部署 |
| 回调 404 | `functions/` 是否提交；部署是否编译 Functions；`_routes.json` 是否存在于 dist |
| state/cookie 失败 | 是否在正式域名打开；Cookie 是否允许；同一时刻只发起一次登录；不要手工刷新回调 |
| 长期令牌错误 | 是否创建了 GitHub App 而非 OAuth App；是否开启 expiring user tokens |
| 允许名单错误 | `CMS_ALLOWED_USERS` 填 GitHub 登录名，不是邮箱或显示姓名 |
| 写权限错误 | App 是否只安装并授权到 amelife；账号是否有 write；仓库 ID 是否正确 |
| 登录成功但发布 403 | GitHub 分支保护/Rulesets、权限变更、令牌过期 |
| 文字可发布但图片提示 Failed to fetch | 强制刷新后台并重新登录，确认当前生产部署已包含 `/api/github/*`；在浏览器 Network 中检查请求是否发往本站 `/api/github/repos/Ameyur1/amelife/git/blobs` |
| 后台不加载 | 浏览器控制台、CDN 请求及 CSP；不要关闭 SRI 或安全校验来绕过 |
| 发布后网站不更新 | 看 Pages 最新 commit 的 build log；确认 main、npm run build、dist；不要只看旧部署 Success |
| pnpm 锁文件过期 | 新增依赖后同步 pnpm-lock.yaml；本功能没有新增 npm 依赖 |

不要把 `.dev.vars`、实际密钥或含令牌的 Network 截图发到公开仓库。本项目已忽略 `.dev.vars*` 和 `.env*`。

## 本地验证命令

```powershell
node --test tests/cms-oauth.test.mjs
npm run build
```

要运行 Pages Functions，使用 Cloudflare Wrangler：`npx wrangler pages dev dist`；`npm run preview` 只预览静态文件，不提供 OAuth 端点。生产 OAuth 被固定 origin 限制，本地/预览环境不会访问生产 OAuth。

参考：[Decap GitHub backend](https://decapcms.org/docs/github-backend/)、[Decap OAuth](https://decapcms.org/docs/backends-overview/)、[GitHub App 用户令牌](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app)、[Pages Functions 路由](https://developers.cloudflare.com/pages/functions/routing/)。
