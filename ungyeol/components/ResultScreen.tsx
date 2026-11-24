'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import SectionCard from './SectionCard';
import ShareCard from './ShareCard';
import { Corners, RuleOrn } from './Ornaments';
import { buildFontEmbedCSS } from '@/lib/fontEmbed';
import type { AnalyzeResult, Element } from '@/lib/saju/types';

/** 오행: [표기, 색, 한 글자, 한자] — 색은 브랜드 팔레트에 맞춘 차분한 먹색 계열 */
const EL: Record<Element, [string, string, string, string]> = {
  wood: ['목(木)', '#355B49', '목', '木'], fire: ['화(火)', '#943C32', '화', '火'], earth: ['토(土)', '#8A6A2F', '토', '土'],
  metal: ['금(金)', '#6A665E', '금', '金'], water: ['수(水)', '#142C46', '수', '水'],
};
const ELX: Record<string, [string, string, string, string]> = { ...EL, none: ['', '#B3AB9C', '', ''] };
const NUM = ['一', '二', '三', '四', '五', '六', '七', '八'];
const PILLAR_HAN: Record<string, string> = { 시주: '時柱', 일주: '日柱', 월주: '月柱', 년주: '年柱' };
const SHORT: Record<string, string> = { children: '자녀운', spouse: '배우자운', money: '금전운', work: '직장운', match: '어울리는 띠', year: '2027년 띠', sewoon: '2027년 운세', study: '공부운' };

interface Props { result: AnalyzeResult; title: string; birthLine: string; fileName: string; onEdit: () => void; onRestart: () => void; onRetry: () => void }

