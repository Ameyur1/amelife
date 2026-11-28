import test from 'node:test';
import assert from 'node:assert/strict';
import yaml from 'js-yaml';
import { parseMarkdown } from '../public/admin/parse-md.js';

test('plain Markdown preserves body and assigns local publishing defaults', () => {
  const body = '![图](https://example.org/a.jpg)\n\n```js\nx < y\n```';
  const post = parseMarkdown('我的笔记.MD', body, yaml, new Date(2026, 10, 28));
  assert.equal(post.title, '我的笔记');
  assert.equal(post.body, body);
  assert.equal(post.date, '2026-11-28');
  assert.equal(post.category, '日常');
  assert.equal(post.draft, false);
});

test('imports YAML and Windows line endings without losing draft or formula source', () => {
  const source = '\uFEFF---\r\ntitle: 测试\r\ndate: 2026-11-27\r\ndraft: true\r\ntags: [数学]\r\n---\r\n$$\r\nx^2\r\n$$';
  const post = parseMarkdown('test.md', source, yaml);
  assert.equal(post.title, '测试');
  assert.equal(post.date, '2026-11-27');
  assert.equal(post.draft, true);
  assert.deepEqual(post.tags, ['数学']);
  assert.equal(post.body, '$$\nx^2\n$$');
});

test('rejects malformed metadata before filling any field', () => {
  for (const metadata of ['draft: "false"', 'date: 2026-02-30', 'tags: hello', 'category: 未知']) {
    assert.throws(() => parseMarkdown('test.md', '---\n' + metadata + '\n---\n正文', yaml));
  }
});
