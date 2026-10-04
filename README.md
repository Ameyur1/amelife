# Amelife

Amelife 是一个完整、可静态部署的个人主页与博客项目。它使用 Astro、TypeScript 和 Markdown / MDX，包含首页、文章、分类、标签、归档、搜索、项目、关于与 404 页面，并支持亮色 / 暗色主题。

> 当前仓库中的文章、项目、头像、背景、邮箱、站点 URL 和社交链接都是示例或占位内容，请在公开发布前替换。

## 主要技术

- Astro（静态输出）
- TypeScript
- Markdown / MDX 内容集合
- Astro Sitemap 与 RSS
- 无后端的浏览器端文章搜索
- CSS 变量主题与浏览器本地主题记忆

## 本地安装与启动

需要 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

浏览器打开终端显示的本地地址，通常是 `http://localhost:4321`。

构建与检查：

```bash
npm run build
```

预览构建结果：

```bash
npm run preview
```

## 发布一篇新文章

在 `src/content/blog/` 新建 `.md` 或 `.mdx` 文件，例如 `my-first-post.md`：

```md
---
title: "文章标题"
description: "一句话描述"
date: 2026-10-01
updated: 2026-10-02
cover: "/images/posts/my-cover.jpg"
category: "技术"
tags: ["Astro", "学习"]
draft: false
featured: false
---

这里开始写正文。
```

- `draft: true`：不会出现在网站中。
- `featured: true`：可进入首页精选文章区域。
- 文件名会成为文章 URL 的一部分，建议使用简短英文和连字符。
- 文章会自动按 `date` 从新到旧排列。

## 添加文章封面

把图片放入 `public/images/posts/`，并在文章 Frontmatter 的 `cover` 中填写以 `/images/posts/` 开头的路径。推荐使用 16:9 图片，并填写有意义的标题与描述；页面会自动生成对应 `alt` 文本。

## 修改常用网站信息

日常最常修改的内容集中在 `src/config.ts`：

- 网站名称：修改 `siteName`
- 网站简介：修改 `description` 与 `tagline`
- 站点网址：部署后把 `siteUrl` 和 `astro.config.mjs` 中的 `site` 改为真实网址
- 导航：修改 `navigation`
- 社交链接：修改 `socialLinks`
- 页脚文案：修改 `footer`
- 默认主题设置：修改 `theme.defaultMode`（主题按钮的选择会保存在浏览器）

### 修改头像

替换 `public/images/avatars/avatar-placeholder.png`，或在 `src/config.ts` 修改 `avatar` 路径。建议使用正方形图片。

### 修改背景

背景设置位于 `src/config.ts` 的 `backgrounds`：

- `light`：亮色模式背景
- `dark`：暗色模式背景
- `overlayLight` / `overlayDark`：保障文字可读性的遮罩

直接替换 `public/images/backgrounds/amelife-dawn.png` 也可以保持配置不变。未来可在首页背景组件附近扩展随机背景、每日背景、分页面背景或视频背景，无需改动文章系统。

### 修改配色

全站颜色、圆角、阴影等设计变量位于 `src/styles/global.css` 顶部的 `:root` 与 `:root[data-theme=dark]`。`src/config.ts` 中的 `theme` 是站点级语义配置；如需真正修改视觉配色，请同步调整 CSS 变量。

## 增加或修改项目

项目数据集中在 `src/data/projects.ts`。按现有对象结构新增一项即可。项目图片放入 `public/images/projects/`。示例项目的 GitHub 和 Demo 链接目前为 `#`，公开前应替换或删除。

## 图片目录

```text
public/images/
├── avatars/       # 头像
├── backgrounds/   # 首页背景
├── posts/         # 文章封面与正文图片
└── projects/      # 项目图片
```

Markdown 正文图片使用标准语法：

```md
![图片说明](/images/posts/example.jpg)
```

## 部署到 GitHub

1. 在 GitHub 新建一个空仓库，不要自动创建 README。
2. 在本项目目录执行：

```bash
git init
git add .
git commit -m "Initial Amelife site"
git branch -M main
git remote add origin 你的仓库地址
git push -u origin main
```

请不要把“你的仓库地址”原样执行；需要替换为 GitHub 提供的地址。

## 部署到 Cloudflare Pages

1. 登录 Cloudflare Dashboard，进入 **Workers & Pages**。
2. 创建 Pages 项目并连接上面的 GitHub 仓库。
3. Framework preset 选择 `Astro`。
4. Build command 填 `npm run build`。
5. Build output directory 填 `dist`。
6. 保存并部署。以后推送到 `main` 分支会自动重新构建。

这个项目是纯静态站点，不需要 VPS、数据库或服务器环境变量。

## 绑定自己的域名

在 Cloudflare Pages 项目的 **Custom domains** 中添加域名，并按界面提示配置 DNS。绑定成功后：

1. 把 `astro.config.mjs` 中的 `site` 改为正式域名（包含 `https://`）。
2. 把 `src/config.ts` 中的 `siteUrl` 改为同一个地址。
3. 重新提交并部署，以生成正确的 canonical、Sitemap、RSS 与分享链接。

## 当前占位值与示例数据

- `https://example.com`：站点网址占位值
- `hello@example.com`：邮箱占位值
- GitHub 首页链接：尚未指定用户名
- `src/content/blog/` 中的三篇文章：示例内容
- `src/data/projects.ts` 中的三个项目：示例项目
- `public/images/avatars/avatar-placeholder.png`：生成的抽象示例头像
- `public/images/backgrounds/amelife-dawn.png`：生成的示例背景
- 文章封面和项目插图：示例素材

## 目录结构

```text
src/
├── components/       # 导航、页脚、文章卡片等
├── content/blog/     # Markdown / MDX 文章
├── data/             # 项目数据
├── layouts/          # 页面公共布局与 SEO
├── pages/            # 路由页面
├── styles/           # 全局样式与主题
├── utils/            # 文章排序、日期、阅读时间
├── config.ts         # 高频网站配置
└── content.config.ts # 文章字段规则
public/images/        # 集中管理的图片资源
```

## 当前没有实现的功能

- 评论系统（文章页已预留位置）
- 登录、后台与数据库
- 视频、随机或每日背景
- 服务端全文检索（当前搜索标题、描述、分类和标签）
- 真实 GitHub 用户名、个人姓名、正式域名与社交账号

这些限制符合当前的静态、易维护目标。
