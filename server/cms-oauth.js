// Pages Functions only. Never import this module into client code.
const ORIGIN = 'https://amelife.pages.dev';
const REPO = 'Ameyur1/amelife';
const COOKIE = '__Host-amelife-oauth';
const TTL = 600;
const encoder = new TextEncoder();

function base64url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function unbase64url(text) {
  return Uint8Array.from(atob(text.replaceAll('-', '+').replaceAll('_', '/')), char => char.charCodeAt(0));
}

function random(size = 32) {
  return base64url(crypto.getRandomValues(new Uint8Array(size)));
}

async function key(secret) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), 'HKDF', false, ['deriveKey']).then(material =>
    crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: encoder.encode(ORIGIN), info: encoder.encode(COOKIE) }, material,
      { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']));
}

async function seal(data, secret) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(secret), encoder.encode(JSON.stringify(data)));
  return `${base64url(iv)}.${base64url(encrypted)}`;
}

async function unseal(value, secret) {
  const [iv, data] = value.split('.');
  const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unbase64url(iv) }, await key(secret), unbase64url(data));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function cookie(value, maxAge = TTL) {
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function headers() {
  return {
    'Cache-Control': 'no-store, max-age=0',
    Pragma: 'no-cache',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };
}

function failure(status, message) {
  return new Response(message, { status, headers: { ...headers(), 'Content-Type': 'text/plain; charset=utf-8', 'Set-Cookie': cookie('', 0) } });
}

function validEnvironment(env) {
  return env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET &&
    typeof env.OAUTH_STATE_SECRET === 'string' && env.OAUTH_STATE_SECRET.length >= 32 &&
    /^\d+$/.test(env.GITHUB_REPOSITORY_ID || '');
}

function requestAllowed(request) {
  return request.method === 'GET' && new URL(request.url).origin === ORIGIN;
}

export async function handleAuth(request, env) {
  if (!requestAllowed(request)) return failure(403, '仅支持从正式网站登录。');
  if (!validEnvironment(env)) return failure(503, '后台登录尚未配置，请按 docs/admin-guide.md 设置 GitHub App 和 Cloudflare Secrets。');
  const url = new URL(request.url);
  if ((url.searchParams.get('provider') || 'github') !== 'github') return failure(400, '不支持的登录方式。');
  if (url.searchParams.has('site_id') && url.searchParams.get('site_id') !== new URL(ORIGIN).hostname) return failure(400, '后台域名不匹配。');
  const state = random();
  const verifier = random(48);
  const challenge = base64url(await crypto.subtle.digest('SHA-256', encoder.encode(verifier)));
  const auth = new URL('https://github.com/login/oauth/authorize');
  auth.search = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID, redirect_uri: `${ORIGIN}/api/cms/callback`,
    state, code_challenge: challenge, code_challenge_method: 'S256',
    scope: 'offline_access', allow_signup: 'false',
  }).toString();
  const value = await seal({ state, verifier, created: Date.now() }, env.OAUTH_STATE_SECRET);
  return new Response(null, { status: 302, headers: { ...headers(), Location: auth.href, 'Set-Cookie': cookie(value) } });
}

async function github(path, token, fetcher) {
  const response = await fetcher(`https://api.github.com${path}`, {
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`,
      'User-Agent': 'Amelife-CMS', 'X-GitHub-Api-Version': '2022-11-28' },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('github_access_denied');
  return response.json();
}

// Decap's documented popup protocol, restricted to our exact opener and origin.
function success(token, expires) {
  const nonce = random();
  const payload = JSON.stringify(`authorization:github:success:${JSON.stringify({ token, provider: 'github', expires_in: expires })}`)
    .replaceAll('<', '\\u003c');
  const html = `<!doctype html><html lang="zh-CN"><meta charset="UTF-8"><title>Amelife 登录</title>
<body><p>验证通过，正在返回文章管理。若窗口未关闭，请关闭此窗口并重新登录。</p>
<script nonce="${nonce}">
const target = ${JSON.stringify(ORIGIN)};
if (window.opener) {
  const receive = (event) => {
    if (event.origin !== target || event.source !== window.opener || event.data !== 'authorizing:github') return;
    window.removeEventListener('message', receive);
    window.opener.postMessage(${payload}, target);
    window.close();
  };
  window.addEventListener('message', receive);
  window.opener.postMessage('authorizing:github', target);
}
</script></body></html>`;
  return new Response(html, { headers: { ...headers(), 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': cookie('', 0),
    'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'` } });
}

export async function handleCallback(request, env, fetcher = fetch) {
  if (!requestAllowed(request)) return failure(403, '仅支持从正式网站登录。');
  if (!validEnvironment(env)) return failure(503, '后台认证配置不完整。');
  const url = new URL(request.url);
  if (url.searchParams.has('error')) return failure(403, 'GitHub 授权已取消或被拒绝，请关闭窗口后重新登录。');
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  const stored = (request.headers.get('Cookie') || '').split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!state || !code || !stored) return failure(403, '登录校验失败：缺少 state、code 或安全 Cookie，请重新登录。');
  let flow;
  try {
    flow = await unseal(stored, env.OAUTH_STATE_SECRET);
    const age = Date.now() - flow.created;
    if (flow.state !== state || !Number.isFinite(age) || age < 0 || age > TTL * 1000) throw new Error('invalid_state');
  } catch {
    return failure(403, '登录已过期或校验失败，请重新登录。');
  }

  try {
    const exchange = await fetcher('https://github.com/login/oauth/access_token', {
      method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET,
        code, redirect_uri: `${ORIGIN}/api/cms/callback`, code_verifier: flow.verifier, repository_id: env.GITHUB_REPOSITORY_ID }),
      signal: AbortSignal.timeout(15000),
    });
    if (!exchange.ok) return failure(502, 'GitHub 认证服务暂不可用，请重试。');
    const data = await exchange.json();
    // Ordinary OAuth App tokens never expire. Fail closed rather than exposing one.
    if (data.error || !data.access_token?.startsWith('ghu_') || !Number.isFinite(data.expires_in) || data.expires_in <= 0 || data.expires_in > 28800) {
      return failure(403, '需要 GitHub App 的短期用户令牌。请检查是否误建为 OAuth App，或关闭了令牌过期。');
    }
    const user = await github('/user', data.access_token, fetcher);
    const allowed = (env.CMS_ALLOWED_USERS || 'Ameyur1').split(',').map(login => login.trim().toLowerCase()).filter(Boolean);
    if (!allowed.includes(String(user.login).toLowerCase())) return failure(403, '此 GitHub 账号不在后台允许名单中。');
    const repo = await github(`/repos/${REPO}`, data.access_token, fetcher);
    if (String(repo.id) !== env.GITHUB_REPOSITORY_ID || repo.permissions?.push !== true) return failure(403, '此账号或 GitHub App 没有目标仓库的写入权限。');
    // Deliberately discard refresh_token. Browser receives only an expiring token.
    return success(data.access_token, data.expires_in);
  } catch {
    // Never return GitHub bodies, authorization codes, tokens, or secrets in errors.
    return failure(502, '无法完成 GitHub 权限验证，请检查 App 安装范围及网络后重新登录。');
  }
}
