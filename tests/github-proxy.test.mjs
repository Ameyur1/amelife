import test from 'node:test';
import assert from 'node:assert/strict';
import { handleGitHubProxy } from '../server/github-proxy.js';

const origin = 'https://amelife.pages.dev';
const token = 'Bearer ghu_short_lived_123';

function request(path, options = {}) {
  return new Request(`${origin}/api/github${path}`, {
    ...options,
    headers: { Authorization: token, Origin: origin, ...options.headers },
  });
}

test('proxy fails closed for foreign origins, tokens and API paths', async () => {
  const cases = [
    new Request('https://preview.pages.dev/api/github/user', { headers: { Authorization: token } }),
    new Request(`${origin}/api/github/user`, { headers: { Authorization: 'Bearer github_pat_secret' } }),
    request('/orgs/Ameyur1'),
    request('/repos/another/repository'),
    request('/user', { headers: { Origin: 'https://attacker.example' } }),
    request('/user', { method: 'OPTIONS' }),
  ];
  for (const item of cases) assert.ok((await handleGitHubProxy(item, () => { throw Error('must not fetch'); })).status >= 400);
});

test('proxy forwards Decap media upload body only to the fixed repository', async () => {
  const payload = JSON.stringify({ content: 'aGVsbG8=', encoding: 'base64' });
  let call;
  const response = await handleGitHubProxy(request('/repos/Ameyur1/amelife/git/blobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
  }), async (url, init) => {
    call = { url: String(url), init, body: await new Response(init.body).text() };
    return Response.json({ sha: 'abc123' }, { status: 201, headers: { ETag: 'etag-1' } });
  });
  assert.equal(call.url, 'https://api.github.com/repos/Ameyur1/amelife/git/blobs');
  assert.equal(call.init.method, 'POST');
  assert.equal(call.init.headers.get('Authorization'), token);
  assert.equal(call.init.headers.get('User-Agent'), 'Amelife-CMS-Proxy');
  assert.equal(call.body, payload);
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('ETag'), 'etag-1');
  assert.deepEqual(await response.json(), { sha: 'abc123' });
});

test('proxy preserves queries and GitHub errors without caching them', async () => {
  let url;
  const response = await handleGitHubProxy(request('/repos/Ameyur1/amelife/contents/src/content/blog?ref=main'), async target => {
    url = String(target);
    return Response.json({ message: 'Not Found' }, { status: 404, headers: { 'X-RateLimit-Remaining': '42' } });
  });
  assert.equal(url, 'https://api.github.com/repos/Ameyur1/amelife/contents/src/content/blog?ref=main');
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('Cache-Control'), 'no-store, max-age=0');
  assert.equal(response.headers.get('X-RateLimit-Remaining'), '42');
});

test('upstream failures do not expose token or error details', async () => {
  const response = await handleGitHubProxy(request('/user'), async () => { throw Error(token); });
  assert.equal(response.status, 502);
  assert.ok(!(await response.text()).includes(token));
});

