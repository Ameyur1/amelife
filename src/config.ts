export const siteConfig = {
  siteName: 'Amelife',
  author: 'Ameyur1',
  description: '记录生活、学习、技术与持续发生的小事。',
  tagline: '隱約雷鳴，陰霾天空',
  siteUrl: 'https://example.com', // 占位值：部署后改为真实网址
  avatar: '/images/avatars/avatar-placeholder.png',
  backgrounds: {
    light: '/images/backgrounds/amelife-dawn.png',
    dark: '/images/backgrounds/amelife-dawn.png',
    overlayLight: 'linear-gradient(90deg, rgba(5,20,38,.82), rgba(5,20,38,.35))',
    overlayDark: 'linear-gradient(90deg, rgba(2,8,20,.88), rgba(2,8,20,.48))',
  },
  navigation: [
    { label: '首页', href: '/' }, { label: '文章', href: '/posts/' },
    { label: '分类', href: '/categories/' }, { label: '标签', href: '/tags/' },
    { label: '归档', href: '/archive/' }, { label: '项目', href: '/projects/' },
    { label: '关于', href: '/about/' },
  ],
  socialLinks: [
  { label: 'GitHub', href: 'https://github.com/Ameyur1' },
  { label: 'RSS', href: '/rss.xml' },
  { label: '邮箱', href: 'mailto:3478836721@qq.com' },
],
  footer: '愿每一次记录，都让生活更清晰一点。',
  theme: { accent: '#e79a54', defaultMode: 'system' as 'system' | 'light' | 'dark' },
};
