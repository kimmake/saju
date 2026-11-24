'use client';
import Link from 'next/link';
import { Seal } from './Ornaments';

/** 공통 머리: 상호와 두 서비스(나의 사주팔자 · 오늘의 운세) 이동 */
export default function SiteHeader({ current, onBrand }: { current: 'saju' | 'today'; onBrand?: () => void }) {
  const brand = (
    <>
      <Seal />
      <span className="brand__name">운결</span>
      <span className="brand__han">運結</span>
    </>
  );
  return (
    <header className="site-header">
      {onBrand
        ? <button className="brand" onClick={onBrand} aria-label="운결 처음 화면으로">{brand}</button>
        : <Link className="brand" href="/" aria-label="운결 처음 화면으로">{brand}</Link>}
      <nav className="site-nav" aria-label="서비스">
        <Link href="/" aria-current={current === 'saju' ? 'page' : undefined}>나의 사주<span className="hide-xs">팔자</span></Link>
        <Link href="/today" aria-current={current === 'today' ? 'page' : undefined}>오늘의 운세</Link>
      </nav>
    </header>
  );
}
