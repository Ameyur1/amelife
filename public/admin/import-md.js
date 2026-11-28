import { parseMarkdown } from './parse-md.js';

const panel = document.querySelector('#md-import');
const input = document.querySelector('#md-file');
const button = document.querySelector('#md-choose');
const feedback = document.querySelector('#md-feedback');
const isNewPost = () => location.hash.split('?')[0] === '#/collections/posts/new';
let busy = false;
let routeVersion = 0;

function showPanel() {
  routeVersion++;
  panel.hidden = !isNewPost();
  feedback.textContent = '';
  delete panel.dataset.dragging;
}

async function importFile(files) {
  if (busy || !isNewPost()) return;
  busy = true;
  button.disabled = true;
  const started = routeVersion;
  try {
    if (files.length !== 1 || !/\.md$/i.test(files[0].name)) throw new Error('请一次选择一个 .md 文件。');
    const file = files[0];
    const source = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
    const fields = parseMarkdown(file.name, source, window.jsyaml);
    if (!isNewPost() || started !== routeVersion) return;
    const editor = window.CMS?.editor;
    const entry = editor?.getCurrentEntry();
    if (!entry?.newRecord || entry.collection !== 'posts') throw new Error('请登录并等待新文章编辑器加载后再导入。');
    if (entry.hasChanged && !window.confirm('用文件内容替换当前新文章表单中已填写的内容？')) return;
    const patches = Object.entries(fields).map(([path, value]) => ({ path, value }));
    const result = editor.applyFieldPatch(patches);
    if (result.rejected.length) throw new Error('请检查未能填入的字段：' + result.rejected.map(item => item.path).join('、'));
    feedback.textContent = '已导入 ' + file.name + '。核对后点击“发布”。';
  } catch (error) {
    feedback.textContent = error.message;
  } finally {
    input.value = '';
    busy = false;
    button.disabled = false;
  }
}

button.addEventListener('click', () => input.click());
input.addEventListener('change', () => importFile(input.files));
panel.addEventListener('dragover', event => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
  panel.dataset.dragging = '';
});
panel.addEventListener('dragleave', () => { delete panel.dataset.dragging; });
panel.addEventListener('drop', event => {
  event.preventDefault();
  delete panel.dataset.dragging;
  importFile(event.dataTransfer.files);
});
window.addEventListener('hashchange', showPanel);
showPanel();
