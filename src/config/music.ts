export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  src: string;
  cover: string;
  accent: string;
  glow: string;
}

// 后续添加歌曲时，只需把音频和封面放入 public 文件夹，
// 再在这里复制一项并修改信息，播放器会自动更新歌单。
export const musicPlaylist: MusicTrack[] = [
  {
    id: 'goodbye-happiness',
    title: 'Goodbye Happiness',
    artist: '宇多田光',
    album: 'Utada Hikaru SINGLE COLLECTION VOL.2',
    src: '/audio/goodbye-happiness.mp3',
    cover: '/images/music/goodbye-happiness.jpg',
    accent: '#d8b98a',
    glow: '#6f593f',
  },
  {
    id: 'ahead-of-us',
    title: 'Ahead of Us',
    artist: '小濑村晶',
    album: 'Proof of Us',
    src: '/audio/ahead-of-us.mp3',
    cover: '/images/music/ahead-of-us.jpeg',
    accent: '#9bcdf7',
    glow: '#496f9e',
  },
];
