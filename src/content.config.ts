import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(), description: z.string(), date: z.coerce.date(),
    updated: z.coerce.date().optional(), cover: z.string().optional(), coverAlt: z.string().optional(),
    category: z.enum(['学术', '杂谈', '日常']), tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false), featured: z.boolean().default(false),
  }),
});
export const collections = { blog };
