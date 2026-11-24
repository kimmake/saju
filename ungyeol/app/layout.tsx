import type { Metadata, Viewport } from 'next';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './globals.css';

export const metadata: Metadata = {
  title: '운결 · 사주 분석',
  description: '나의 운을 읽고, 좋은 인연을 연결하다. 생년월일로 보는 사주 이야기.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#F5EFE2' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* crossOrigin: 결과 이미지 저장 때 글꼴 규칙(cssRules)을 읽기 위해 필요 */}
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&family=Song+Myung&display=swap" rel="stylesheet" crossOrigin="anonymous" />
        <link rel="preload" as="image" href="/art/hanji.webp" />
        <link rel="preload" as="font" href="/fonts/chosungs-normal.woff" type="font/woff" crossOrigin="" />
      </head>
      <body>{children}</body>
    </html>
  );
}
