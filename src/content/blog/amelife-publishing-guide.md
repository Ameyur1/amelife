---
title: "Amelife 博客文章发布教程"
description: "使用可视化后台创建、预览和发布文章，并通过 GitHub 与 Cloudflare Pages 自动更新网站。"
date: 2026-10-05
updated: 2026-10-20
category: "杂谈"
tags: ["Amelife", "博客", "教程"]
cover: "/images/posts/default.jpg"
coverAlt: "Amelife 博客文章发布教程封面"
draft: false
featured: false
typora-root-url: ./..\..\..\public
---

Amelife 已经加入可视化文章管理后台。以后发布文章不必手动编写 Frontmatter，也不必在终端运行 Git 命令。后台会把文章和图片提交到 GitHub，再由 Cloudflare Pages 自动更新网站。

后台入口：[https://amelife.pages.dev/admin/](https://amelife.pages.dev/admin/)

## 网站关机后还能访问吗

可以。网站运行在 Cloudflare Pages 上，不依赖自己的电脑。即使电脑关机，访客仍然可以正常访问。

本地执行 `npm run dev` 启动的只是预览服务，关闭电脑或终端后会停止，但不会影响正式网站。

## 一、登录文章后台

打开后台入口，点击“使用 GitHub 登录”，再使用获准管理仓库的 GitHub 账号完成授权。

后台页面对所有人都可以打开，但只有允许名单中、同时具有仓库写入权限的账号才能修改文章。登录令牌会过期，过期后重新登录即可。

如果看到“后台登录尚未配置”的提示，说明 GitHub App 或 Cloudflare Secrets 尚未完成设置，需要先由网站管理员完成一次性配置。

## 二、新建文章

登录后选择“文章（Markdown）”，再点击“新建文章”。一般文章都使用 Markdown；只有正文确实需要 JSX 或 Astro 组件时才选择“文章（MDX）”。

填写下面的内容：

- **标题**：文章页面和列表中显示的名称。
- **文章简介**：显示在文章卡片、搜索结果和页面摘要中。
- **发布日期**：默认是当天，也可以手动修改。
- **分类**：只能选择“学术”“杂谈”或“日常”。
- **标签**：输入一个标签后按回车，可以添加多个。
- **草稿**：默认关闭。开启后文章仍会保存到 GitHub，但不会出现在网站上。
- **精选**：默认关闭。开启后文章可以进入首页精选区域。
- **自定义封面**：可选；留空时使用该分类的默认封面。
- **正文**：使用 Markdown 编写，右侧可以实时预览。

后台会自动生成类似下面的 Frontmatter：

```yaml
---
title: "文章标题"
description: "用一两句话介绍这篇文章。"
date: 2026-10-20
category: "日常"
tags:
  - 随笔
  - 生活
draft: false
featured: false
---
```

新文章文件名会由标题生成，发布日期以 Frontmatter 中的 `date` 为准。创建后修改标题不会主动更改文件名，因此已有文章链接不会因为改标题而失效。

## 三、编写 Markdown 正文

### 分段

两个段落之间保留一个空行：

```md
这是第一段文字。

这是第二段文字。
```

### 标题

```md
## 二级标题

### 三级标题
```

### 粗体、引用和列表

```md
**这是粗体文字**

> 这是一段引用内容。

- 第一项
- 第二项
```

### 链接和代码

````md
[链接文字](https://example.com)

```java
System.out.println("Hello, Amelife!");
```
````

普通 Markdown 文章提供实时预览。MDX 可以保留 import、JSX 和组件代码，但后台不会执行这些组件，因此复杂 MDX 发布前仍建议在本地运行 `npm run dev` 检查。

## 四、上传图片

在封面字段或 Markdown 编辑器中选择图片并上传。后台会把图片保存到仓库的：

```text
public/images/posts
```

正文中的公开路径会自动使用：

```md
![图片说明](/images/posts/example.jpg)
```

图片建议使用 `JPG`、`PNG` 或 `WebP`。尽量使用简短、没有空格的文件名，并填写能说明画面内容的替代文字。

自定义封面还可以填写：

- `coverAlt`：图片内容说明。
- `coverPosition`：封面裁切焦点，例如 `center 25%`。

留空自定义封面时，网站会继续使用“学术”“杂谈”或“日常”对应的默认封面。

## 五、发布文章

完成编辑后点击“发布”或“立即发布”。后台会：

1. 生成 YAML Frontmatter 和 Markdown 文件。
2. 把文章及新上传的图片提交到 GitHub 的 `main` 分支。
3. 触发现有的 Cloudflare Pages 构建。
4. 构建成功后更新正式网站。

GitHub 显示保存成功只代表内容已经提交。通常还需要等待一到三分钟，让 Cloudflare 完成构建；如果文章没有出现，应检查最新一次 Pages 部署是否成功。

## 六、编辑、草稿与删除

### 编辑已有文章

从文章列表打开内容，修改后再次发布即可。后台会更新原来的 Markdown 文件，不会主动修改文章路径。

### 保存草稿

打开“草稿（网站隐藏）”后发布，会写入 `draft: true`。下一次构建完成后，这篇文章不会生成公开页面，也不会出现在首页、文章列表、分类、标签、搜索或 RSS 中。

草稿只是网站显示规则，不是保密功能。仓库是公开的，因此不要在草稿里保存密码、令牌或私人资料。

### 删除文章

打开文章后选择删除并确认。Cloudflare 完成下一次部署后，文章页面会返回 404。误删时可以从 GitHub 提交历史恢复文件。

## 七、仍然可以手动发布

可视化后台不会限制原来的工作方式。需要批量修改、编写复杂 MDX 或在本地检查完整页面时，仍可直接编辑：

```text
C:\Users\Ameyuri\Desktop\Amelife\网站\src\content\blog
```

发布前运行：

```powershell
npm run build
```

确认构建成功后，只提交本次需要的文件：

```powershell
git add src/content/blog/文章文件.md public/images/posts/相关图片.jpg
git commit -m "Add new post"
git push origin main
```

不要习惯性运行 `git add .`，这样可以避免把临时文件或无关修改一起提交。开始本地编辑前先执行 `git pull --ff-only`，取回后台最新发布的内容，减少冲突。

## 日常发布流程

```text
打开 /admin/
      ↓
登录 GitHub
      ↓
新建或编辑文章
      ↓
填写信息、上传图片、预览 Markdown
      ↓
点击发布
      ↓
等待 Cloudflare Pages 自动更新
```

完成这些步骤后，电脑可以正常关机，正式网站会继续运行。
