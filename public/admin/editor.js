/* All validation here is editorial convenience; GitHub enforces write permission. */
(() => {
  const status = document.getElementById('admin-status');
  if (!window.CMS) {
    status.textContent = '编辑器加载失败。请刷新页面，或检查 cdn.jsdelivr.net 是否可访问。';
    return;
  }

  window.CMS.registerEditorComponent({
    id: 'math',
    label: '公式',
    fields: [
      { name: 'formula', label: 'LaTeX 公式', widget: 'text', hint: '例如：E = mc^2 或 \\frac{a}{b}' },
      { name: 'display', label: '独立成行', widget: 'boolean', default: true },
    ],
    pattern: /^(?:\$\$\n([\s\S]+?)\n\$\$|\$([^$\n]+)\$)$/,
    fromBlock(match) {
      return { formula: match[1] ?? match[2] ?? '', display: Boolean(match[1]) };
    },
    toBlock({ formula = '', display = true }) {
      const value = String(formula).trim();
      return display ? `$$\n${value}\n$$` : `$${value}$`;
    },
    toPreview({ formula = '', display = true }) {
      const value = String(formula).trim();
      if (!window.katex) return `<code>${value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</code>`;
      return window.katex.renderToString(value, { displayMode: Boolean(display), throwOnError: false, strict: 'warn' });
    },
  });

  window.CMS.registerEventListener({
    name: 'preSave',
    handler: ({ entry }) => {
      let data = entry.get('data');
      for (const field of ['updated', 'cover', 'coverAlt', 'coverPosition']) {
        const value = data.get(field);
        if (value == null || (typeof value === 'string' && !value.trim())) data = data.delete(field);
      }
      if (data.get('draft') == null) data = data.set('draft', false);
      if (data.get('featured') == null) data = data.set('featured', false);
      const tags = data.get('tags');
      const values = tags?.toArray ? tags.toArray() : (Array.isArray(tags) ? tags : []);
      data = data.set('tags', [...new Set(values.map(tag => String(tag).trim()).filter(Boolean))]);
      return data;
    },
  });

  // Preview runs in its own iframe, so it cannot inherit KaTeX styles from index.html.
  window.CMS.registerPreviewStyle('https://cdn.jsdelivr.net/npm/katex@0.19.1/dist/katex.min.css');
  window.CMS.registerPreviewStyle('/admin/preview.css');
  window.CMS.init();
  status.hidden = true;
})();
