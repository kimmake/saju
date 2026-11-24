/** 화면 가장자리의 수묵 산수 (데스크톱 전용). 한지 질감은 body 배경에 있다. 모바일에서는 본문과 겹치지 않도록 숨긴다. */
export default function Background({ variant }: { variant: 'home' | 'result' }) {
  return (
    <div aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={`bg-art bg-art--left bg-art--${variant}`} src="/art/mountains-left.webp" alt="" width={1400} height={900} decoding="async" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={`bg-art bg-art--right bg-art--${variant}`} src="/art/mountains-right.webp" alt="" width={1200} height={640} decoding="async" />
    </div>
  );
}
