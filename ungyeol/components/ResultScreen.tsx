'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import SectionCard from './SectionCard';
import ShareCard from './ShareCard';
import type { AnalyzeResult, Element } from '@/lib/saju/types';

const EL: Record<Element, [string, string, string]> = { wood: ['목(木)', '#4F7A55', '목'], fire: ['화(火)', '#B0493A', '화'], earth: ['토(土)', '#9A7430', '토'], metal: ['금(金)', '#6E737B', '금'], water: ['수(水)', '#3C5A85', '수'] };
const ELX: Record<string, [string, string, string]> = { ...EL, none: ['', '#A39C90', ''] };
const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];
const SHORT: Record<string, string> = { children: '자녀운', spouse: '배우자운', money: '금전운', work: '직장운', match: '어울리는 띠', year: '2027년 띠', sewoon: '2027년 운세', study: '공부운' };
const card = { background: '#FBF8F2', border: '1px solid rgba(36,33,29,.1)', borderRadius: 24, padding: 'clamp(18px,4vw,26px)', display: 'flex', flexDirection: 'column', gap: 18 } as const;
const tag = { whiteSpace: 'nowrap', fontSize: 12.5, fontWeight: 600, padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(87,74,134,.5)', color: '#574A86' } as const;

interface Props { result: AnalyzeResult; title: string; birthLine: string; fileName: string; onEdit: () => void; onRestart: () => void; onRetry: () => void }

export default function ResultScreen({ result: R, title, birthLine, fileName, onEdit, onRestart, onRetry }: Props) {
  const [wide, setWide] = useState(true);
  const [active, setActive] = useState(R.sections[0].id);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveErr, setSaveErr] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= 980);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  useEffect(() => {
    const onScroll = () => {
      let cur = R.sections[0].id;
      for (const s of R.sections) { const el = document.getElementById('sec-' + s.id); if (el && el.getBoundingClientRect().top < 160) cur = s.id; }
      setActive(cur);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [R]);

  const goTo = (id: string) => {
    const el = document.getElementById('sec-' + id); if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (wide ? 24 : 72), behavior: 'smooth' });
    setActive(id);
  };

  const saveImage = useCallback(async () => {
    if (saving) return;
    const node = cardRef.current;
    setSaving(true); setSaveMsg(''); setSaveErr(false);
    try {
      const lib = await import('html-to-image');
      if (!node) throw new Error('no-node');
      const opts = { pixelRatio: 2, cacheBust: true, backgroundColor: '#EFE6D3' };
      if (document.fonts?.ready) await document.fonts.ready;
      let blob: Blob | null;
      try { blob = await lib.toBlob(node, opts); } catch { blob = await lib.toBlob(node, { ...opts, skipFonts: true }); }
      if (!blob) throw new Error('empty');
      const fname = `운결_${fileName || '사주이야기'}.png`;
      const file = new File([blob], fname, { type: 'image/png' });
      const touch = window.matchMedia?.('(pointer: coarse)').matches;
      if (touch && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '운결 · 사주 이야기' });
        setSaveMsg('공유 메뉴에서 ‘이미지 저장’을 선택하면 사진첩에 저장돼요.');
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = fname;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        setSaveMsg(`‘${fname}’ 파일로 저장했어요.`);
      }
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') setSaveMsg('');
      else { setSaveMsg('이미지를 만들지 못했어요. 잠시 후 다시 시도해 주세요.'); setSaveErr(true); }
    } finally { setSaving(false); }
  }, [saving, fileName]);

  const saveLabel = saving ? '이미지 만드는 중…' : '결과 이미지 저장';
  const max = Math.max(...Object.values(R.elements), 1);
  const gutter = 'clamp(16px,4vw,24px)';

  const navItems = R.sections.map((s, i) => ({ id: s.id, no: CIRCLED[i], short: SHORT[s.id] || s.title, on: active === s.id }));

  return (
    <main style={{ width: '100%', maxWidth: 1160, margin: '0 auto', padding: `8px ${gutter} 64px`, display: 'flex', flexDirection: 'column', gap: 'clamp(20px,4vw,28px)' }}>
      <div role="status" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 14px', padding: '14px 18px', borderRadius: 16, background: '#ECE8F3', border: '1px solid rgba(87,74,134,.2)' }}>
        <span style={{ whiteSpace: 'nowrap', flex: 'none', fontSize: 14, fontWeight: 700, color: '#fff', background: '#574A86', padding: '5px 12px', borderRadius: 999 }}>{R.meta.label}</span>
        <span style={{ fontSize: 14, color: '#3E3366', lineHeight: 1.55, flex: '1 1 280px' }}>{R.meta.note}</span>
        {R.meta.interpFailed && <button onClick={onRetry} style={{ whiteSpace: 'nowrap', flex: 'none', height: 40, padding: '0 16px', borderRadius: 999, border: 0, background: '#574A86', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>해석 다시 불러오기</button>}
      </div>

      <section aria-labelledby="r-title" style={{ position: 'relative', overflow: 'hidden', background: '#FBF8F2', border: '1px solid rgba(36,33,29,.1)', borderRadius: 32, padding: 'clamp(24px,5vw,48px)', display: 'flex', flexDirection: 'column', gap: 22, boxShadow: '0 24px 48px -32px rgba(60,45,20,.3)' }}>
        <svg width="260" height="140" viewBox="0 0 260 140" aria-hidden="true" style={{ position: 'absolute', right: -10, top: -6, opacity: 0.55 }}>
          <g stroke="#B79A5E" strokeWidth="0.8" fill="none"><line x1="30" y1="110" x2="90" y2="70" /><line x1="90" y1="70" x2="150" y2="88" /><line x1="150" y1="88" x2="200" y2="40" /><line x1="200" y1="40" x2="244" y2="64" /></g>
          <g fill="#A8833F"><circle cx="30" cy="110" r="2.4" /><circle cx="90" cy="70" r="3" /><circle cx="150" cy="88" r="2" /><circle cx="200" cy="40" r="3.6" /><circle cx="244" cy="64" r="2.2" /></g>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
          <h1 id="r-title" className="serif" style={{ margin: 0, fontWeight: 800, fontSize: 'clamp(28px,4vw,42px)', letterSpacing: '-0.03em', lineHeight: 1.3 }}>{title}</h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 14px' }}>
            <span style={{ fontSize: 15, color: '#4A453E', lineHeight: 1.6 }}>{birthLine}</span>
            <span style={{ whiteSpace: 'nowrap', fontSize: 14, fontWeight: 600, color: '#7D5F24' }}>{R.identity}</span>
            <button onClick={onEdit} className="btn-outline" style={{ whiteSpace: 'nowrap', flex: 'none', height: 40, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(87,74,134,.4)', background: 'transparent', color: '#574A86', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>정보 수정</button>
          </div>
        </div>
        <p className="serif" style={{ margin: 0, fontSize: 'clamp(19px,2.4vw,24px)', lineHeight: 1.7, color: '#2E2A25', maxWidth: 720, textWrap: 'pretty', position: 'relative' }}>“{R.summary}”</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, position: 'relative' }}>
          {R.keywords.map(k => <span key={k} style={{ whiteSpace: 'nowrap', fontSize: 15, fontWeight: 600, padding: '8px 16px', borderRadius: 999, background: '#F3EAD6', color: '#5C4A1F', border: '1px solid rgba(168,131,63,.3)' }}># {k}</span>)}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, paddingTop: 6, borderTop: '1px dashed rgba(36,33,29,.14)', position: 'relative' }}>
          <button onClick={onRestart} style={{ whiteSpace: 'nowrap', flex: 'none', height: 46, padding: '0 20px', borderRadius: 14, border: 0, background: '#24211D', color: '#FBF8F2', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 14 }}>다시 입력하기</button>
          <button onClick={saveImage} aria-busy={saving} className="btn-cta" style={{ whiteSpace: 'nowrap', flex: 'none', height: 46, padding: '0 18px', borderRadius: 14, border: '1px solid #574A86', background: '#574A86', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 14, opacity: saving ? 0.7 : 1 }}>{saveLabel}</button>
        </div>
        <p aria-live="polite" style={{ margin: '-8px 0 0', fontSize: 13.5, lineHeight: 1.6, color: saveErr ? '#A33A2A' : '#3E3366', position: 'relative' }}>{saveMsg}</p>
      </section>

      <section aria-label="사주팔자와 오행 분포 요약" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: 20 }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 className="serif" style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>사주팔자</h2><span style={tag}>{R.meta.chartTag}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 8 }}>
            {R.pillars.map(p => (
              <div key={p.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 4px', borderRadius: 16, background: p.isDay ? '#ECE8F3' : p.unknown ? '#F4F0E8' : '#fff', border: `1px solid ${p.isDay ? 'rgba(87,74,134,.4)' : 'rgba(36,33,29,.1)'}` }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#3A352F' }}>{p.label}</span>
                <span className="serif" style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.1, color: ELX[p.stemEl][1] }}>{p.stem}</span>
                <span style={{ fontSize: 12, color: '#5A544B', textAlign: 'center' }}>{p.unknown ? '시간 모름' : `${p.stemKo} · ${ELX[p.stemEl][2]}`}</span>
                <span style={{ fontSize: 11.5, color: '#7D5F24', fontWeight: 600 }}>{p.stemGod || ''}</span>
                <span style={{ width: '60%', height: 1, background: 'rgba(36,33,29,.12)' }} />
                <span className="serif" style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.1, color: ELX[p.branchEl][1] }}>{p.branch}</span>
                <span style={{ fontSize: 12, color: '#5A544B' }}>{p.unknown ? '' : `${p.branchKo} · ${ELX[p.branchEl][2]}`}</span>
                <span style={{ fontSize: 11.5, color: '#7D5F24', fontWeight: 600 }}>{p.branchGod || ''}</span>
              </div>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: '#5A544B', lineHeight: 1.6 }}>{R.chartNote}</p>
          {R.daeun && <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: '#3E3366', padding: '10px 14px', borderRadius: 12, background: '#ECE8F3' }}>{R.daeun}</p>}
        </div>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 className="serif" style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>오행 분포</h2><span style={tag}>{R.meta.chartTag}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(Object.keys(EL) as Element[]).map(k => (
              <div key={k} style={{ display: 'grid', gridTemplateColumns: '64px minmax(0,1fr) 44px', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{EL[k][0]}</span>
                <span style={{ height: 10, borderRadius: 999, background: '#EAE4D8', overflow: 'hidden', display: 'block' }}><span style={{ display: 'block', height: '100%', borderRadius: 999, width: `${Math.round(R.elements[k] / max * 100)}%`, background: EL[k][1] }} /></span>
                <span style={{ fontSize: 14, color: '#4A453E', textAlign: 'right' }}>{R.elements[k]}개</span>
              </div>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: '#5A544B', lineHeight: 1.6 }}>{R.elementNote}</p>
          <div style={{ padding: '16px 18px', borderRadius: 16, background: '#F3EAD6', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#5C4A1F' }}>✦ 부족한 부분을 보완하려면</p>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: '#2E2A25' }}>{R.supplement.lead}</p>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14.5, lineHeight: 1.6, color: '#2E2A25' }}>
              {R.supplement.items.map(t => <li key={t}>{t}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <div style={{ display: 'flex', flexDirection: wide ? 'row' : 'column', gap: 32, alignItems: 'flex-start' }}>
        {wide ? (
          <nav aria-label="결과 항목 바로가기" style={{ position: 'sticky', top: 24, flex: '0 0 232px', background: '#FBF8F2', border: '1px solid rgba(36,33,29,.1)', borderRadius: 24, padding: '18px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ margin: '0 12px 8px', fontSize: 13, fontWeight: 600, color: '#6B645A' }}>여덟 가지 이야기</p>
            {navItems.map(n => (
              <button key={n.id} onClick={() => goTo(n.id)} aria-current={n.on ? 'true' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', padding: '10px 12px', borderRadius: 12, border: 0, cursor: 'pointer', fontSize: 15, background: n.on ? '#ECE8F3' : 'transparent', color: n.on ? '#3E3366' : '#3A352F', fontWeight: n.on ? 700 : 500 }}>
                <span className="serif" style={{ width: 22, color: n.on ? '#574A86' : '#7D5F24' }}>{n.no}</span>{n.short}
              </button>
            ))}
          </nav>
        ) : (
          <nav aria-label="결과 항목 바로가기" style={{ position: 'sticky', top: 0, zIndex: 5, width: `calc(100% + 2 * ${gutter})`, margin: `0 calc(-1 * ${gutter})`, padding: `10px ${gutter}`, background: 'rgba(245,240,230,.94)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(36,33,29,.08)' }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {navItems.map(n => (
                <button key={n.id} onClick={() => goTo(n.id)} aria-current={n.on ? 'true' : undefined} style={{ flex: 'none', height: 44, padding: '0 16px', borderRadius: 999, cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap', border: `1px solid ${n.on ? '#574A86' : 'rgba(36,33,29,.14)'}`, background: n.on ? '#574A86' : '#FBF8F2', color: n.on ? '#fff' : '#3A352F', fontWeight: n.on ? 700 : 500 }}>{n.no} {n.short}</button>
              ))}
            </div>
          </nav>
        )}

        <div style={{ flex: '1 1 0', minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {R.sections.map((s, i) => <SectionCard key={s.id} section={s} no={CIRCLED[i]} open={!!open[s.id]} onToggle={() => setOpen(o => ({ ...o, [s.id]: !o[s.id] }))} />)}

          <aside style={{ marginTop: 12, padding: 28, borderRadius: 24, border: '1px solid rgba(168,131,63,.35)', background: 'rgba(243,234,214,.5)', display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center', textAlign: 'center' }}>
            <span aria-hidden="true" style={{ color: '#A8833F', letterSpacing: '0.6em', fontSize: 12 }}>✦ ✦ ✦</span>
            <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.8, color: '#3A352F', maxWidth: 560, textWrap: 'pretty' }}>사주 해석은 전통적인 해석 체계를 바탕으로 한 참고 콘텐츠입니다. 중요한 결정은 현실적인 정보와 본인의 판단을 함께 고려해 주세요.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ whiteSpace: 'nowrap', flex: 'none', height: 44, padding: '0 18px', borderRadius: 14, border: '1px solid rgba(36,33,29,.2)', background: 'transparent', color: '#24211D', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>맨 위로</button>
              <button onClick={saveImage} aria-busy={saving} style={{ whiteSpace: 'nowrap', flex: 'none', height: 44, padding: '0 18px', borderRadius: 14, border: '1px solid #574A86', background: 'transparent', color: '#574A86', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>{saveLabel}</button>
              <button onClick={onRestart} style={{ whiteSpace: 'nowrap', flex: 'none', height: 44, padding: '0 18px', borderRadius: 14, border: 0, background: '#24211D', color: '#FBF8F2', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>다시 입력하기</button>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: '#6B645A' }}>명식은 공개 만세력 라이브러리로 계산하고, 해석 문장은 {R.meta.source === 'ai' ? 'AI가 명식을 근거로 작성' : '일간과 십신 분포를 규칙에 따라 풀이'}해요. 결과 이미지는 이 기기에서 바로 만들어져요.</p>
          </aside>
          <ShareCard ref={cardRef} result={R} title={title} birthLine={birthLine} />
        </div>
      </div>
    </main>
  );
}
