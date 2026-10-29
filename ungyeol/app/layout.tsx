import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '운결 · 사주 분석',
  description: '나의 운을 읽고, 좋은 인연을 연결하다. 생년월일로 보는 사주 이야기.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&family=Nanum+Brush+Script&display=swap" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
