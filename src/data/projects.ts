export type Project = { name: string; description: string; image: string; stack: string[]; github: string; demo: string; status: string; sample: boolean };

export const projects: Project[] = [
  { name: '日常碎片', description: '一个用于收集每日灵感与照片的轻量网页实验。', image: '/images/projects/project-notes.svg', stack: ['Astro', 'TypeScript', 'CSS'], github: '#', demo: '#', status: '示例 · 构思中', sample: true },
  { name: '学习路径图', description: '把零散学习笔记整理成可浏览知识地图的示例项目。', image: '/images/projects/project-map.svg', stack: ['MDX', 'SVG', 'Cloudflare'], github: '#', demo: '#', status: '示例 · 进行中', sample: true },
  { name: '周末电台', description: '整理音乐、书和电影的小型数字收藏夹。', image: '/images/projects/project-radio.svg', stack: ['Astro', 'Web Audio'], github: '#', demo: '#', status: '示例 · 已归档', sample: true },
];
