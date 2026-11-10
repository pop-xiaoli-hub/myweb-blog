# MyWeb Blog

一个用 `Next.js + Tailwind CSS + Markdown` 搭建的个人博客起点。

## 本地开发

```bash
nvm use 20.19.6
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看网站。

首次使用 AI 聊天窗口时，将 DeepSeek API Key 写入项目根目录的 `.env.local`：

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key
```

`.env.local` 不会提交到 Git，API Key 只在服务端调用 DeepSeek。

## 内容管理

文章放在 `content/posts` 目录下，每篇文章一个 `.md` 文件。

示例：

```md
---
title: "文章标题"
description: "文章简介"
date: "2026-06-04"
readingTime: "4 min read"
tags:
  - 标签1
  - 标签2
---

这里开始写正文。
```

## 已经包含

- 首页
- 博客列表页
- 文章详情页
- About 页面
- Markdown 文章支持
- 基础响应式布局

## 后续建议

- 换成你自己的站点名和介绍
- 添加头像、社交链接和项目展示
- 部署到 Vercel
- 增加评论、搜索、RSS 和 SEO 配置