export default function ResultScreen({ result: R, title, birthLine, fileName, onEdit, onRestart, onRetry }: Props) {
  const [active, setActive] = useState(R.sections[0].id);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveErr, setSaveErr] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      let cur = R.sections[0].id;
      for (const s of R.sections) { const el = document.getElementById('sec-' + s.id); if (el && el.getBoundingClientRect().top < 200) cur = s.id; }
      // 맨 아래까지 내리면 마지막 장이 화면 위쪽에 닿지 못하므로 마지막 장을 표시한다.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = R.sections[R.sections.length - 1].id;
      setActive(cur);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [R]);

  const goTo = (id: string) => {
    const el = document.getElementById('sec-' + id); if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 112, behavior: 'smooth' });
    setActive(id);
  };

  const saveImage = useCallback(async () => {
    if (saving) return;
    const node = cardRef.current;
    setSaving(true); setSaveMsg(''); setSaveErr(false);
    try {
      const lib = await import('html-to-image');
      if (!node) throw new Error('no-node');
      const opts = { pixelRatio: 2, cacheBust: true, backgroundColor: '#F5EFE2' };
      if (document.fonts?.ready) await document.fonts.ready;
      let fontEmbedCSS: string | undefined;
      try { fontEmbedCSS = await buildFontEmbedCSS(node); } catch { fontEmbedCSS = undefined; }
      let blob: Blob | null;
      try { blob = await lib.toBlob(node, { ...opts, fontEmbedCSS }); } catch { blob = await lib.toBlob(node, { ...opts, skipFonts: true }); }
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
  const day = R.pillars.find(p => p.isDay);
  const navItems = R.sections.map((s, i) => ({ id: s.id, no: NUM[i], short: SHORT[s.id] || s.title, on: active === s.id }));

  return (
    <div className="result">
      <div role="status" className="notice">
        <span className="notice__label">{R.meta.label}</span>
        <span className="notice__text">{R.meta.note}</span>
        {R.meta.interpFailed && <button onClick={onRetry} className="btn btn--primary btn--sm">해석 다시 불러오기</button>}
      </div>

      <div className="result-grid">
        <article className="sheet report" aria-labelledby="r-title">
          <Corners />
          <header className="cover">
            <div>
              <p className="kicker" style={{ margin: 0 }}>사주 해석서</p>
              <h2 id="r-title" className="cover__title">{title}</h2>
              <div className="cover__meta">
                <span>{birthLine}</span>
                <strong>{R.identity}</strong>
              </div>
              <div className="cover__edit"><button onClick={onEdit} className="link-btn">정보 수정</button></div>
            </div>
            {day && (
              <div className="ilju">
                <div className="ilju__ring">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/art/enso.webp" alt="" aria-hidden="true" width={640} height={640} />
                  <span className="ilju__han" aria-hidden="true">{day.stem}{day.branch}</span>
                </div>
                <span className="ilju__ko">{day.stemKo}{day.branchKo}일주</span>
              </div>
            )}
          </header>

          <blockquote className="quote"><p>“{R.summary}”</p></blockquote>
          <ul className="keywords" aria-label="핵심 키워드">
            {R.keywords.map(k => <li key={k}># {k}</li>)}
          </ul>
          <div className="cover-actions">
            <button onClick={saveImage} aria-busy={saving} className="btn btn--primary">{saveLabel}</button>
            <button onClick={onRestart} className="btn btn--secondary">다시 입력하기</button>
          </div>
          <p aria-live="polite" className="save-msg" data-error={saveErr}>{saveMsg}</p>

          <section className="part" aria-labelledby="h-chart">
            <div className="part-head">
              <h2 id="h-chart">사주팔자</h2><span className="part-head__han" aria-hidden="true">命式</span>
              <span className="part-head__tag">{R.meta.chartTag}</span>
            </div>
            <div className="pillars">
              {R.pillars.map(p => (
                <div key={p.label} className={`pillar${p.isDay ? ' pillar--day' : ''}${p.unknown ? ' pillar--unknown' : ''}`}>
                  <div className="pillar__head"><b>{p.label}</b><small>{PILLAR_HAN[p.label] || p.note}</small></div>
                  <span className="pillar__god">{p.stemGod || ''}</span>
                  <span className="pillar__char" style={{ color: ELX[p.stemEl][1] }}>{p.stem}</span>
                  <span className="pillar__sub">{p.unknown ? '시간 모름' : `${p.stemKo} · ${ELX[p.stemEl][2]}`}</span>
                  <span className="pillar__div" aria-hidden="true" />
                  <span className="pillar__char" style={{ color: ELX[p.branchEl][1] }}>{p.branch}</span>
                  <span className="pillar__sub">{p.unknown ? '' : `${p.branchKo} · ${ELX[p.branchEl][2]}`}</span>
                  <span className="pillar__god">{p.branchGod || ''}</span>
                </div>
              ))}
            </div>
            <p className="para-note">{R.chartNote}</p>
            {R.daeun && <p className="callout callout--navy" style={{ marginTop: 12, fontSize: 14 }}>{R.daeun}</p>}
          </section>

          <section className="part" aria-labelledby="h-el">
            <div className="part-head">
              <h2 id="h-el">오행 분포</h2><span className="part-head__han" aria-hidden="true">五行</span>
              <span className="part-head__tag">{R.meta.chartTag}</span>
            </div>
            <ul className="elements">
              {(Object.keys(EL) as Element[]).map(k => (
                <li key={k}>
                  <span className="elements__name"><b style={{ color: EL[k][1] }} aria-hidden="true">{EL[k][3]}</b><span>{EL[k][2]}<span className="sr-only">({EL[k][3]})</span></span></span>
                  <span className="elements__bar" aria-hidden="true"><i style={{ width: `${Math.round(R.elements[k] / max * 100)}%`, background: EL[k][1] }} /></span>
                  <span className="elements__count">{R.elements[k]}개</span>
                </li>
              ))}
            </ul>
            <p className="para-note">{R.elementNote}</p>
          </section>
          <section className="part" aria-labelledby="h-sup">
            <div className="part-head">
              <h2 id="h-sup">보완의 길</h2><span className="part-head__han" aria-hidden="true">補完</span>
            </div>
            <div className="supplement" style={{ marginTop: 0, borderTop: 0, paddingTop: 0 }}>
              <h3><i aria-hidden="true" />부족한 부분을 보완하려면</h3>
              <p>{R.supplement.lead}</p>
              <dl>
                {R.supplement.items.map(t => <div key={t.title}><dt>{t.title}</dt><dd>{t.text}</dd></div>)}
              </dl>
            </div>
          </section>

          <div className="chapters">
            {(
              <nav aria-label="사주 풀이 항목 바로가기" className="tabs">
                <div className="tabs__row">
                  {navItems.map(n => (
                    <button key={n.id} onClick={() => goTo(n.id)} aria-current={n.on ? 'true' : undefined}><b aria-hidden="true">{n.no}</b>{n.short}</button>
                  ))}
                </div>
              </nav>
            )}
            {R.sections.map((s, i) => <SectionCard key={s.id} section={s} no={NUM[i]} first={i === 0} open={!!open[s.id]} onToggle={() => setOpen(o => ({ ...o, [s.id]: !o[s.id] }))} />)}
          </div>

          <footer className="colophon">
            <RuleOrn />
            <p>사주 해석은 전통적인 해석 체계를 바탕으로 한 참고 콘텐츠입니다. 중요한 결정은 현실적인 정보와 본인의 판단을 함께 고려해 주세요.</p>
            <div className="colophon__actions">
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="btn btn--secondary">오늘의 운세로</button>
              <button onClick={saveImage} aria-busy={saving} className="btn btn--ghost">{saveLabel}</button>
              <button onClick={onRestart} className="btn btn--primary">다시 입력하기</button>
            </div>
            <small>명식은 공개 만세력 라이브러리로 계산하고, 해석 문장은 {R.meta.source === 'ai' ? 'AI가 명식을 근거로 작성' : '일간과 십신 분포를 규칙에 따라 풀이'}해요. 결과 이미지는 이 기기에서 바로 만들어져요.</small>
          </footer>
        </article>
      </div>
      <ShareCard ref={cardRef} result={R} title={title} birthLine={birthLine} />
    </div>
  );
}
