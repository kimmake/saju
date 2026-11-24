import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '운결 · 오늘의 운세',
  description: '생년월일로 보는 하루 한 장의 운세첩. 오늘의 일진과 나의 사주로 읽는 총운·분야별 운세·행운 요소.',
  openGraph: { title: '운결 · 오늘의 운세', description: '하루 한 장, 오늘의 일진으로 읽는 나의 운세첩', type: 'website' },
};

export default function TodayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
