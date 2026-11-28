const textFields = ['title', 'description', 'cover', 'coverAlt', 'coverPosition'];
const knownFields = new Set([...textFields, 'date', 'updated', 'category', 'tags', 'draft', 'featured']);

function localDate(now) {
  const pad = number => String(number).padStart(2, '0');
  return [now.getFullYear(), pad(now.getMonth() + 1), pad(now.getDate())].join('-');
}

export function parseMarkdown(fileName, source, yaml, now = new Date()) {
  let body = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  if (body.includes('\0')) throw new Error('请选择 UTF-8 编码的 Markdown 文本。');
  let meta = {};
  if (/^---[ \t]*(?:\n|$)/.test(body)) {
    const lines = body.split('\n');
    const end = lines.findIndex((line, i) => i > 0 && /^(?:---|\.\.\.)[ \t]*$/.test(line));
    if (end < 0) throw new Error('文件开头的 Frontmatter 缺少结束行 ---。');
    if (!yaml) throw new Error('YAML 解析器加载失败，请刷新后台后重试。');
    meta = yaml.load(lines.slice(1, end).join('\n'), { schema: yaml.JSON_SCHEMA }) ?? {};
    if (typeof meta !== 'object' || Array.isArray(meta)) throw new Error('Frontmatter 需要使用“字段: 值”的格式。');
    body = lines.slice(end + 1).join('\n');
  }
  if (!body.trim()) throw new Error('文件里没有文章正文。');
  const unknown = Object.keys(meta).filter(key => !knownFields.has(key));
  if (unknown.length) throw new Error('后台无法导入以下字段：' + unknown.join('、'));
  for (const key of textFields) {
    if (meta[key] != null && typeof meta[key] !== 'string') throw new Error(key + ' 必须是文本。');
  }
  for (const key of ['draft', 'featured']) {
    if (key in meta && typeof meta[key] !== 'boolean') throw new Error(key + ' 请填写 true 或 false。');
  }
  for (const key of ['date', 'updated']) {
    if (meta[key] == null || meta[key] === '') continue;
    const day = new Date(meta[key] + 'T00:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meta[key]) || !Number.isFinite(+day) || day.toISOString().slice(0, 10) !== meta[key]) {
      throw new Error(key + ' 请使用有效的 YYYY-MM-DD 日期。');
    }
  }
  const category = meta.category ?? '日常';
  if (!['学术', '杂谈', '日常'].includes(category)) throw new Error('分类请选择学术、杂谈或日常。');
  const tags = meta.tags ?? [];
  if (!Array.isArray(tags) || !tags.every(tag => typeof tag === 'string')) throw new Error('tags 请使用文本数组，例如 [学习, 随笔]。');
  return {
    title: meta.title?.trim() || body.match(/^#\s+([^\n]+)/m)?.[1].trim() || fileName.replace(/\.md$/i, ''),
    description: meta.description ?? '', date: meta.date || localDate(now),
    updated: meta.updated || '', category, tags, draft: meta.draft ?? false, featured: meta.featured ?? false,
    cover: meta.cover ?? '', coverAlt: meta.coverAlt ?? '', coverPosition: meta.coverPosition ?? '', body,
  };
}
