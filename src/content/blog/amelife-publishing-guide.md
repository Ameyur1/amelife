---
title: "Amelife 博客文章发布教程"
description: "从新建 Markdown 文章到推送 GitHub，并由 Cloudflare 自动更新网站的完整步骤。"
date: 2026-10-05
category: "杂谈"
tags: ["Amelife", "博客", "教程"]
cover: "/images/posts/default.jpg"
coverAlt: "文章封面说明"
draft: false
featured: false
---

这篇文章记录了 Amelife 博客的日常发布方法。完成一次部署以后，以后发布新文章只需要：**新建文章、保存、提交并推送**。

## 网站关机后还能访问吗

可以。

网站已经部署在 Cloudflare 的服务器上，不依赖自己的电脑运行。即使电脑关机，别人仍然可以通过公网地址访问网站。

只有使用下面命令启动的本地预览会随着电脑关闭而停止：

```powershell
npm run dev
```

本地预览只是写文章时检查效果用的，不是正式网站。

## 一、新建文章

打开项目文件夹：

```text
C:\Users\Ameyuri\Desktop\Amelife\网站
```

进入文章目录：

```text
src\content\blog
```

在这里新建一个以 `.md` 结尾的文件，例如：

```text
my-new-post.md
```

文件名建议使用小写英文和短横线，不要使用空格。例如：

```text
java-study-notes.md
my-weekend.md
website-update.md
```

也可以复制一篇已有文章，再修改文件名和内容。

## 二、填写文章信息

每篇文章开头都要填写文章信息。可以复制下面的模板：

```md
---
title: "文章标题"
description: "用一两句话介绍这篇文章。"
date: 2026-10-05
category: "日常"
tags: ["随笔", "生活"]
draft: false
featured: false
---

这里开始写正文。

## 第一个小标题

正文内容……

## 第二个小标题

继续写……
```

各项含义：

- `title`：文章标题。
- `description`：文章简介，会显示在文章列表和搜索结果中。
- `date`：发布日期，格式为“年-月-日”。
- `category`：文章板块，只填写“学术”“杂谈”或“日常”。
- `tags`：文章标签，可以填写多个。
- `cover`：自定义封面图片路径；不填写时，会按照文章板块自动选择默认封面。
- `coverAlt`：封面的文字说明，方便图片无法显示时识别内容。
- `coverPosition`：封面裁切焦点，例如 `"center 25%"` 会让画面更偏向图片上方。
- `draft: false`：公开发布文章。
- `draft: true`：保存为草稿，网站不会显示。
- `featured: true`：设为推荐文章。
- `featured: false`：作为普通文章发布。

## 三、自定义文章封面

如果文章没有填写 `cover`，网站会自动使用对应板块的默认封面：

- 学术：学术板块默认封面。
- 杂谈：杂谈板块默认封面。
- 日常：日常板块默认封面。

如果想让某篇文章使用独立封面，再按下面的方法设置。已经设置的自定义封面不会被板块默认封面替换。

把准备好的封面图片复制到：

```text
public\images\posts
```

图片建议使用横向的 `JPG`、`PNG` 或 `WebP` 文件，推荐尺寸为 `1600 × 900`。文件名建议使用英文，例如：

```text
my-new-post.jpg
```

然后在文章开头加入：

```yaml
cover: "/images/posts/my-new-post.jpg"
coverAlt: "这张封面的内容说明"
coverPosition: "center 25%"
```

封面会同时显示在文章列表卡片和文章正文顶部。如果没有填写 `cover`，网站会自动显示该文章所属板块的默认封面。

竖图在横向封面框中会裁掉一部分上下内容。如果人物的脸偏上，可以把 `coverPosition` 设为 `"center 20%"` 到 `"center 30%"`；数值越小，显示区域越靠近图片顶部。横图一般不需要填写这一项。

## 四、编写正文

文章正文使用 Markdown 格式。

### 正确分段

Markdown 中只按一次回车，网站通常仍会把相邻文字视为同一段。两个段落之间需要保留一个完整的空行：

```md
这是第一段文字。

这是第二段文字。
```

不要使用 Tab、全角空格或连续空格来代替分段。

### 正确插入图片

图片放在 `public\images\posts` 后，文章中只填写从 `/images/posts/` 开始的网站路径，不要填写电脑上的 `C:\Users\...` 本地路径：

```md
![图片说明](/images/posts/photo.jpg)
```

为了避免路径解析问题，图片文件名推荐使用不带空格的英文，例如 `campus-view.jpg`。

### 标题

```md
## 二级标题

### 三级标题
```

### 粗体和引用

```md
**这是粗体文字**

> 这是一段引用内容。
```

### 列表

```md
- 第一项
- 第二项
- 第三项
```

### 链接

```md
[链接文字](https://example.com)
```

### 代码

````md
```java
System.out.println("Hello, Amelife!");
```
````

## 五、本地预览

想在发布前检查文章效果，可以在项目终端运行：

```powershell
npm run dev
```

然后打开终端显示的本地网址。检查完毕后，在终端按 `Ctrl + C` 停止预览。

这一步不是必须的，确认内容没有问题也可以直接发布。

## 六、发布文章

保存文章后，打开 PowerShell，依次运行：

```powershell
$env:Path += ";C:\Users\Ameyuri\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd"
Set-Location -LiteralPath "C:\Users\Ameyuri\Desktop\Amelife\网站"
$env:HTTPS_PROXY = "http://127.0.0.1:7890"
git add .
git commit -m "Add new post"
git push
```

如果第一行运行后没有任何提示，这是正常现象。

最后看到类似下面的内容，就说明文章已经成功上传到 GitHub：

```text
main -> main
```

如果看到：

```text
Everything up-to-date
```

表示没有新的修改需要上传。请检查文章是否已经保存，以及是否在正确的项目目录中。

![图片说明](/images/posts/Snipaste_2026-10-05_13-37-40.png)



## 七、等待网站更新

推送成功后，Cloudflare 会自动获取 GitHub 上的新内容并重新构建网站，不需要再次手动连接仓库。

一般等待一到三分钟，然后刷新正式网站即可看到新文章。如果暂时没有出现，可以进入 Cloudflare Pages 查看最新一次部署是否完成。

## 日常发布流程

以后每次发文章，只需要记住下面这条流程：

```text
新建或修改 .md 文章
        ↓
保存文件
        ↓
git add .
        ↓
git commit
        ↓
git push
        ↓
等待 Cloudflare 自动更新
```

只要正式网站已经部署成功，电脑关机不会影响访客访问。
