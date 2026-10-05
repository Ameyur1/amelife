import type { CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;
const categoryCovers: Record<BlogPost['data']['category'], string> = {
  学术: '/images/posts/category-academic.jpg',
  杂谈: '/images/posts/category-essay.jpg',
  日常: '/images/posts/category-daily.jpeg',
};
const categoryCoverPositions: Record<BlogPost['data']['category'], string> = {
  学术: 'center 25%',
  杂谈: 'center 42%',
  日常: 'center 24%',
};

export const getPostCover = (post: BlogPost) => post.data.cover ?? categoryCovers[post.data.category];
export const getPostCoverPosition = (post: BlogPost) => post.data.coverPosition ?? (post.data.cover ? 'center' : categoryCoverPositions[post.data.category]);
export const sortPosts = (posts: BlogPost[]) => posts.filter((p) => !p.data.draft).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
export const formatDate = (date: Date) => new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
export const readingTime = (body = '') => Math.max(1, Math.ceil(body.replace(/[#>*_`\-\[\]()]/g, '').length / 400));
export const slugify = (value: string) => encodeURIComponent(value);
