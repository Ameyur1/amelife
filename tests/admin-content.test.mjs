// Integration build in a temporary project: never writes test posts into the blog.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, writeFile, readFile, readdir, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('new CMS Markdown/MDX render; draft has no public route/index; existing links/text unchanged', { timeout: 120000 }, async () => {
  const root = process.cwd();
  const temp = await mkdtemp(join(tmpdir(), 'amelife-cms-content-'));
  try {
    for (const path of ['src', 'public', 'astro.config.mjs', 'package.json', 'tsconfig.json']) await cp(join(root, path), join(temp, path), { recursive: true });
    await symlink(join(root, 'node_modules'), join(temp, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
    const meta = (title, draft, description = 'CMS integration fixture') => `---\ntitle: ${title}\n${description == null ? '' : `description: ${description}\n`}date: 2026-10-19\ncategory: 学术\ntags: [cms-unique-fixture]\ndraft: ${draft}\nfeatured: false\n---\n\n`;
    const folder = join(temp, 'src/content/blog');
    await writeFile(join(folder, 'cms-visible-fixture.md'), meta('CMS published fixture', false, null) + '# Heading\n\nInline $E = mc^2$.\n\n$$\n\\int_0^1 x^2 dx\n$$\n\n![alt](/images/posts/default.jpg)\n\n```ts\nconst x: number = 1;\n```\n');
    await writeFile(join(folder, 'cms-hidden-fixture.md'), meta('CMS hidden fixture', true) + '# Hidden\n\nSECRET_FIXTURE_DO_NOT_PUBLISH\n');
    await writeFile(join(folder, 'cms-mdx-fixture.mdx'), meta('CMS MDX fixture', false) + 'export const count = 3;\n\n## MDX heading\n\n<span data-cms-mdx>{count}</span>\n');
    const pkg = JSON.parse(await readFile(join(root, 'node_modules/astro/package.json'), 'utf8'));
    const cli = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin.astro;
    const run = spawnSync(process.execPath, [join(root, 'node_modules/astro', cli), 'build'], { cwd: temp, encoding: 'utf8', timeout: 90000 });
    assert.equal(run.status, 0, run.stdout + run.stderr);
    const posts = await readdir(join(temp, 'dist/posts'));
    assert.ok(posts.includes('cms-visible-fixture'));
    assert.ok(posts.includes('cms-mdx-fixture'));
    assert.ok(!posts.includes('cms-hidden-fixture'));
    const generated = await readFile(join(temp, 'dist/posts/cms-visible-fixture/index.html'), 'utf8');
    assert.match(generated, /loading="lazy"/);
    assert.match(generated, /astro-code/);
    assert.match(generated, /class="language-math math-inline"/);
    assert.match(generated, /class="language-math math-display"/);
    assert.match(await readFile(join(temp, 'dist/posts/cms-mdx-fixture/index.html'), 'utf8'), /data-cms-mdx[^>]*>3</);
    for (const path of ['index.html', 'posts/index.html', 'archive/index.html', 'search/index.html', 'rss.xml', 'sitemap-0.xml']) {
      const html = await readFile(join(temp, 'dist', path), 'utf8');
      assert.ok(!html.includes('cms-hidden-fixture') && !html.includes('SECRET_FIXTURE_DO_NOT_PUBLISH'), path);
    }
    // Check existing routes and their full body text against the baseline build.
    const prior = (await readdir(join(root, 'dist/posts'), { withFileTypes: true })).filter(d => d.isDirectory()).map(d => d.name);
    assert.ok(prior.length >= 11);
    for (const slug of prior) {
      const oldHtml = await readFile(join(root, 'dist/posts', slug, 'index.html'), 'utf8');
      const newHtml = await readFile(join(temp, 'dist/posts', slug, 'index.html'), 'utf8');
      const body = html => html.match(/<div class="prose">([\s\S]*?)<div class="tag-row">/)[1];
      assert.equal(body(newHtml), body(oldHtml), slug);
    }
    console.log(`Verified ${prior.length} unchanged article URLs and bodies, Markdown, MDX, highlighting, images and hidden draft.`);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
