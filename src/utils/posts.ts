import type { CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;
export const sortPosts = (posts: BlogPost[]) => posts.filter((p) => !p.data.draft).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
export const formatDate = (date: Date) => new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
export const readingTime = (body = '') => Math.max(1, Math.ceil(body.replace(/[#>*_`\-\[\]()]/g, '').length / 400));
export const slugify = (value: string) => encodeURIComponent(value);
