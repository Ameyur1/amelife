import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';
import sitemap from '@astrojs/sitemap';
import imgAttr from 'satteri-imgattr';

export default defineConfig({
  site: 'https://amelife.pages.dev/',
  output: 'static',
  integrations: [mdx(), sitemap()],
  markdown: {
    processor: satteri({
      hastPlugins: [imgAttr({ defaults: { loading: 'lazy', decoding: 'async' } })],
    }),
    shikiConfig: { theme: 'github-dark-default', wrap: true },
  },
});
