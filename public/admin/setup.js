window.CMS_MANUAL_INIT = true;

// The previous configuration forced raw mode, which disables every toolbar
// action. Select visual mode once after this migration; later user choices are
// preserved by Decap in its own cms.md-mode key.
const editorModeMigration = 'amelife-cms-editor-mode-v2';
if (localStorage.getItem(editorModeMigration) !== 'done') {
  localStorage.setItem('cms.md-mode', 'rich_text');
  localStorage.setItem(editorModeMigration, 'done');
}
