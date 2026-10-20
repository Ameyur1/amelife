import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { handleAuth, handleCallback } from '../server/cms-oauth.js';

const require = createRequire(import.meta.url);
const { parse } = require('yaml');
const origin = 'https://amelife.pages.dev';
const env = { GITHUB_CLIENT_ID: 'Iv1.test', GITHUB_CLIENT_SECRET: 'secret-not-public', OAUTH_STATE_SECRET: 'a'.repeat(64), GITHUB_REPOSITORY_ID: '123', CMS_ALLOWED_USERS: 'Ameyur1' };
async function flow() {
  const response = await handleAuth(new Request(`${origin}/api/cms/auth?provider=github&site_id=amelife.pages.dev`), env);
  return { response, redirect: new URL(response.headers.get('Location')), cookie: response.headers.get('Set-Cookie').split(';')[0] };
}
function callback(f, state = f.redirect.searchParams.get('state')) {
  return new Request(`${origin}/api/cms/callback?code=test-code&state=${state}`, { headers: { Cookie: f.cookie } });
}
function githubMock(options = {}) {
  const calls = [];
  const fetcher = async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith('/login/oauth/access_token')) return Response.json({ access_token: 'ghu_short_lived', expires_in: 28800, refresh_token: 'ghr_never_expose', ...options.token });
    if (url.endsWith('/user')) return Response.json({ login: options.login || 'Ameyur1' });
    if (url.endsWith('/repos/Ameyur1/amelife')) return Response.json({ id: options.id || 123, permissions: { push: options.push ?? true } });
    throw Error('Unexpected request');
  };
  return { fetcher, calls };
}

test('missing secrets, wrong method, preview domain, foreign provider/site fail closed', async () => {
  assert.equal((await handleAuth(new Request(`${origin}/api/cms/auth`), {})).status, 503);
  for (const url of ['https://preview.amelife.pages.dev/api/cms/auth', `${origin}/api/cms/auth?provider=gitlab`, `${origin}/api/cms/auth?site_id=attacker.test`]) {
    assert.ok((await handleAuth(new Request(url), env)).status >= 400);
  }
  assert.equal((await handleAuth(new Request(`${origin}/api/cms/auth`, { method: 'POST' }), env)).status, 403);
});

test('authorization uses encrypted HttpOnly cookie, PKCE S256, short expiry, fixed callback', async () => {
  const f = await flow();
  assert.equal(f.response.status, 302);
  assert.equal(f.redirect.origin, 'https://github.com');
  assert.equal(f.redirect.searchParams.get('scope'), 'offline_access');
  assert.equal(f.redirect.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(f.redirect.searchParams.get('redirect_uri'), `${origin}/api/cms/callback`);
  assert.match(f.response.headers.get('Set-Cookie'), /HttpOnly; Secure; SameSite=Lax; Max-Age=600/);
  assert.ok(!f.cookie.includes(f.redirect.searchParams.get('state')));
  assert.ok(!f.redirect.href.includes(env.GITHUB_CLIENT_SECRET));
});

test('wrong, tampered, missing and expired state never exchange tokens', async () => {
  const f = await flow();
  const mock = githubMock();
  assert.equal((await handleCallback(callback(f, 'wrong'), env, mock.fetcher)).status, 403);
  assert.equal((await handleCallback(callback({ ...f, cookie: f.cookie + 'tampered' }), env, mock.fetcher)).status, 403);
  assert.equal((await handleCallback(new Request(`${origin}/api/cms/callback?code=x&state=y`), env, mock.fetcher)).status, 403);
  const now = Date.now;
  try {
    Date.now = () => now() + 601000;
    assert.equal((await handleCallback(callback(f), env, mock.fetcher)).status, 403);
  } finally { Date.now = now; }
  assert.equal(mock.calls.length, 0);
});

test('authorized writer receives only short-lived token; exchange validates PKCE/repository', async () => {
  const f = await flow();
  const mock = githubMock();
  const response = await handleCallback(callback(f), env, mock.fetcher);
  const body = await response.text();
  assert.equal(response.status, 200);
  assert.match(body, /authorization:github:success/);
  assert.match(body, /ghu_short_lived/);
  assert.ok(!body.includes('ghr_never_expose'));
  assert.ok(!body.includes(env.GITHUB_CLIENT_SECRET));
  assert.match(body, /event.source !== window.opener/);
  assert.match(response.headers.get('Set-Cookie'), /Max-Age=0/);
  assert.equal(response.headers.get('Cache-Control'), 'no-store, max-age=0');
  const params = mock.calls[0].init.body;
  const hash = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(params.get('code_verifier')))).toString('base64url');
  assert.equal(hash, f.redirect.searchParams.get('code_challenge'));
  assert.equal(params.get('repository_id'), '123');
});

