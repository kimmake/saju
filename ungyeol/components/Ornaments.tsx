/** 금박선 장식: 책장 네 귀퉁이의 꺾쇠 문양, 마름모 구분선, 낙관. */
export function Corners() {
  const path = 'M1 21V1h20 M5 17V5h12 M9 9h4v4';
  return (
    <>
      {(['tl', 'tr', 'bl', 'br'] as const).map(p => (
        <svg key={p} className={`corner corner--${p}`} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true"><path d={path} /></svg>
      ))}
    </>
  );
}

export function RuleOrn({ className = '' }: { className?: string }) {
  return <div className={`rule-orn ${className}`} aria-hidden="true"><i /></div>;
}

export function Seal({ chars = '運結' }: { chars?: string }) {
  return <span className="seal" aria-hidden="true">{chars.split('').map(c => <span key={c}>{c}</span>)}</span>;
}

export function Chevron({ open }: { open: boolean }) {
  return <svg className="chev" data-open={open} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M1.5 3.5 5 7l3.5-3.5" /></svg>;
}
