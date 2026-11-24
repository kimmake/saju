import { forwardRef } from 'react';
import { ZODIAC } from '@/lib/saju/constants';
import type { AnalyzeResult, MatchSection } from '@/lib/saju/types';

const SERIF = "'Noto Serif KR', serif";
const DISPLAY = "'Song Myung', 'Noto Serif KR', serif";
const SANS = "'Pretendard Variable', Pretendard, sans-serif";

/** 화면 밖에 렌더하는 540×675 공유 카드. html-to-image가 1080×1350 PNG로 만든다. */
const ShareCard = forwardRef<HTMLDivElement, { result: AnalyzeResult; title: string; birthLine: string }>(function ShareCard({ result, title, birthLine }, ref) {
  const match = result.sections.find((s): s is MatchSection => s.type === 'match');
  const day = result.pillars.find(p => p.isDay);
  return (
    <div aria-hidden="true" style={{ position: 'fixed', left: -10000, top: 0, pointerEvents: 'none' }}>
      <div ref={ref} style={{ width: 540, height: 675, boxSizing: 'border-box', padding: '44px 44px 34px', backgroundColor: '#F5EFE2', backgroundImage: "url('/art/hanji.webp')", backgroundSize: '720px 720px', color: '#25231F', fontFamily: SANS, display: 'flex', flexDirection: 'column', gap: 18, wordBreak: 'keep-all', position: 'relative', overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/art/mountains-left.webp" alt="" style={{ position: 'absolute', left: 0, bottom: 72, width: 340, opacity: 0.26 }} />
        <div style={{ position: 'absolute', inset: 14, border: '1px solid rgba(180,151,93,.8)' }} />
        <div style={{ position: 'absolute', inset: 19, border: '1px solid rgba(180,151,93,.38)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, background: '#943C32', color: '#FBF1EA', fontFamily: SERIF, fontWeight: 700, fontSize: 11, lineHeight: 1.05, borderRadius: 3 }}><span>運</span><span>結</span></span>
            <span style={{ fontFamily: DISPLAY, fontSize: 24 }}>운결</span>
            <span style={{ fontFamily: SERIF, fontSize: 11, color: '#7A6232', letterSpacing: '0.3em' }}>運結</span>
          </span>
          <span style={{ fontFamily: SERIF, fontSize: 11.5, fontWeight: 600, color: '#FBF8F0', background: '#142C46', padding: '4px 10px' }}>{result.meta.label}</span>
        </div>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', position: 'relative', marginTop: 10 }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontFamily: SERIF, fontSize: 12, fontWeight: 600, color: '#7A6232', letterSpacing: '0.16em' }}>사주 해석서</span>
            <span style={{ fontFamily: DISPLAY, fontSize: 32, lineHeight: 1.25 }}>{title}</span>
            <span style={{ fontSize: 12.5, color: '#4D483F', lineHeight: 1.5 }}>{birthLine}</span>
          </div>
          {day && (
            <div style={{ position: 'relative', width: 104, height: 104, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/art/enso.webp" alt="" style={{ position: 'absolute', inset: 0, width: 104, height: 104 }} />
              <span style={{ position: 'relative', fontFamily: DISPLAY, fontSize: 28, lineHeight: 1.05, writingMode: 'vertical-rl', letterSpacing: '0.06em' }}>{day.stem}{day.branch}</span>
            </div>
          )}
        </div>
        <p style={{ margin: 0, padding: '16px 0', borderTop: '1px solid rgba(180,151,93,.8)', borderBottom: '1px solid rgba(180,151,93,.8)', fontFamily: SERIF, fontSize: 17, lineHeight: 1.75, color: '#25231F', position: 'relative' }}>“{result.summary}”</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, position: 'relative' }}>
          {result.keywords.map(k => <span key={k} style={{ whiteSpace: 'nowrap', fontFamily: SERIF, fontSize: 13, fontWeight: 600, padding: '5px 11px', color: '#142C46', border: '1px solid rgba(20,44,70,.3)', background: 'rgba(251,248,240,.7)' }}># {k}</span>)}
        </div>
        {match && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', paddingTop: 4 }}>
            <span style={{ fontFamily: SERIF, fontSize: 12.5, fontWeight: 700, color: '#7A6232', letterSpacing: '0.06em' }}>나와 어울리는 띠 TOP 3</span>
            <div style={{ display: 'flex', gap: 10 }}>
              {match.ranks.map(r => { const z = ZODIAC[r.animal]; return (
                <div key={r.rank} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ width: 40, height: 40, borderRadius: '50%', border: `1px solid ${r.rank === 1 ? '#142C46' : 'rgba(37,35,31,.3)'}`, background: 'rgba(251,248,240,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISPLAY, fontSize: 20, color: r.rank === 1 ? '#142C46' : '#25231F' }}>{z.hanja}</span>
                  <span style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: 10.5, color: '#625C51', fontWeight: 600 }}>{r.rank}위</span><span style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 700 }}>{z.name}띠</span></span>
                </div>
              ); })}
            </div>
          </div>
        )}
        <p style={{ margin: 'auto 0 0', fontSize: 10.5, lineHeight: 1.6, color: '#4D483F', position: 'relative' }}>사주 해석은 전통적인 해석 체계를 바탕으로 한 참고 콘텐츠입니다. 중요한 결정은 현실적인 정보와 본인의 판단을 함께 고려해 주세요.</p>
      </div>
    </div>
  );
});
export default ShareCard;