for (const [name, options] of [
  ['non-allowlisted account', { login: 'stranger' }],
  ['read-only permission', { push: false }],
  ['different repository', { id: 999 }],
  ['permanent OAuth token', { token: { access_token: 'gho_permanent', expires_in: undefined } }],
  ['nonexpiring App token', { token: { expires_in: undefined } }],
  ['unexpected lifetime', { token: { expires_in: 999999 } }],
]) test(`reject ${name}`, async () => {
  const f = await flow();
  assert.equal((await handleCallback(callback(f), env, githubMock(options).fetcher)).status, 403);
});

test('upstream failure never exposes credentials or upstream error bodies', async () => {
  const f = await flow();
  const response = await handleCallback(callback(f), env, async () => { throw Error(env.GITHUB_CLIENT_SECRET); });
  assert.equal(response.status, 502);
  assert.ok(!(await response.text()).includes(env.GITHUB_CLIENT_SECRET));
});

test('CMS config uses existing paths/schema, both extensions and required defaults', () => {
  const c = parse(readFileSync('public/admin/config.yml', 'utf8'));
  assert.equal(c.backend.repo, 'Ameyur1/amelife');
  assert.equal(c.backend.branch, 'main');
  assert.equal(c.backend.api_root, 'https://amelife.pages.dev/api/github');
  assert.equal(c.backend.open_authoring, false);
  assert.equal(c.media_folder, 'public/images/posts');
  assert.equal(c.public_folder, '/images/posts');
  assert.equal(c.local_backend, undefined);
  assert.deepEqual(c.collections.map(c => c.extension), ['md', 'mdx']);
  for (const collection of c.collections) {
    assert.equal(collection.folder, 'src/content/blog');
    assert.equal(collection.slug, '{{slug}}');
    const fields = Object.fromEntries(collection.fields.map(f => [f.name, f]));
    assert.equal(fields.draft.default, false);
    assert.equal(fields.featured.default, false);
    assert.equal(fields.date.default, '{{now}}');
    assert.deepEqual(fields.category.options, ['学术', '杂谈', '日常']);
    assert.ok(new RegExp(fields.updated.pattern[0]).test('2026-10-19'));
  }
});

test('preSave handles optional fields and tags without changing custom images/MDX body', () => {
  let handler;
  const context = { window: { CMS: { registerEventListener(event) { handler = event.handler; }, registerPreviewStyle() {}, init() {} } }, document: { getElementById() { return {}; } } };
  vm.runInNewContext(readFileSync('public/admin/editor.js', 'utf8'), context);
  const map = new Map([['cover', ''], ['coverAlt', null], ['updated', '2026-10-05'], ['body', 'import Demo from "./Demo.astro";\n<Demo />'], ['tags', ['  Astro ', 'Astro', '']]]);
  map.delete = function (key) { Map.prototype.delete.call(this, key); return this; };
  const result = handler({ entry: new Map([['data', map]]) });
  assert.equal(result.has('cover'), false);
  assert.equal(result.has('coverAlt'), false);
  assert.equal(result.get('draft'), false);
  assert.equal(result.get('updated'), '2026-10-05');
  assert.equal(result.get('body'), 'import Demo from "./Demo.astro";\n<Demo />');
  assert.equal(JSON.stringify(result.get('tags')), '["Astro"]');
  result.set('cover', '/images/posts/custom.jpg');
  assert.equal(handler({ entry: new Map([['data', result]]) }).get('cover'), '/images/posts/custom.jpg');
});
