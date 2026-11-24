/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from 'react';

/** 화면 전체를 두르는 금박 테두리와 네 모서리 회문 (장식, 클릭을 막지 않는다) */
export function PageFrame() {
  return (
    <div className="page-frame" aria-hidden="true">
      {[0, 1, 2, 3].map(i => <img key={i} src="/art/corner.svg" alt="" width={56} height={56} />)}
    </div>
  );
}

/** 넓은 화면에서 본문 바깥 여백에만 보이는 소나무·산수 */
export function SideArt() {
  return (
    <div aria-hidden="true">
      <img className="side-art side-art--pine" src="/art/pine.webp" alt="" width={1200} height={608} loading="lazy" decoding="async" />
      <img className="side-art side-art--peaks" src="/art/landscape-peaks.webp" alt="" width={1300} height={551} loading="lazy" decoding="async" />
    </div>
  );
}

export function TopBar({ onBack, onBrand, backLabel = '처음 화면으로' }: { onBack?: () => void; onBrand?: () => void; backLabel?: string }) {
  return (
    <div className="topbar">
      {onBack
        ? <button className="topbar__back" onClick={onBack} aria-label={backLabel}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M20 12H5M11 5l-7 7 7 7" /></svg></button>
        : <span />}
      <button className="topbar__brand" onClick={onBrand} aria-label="운결 처음 화면으로"><b>운결</b><span>運結</span></button>
      <span />
    </div>
  );
}

/** 금색 매듭 구분선 */
export function Knot({ className = '' }: { className?: string }) {
  return (
    <div className={`knot ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1"><path d="M12 3l3 3-3 3-3-3zM12 15l3 3-3 3-3-3zM3 12l3-3 3 3-3 3zM15 12l3-3 3 3-3 3z" /><rect x="9.5" y="9.5" width="5" height="5" transform="rotate(45 12 12)" /></svg>
    </div>
  );
}

/** 인주 질감의 작은 붉은 낙관 */
export function Stamp({ ch = '運', className = '' }: { ch?: string; className?: string }) {
  return <span className={`stamp ${className}`} aria-hidden="true">{ch}</span>;
}

/** 5단계 별점 (전통 해석 규칙에 따른 참고 등급) */
export function Stars({ score, label, large }: { score: number; label?: string; large?: boolean }) {
  const star = 'M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17l-5.7 3.1 1.2-6.4L2.8 9.3l6.4-.8z';
  return (
    <span className={`stars${large ? ' stars--lg' : ''}`} role="img" aria-label={`5단계 중 ${score}단계${label ? ` (${label})` : ''}`}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} viewBox="0 0 24 24" aria-hidden="true"><path d={star} fill={i <= score ? '#142C46' : 'none'} stroke={i <= score ? '#142C46' : '#B4975D'} strokeWidth="1.4" strokeLinejoin="round" /></svg>
      ))}
    </span>
  );
}

export function Arrow() {
  return <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 2.5 9.5 7 5 11.5" /></svg>;
}

export function Shell({ children }: { children: ReactNode }) {
  return <div className="shell">{children}</div>;
}
