/* All validation here is editorial convenience; GitHub enforces write permission. */
(() => {
  const status = document.getElementById('admin-status');
  if (!window.CMS) {
    status.textContent = '编辑器加载失败。请刷新页面，或检查 cdn.jsdelivr.net 是否可访问。';
    return;
  }

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

  window.CMS.registerPreviewStyle('/admin/preview.css');
  window.CMS.init();
  status.hidden = true;
})();
