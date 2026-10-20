// Pages Functions only. This same-origin proxy avoids browser/network failures
// when Decap uploads binary data to GitHub's API. It never stores access tokens.
const ORIGIN = 'https://amelife.pages.dev';
const GITHUB_API = 'https://api.github.com';
const REPOSITORY_PREFIX = '/repos/Ameyur1/amelife';

const responseHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

function failure(status, message) {
  return new Response(message, {
    status,
    headers: { ...responseHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

function allowedPath(pathname) {
  return pathname === '/user' || pathname === REPOSITORY_PREFIX || pathname.startsWith(`${REPOSITORY_PREFIX}/`);
}

function allowedRequest(request, pathname) {
  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].includes(request.method)) return false;
  if (!allowedPath(pathname)) return false;
  const authorization = request.headers.get('Authorization') || '';
  if (!/^(?:Bearer|token) ghu_[A-Za-z0-9_]+$/.test(authorization)) return false;
  const origin = request.headers.get('Origin');
  if (origin && origin !== ORIGIN) return false;
  const referer = request.headers.get('Referer');
  if (referer) {
    try {
      if (new URL(referer).origin !== ORIGIN) return false;
    } catch {
      return false;
    }
  }
  return true;
}

function upstreamHeaders(request) {
  const headers = new Headers({
    Accept: request.headers.get('Accept') || 'application/vnd.github+json',
    Authorization: request.headers.get('Authorization'),
    'User-Agent': 'Amelife-CMS-Proxy',
    'X-GitHub-Api-Version': '2022-11-28',
  });
  for (const name of ['Content-Type', 'If-Match', 'If-None-Match', 'If-Modified-Since']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

function downstreamHeaders(upstream) {
  const headers = new Headers(responseHeaders);
  for (const name of ['Content-Type', 'ETag', 'Last-Modified', 'Link', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

export async function handleGitHubProxy(request, fetcher = fetch) {
  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== ORIGIN) return failure(403, '仅支持正式网站的后台请求。');
  const marker = '/api/github';
  if (!requestUrl.pathname.startsWith(`${marker}/`)) return failure(404, 'GitHub API 路径不存在。');
  const pathname = requestUrl.pathname.slice(marker.length);
  if (!allowedRequest(request, pathname)) return failure(403, '此 GitHub API 请求不被允许。');

  const target = new URL(`${GITHUB_API}${pathname}`);
  target.search = requestUrl.search;
  try {
    const upstream = await fetcher(target, {
      method: request.method,
      headers: upstreamHeaders(request),
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      redirect: 'manual',
      signal: AbortSignal.timeout(60000),
    });
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: downstreamHeaders(upstream),
    });
  } catch {
    return failure(502, 'GitHub API 暂时不可用，请稍后重试。');
  }
}

