import { forwardRef } from 'react';
import { ZODIAC } from '@/lib/saju/constants';
import type { AnalyzeResult, MatchSection } from '@/lib/saju/types';

/** 화면 밖에 렌더하는 540×675 공유 카드. html-to-image가 1080×1350 PNG로 만든다. */
const ShareCard = forwardRef<HTMLDivElement, { result: AnalyzeResult; title: string; birthLine: string }>(function ShareCard({ result, title, birthLine }, ref) {
  const match = result.sections.find((s): s is MatchSection => s.type === 'match');
  return (
    <div aria-hidden="true" style={{ position: 'fixed', left: -10000, top: 0, pointerEvents: 'none' }}>
      <div ref={ref} style={{ width: 540, height: 675, boxSizing: 'border-box', padding: '40px 40px 32px', backgroundColor: '#EFE6D3', backgroundImage: 'radial-gradient(ellipse 60% 40% at 20% 15%,rgba(160,120,60,.12),transparent 70%),radial-gradient(ellipse 50% 35% at 85% 80%,rgba(150,110,55,.12),transparent 70%),radial-gradient(ellipse 120% 90% at 50% 45%,transparent 55%,rgba(110,80,40,.25) 100%)', color: '#24211D', fontFamily: "Pretendard,'Noto Sans KR',sans-serif", display: 'flex', flexDirection: 'column', gap: 20, wordBreak: 'keep-all', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 14, border: '1px solid rgba(156,132,88,.5)', borderRadius: 18 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><span className="serif" style={{ fontWeight: 800, fontSize: 24 }}>운결</span><span className="serif" style={{ fontSize: 13, color: '#7D5F24', letterSpacing: '0.2em' }}>運結</span></span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: '#574A86', padding: '4px 10px', borderRadius: 999 }}>{result.meta.label}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', marginTop: 12 }}>
          <span className="serif" style={{ fontWeight: 800, fontSize: 32, lineHeight: 1.3, letterSpacing: '-0.02em' }}>{title}</span>
          <span style={{ fontSize: 13, color: '#4A453E' }}>{birthLine}</span>
        </div>
        <p className="serif" style={{ margin: 0, fontSize: 20, lineHeight: 1.7, color: '#2E2A25', position: 'relative' }}>“{result.summary}”</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, position: 'relative' }}>
          {result.keywords.map(k => <span key={k} style={{ whiteSpace: 'nowrap', fontSize: 14, fontWeight: 600, padding: '6px 14px', borderRadius: 999, background: '#F3EAD6', color: '#5C4A1F', border: '1px solid rgba(168,131,63,.35)' }}># {k}</span>)}
        </div>
        {match && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', padding: 18, borderRadius: 18, background: 'rgba(251,248,242,.85)', border: '1px solid rgba(36,33,29,.08)' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#3E3366' }}>나와 어울리는 띠 TOP 3</span>
            <div style={{ display: 'flex', gap: 10 }}>
              {match.ranks.map(r => { const z = ZODIAC[r.animal]; return (
                <div key={r.rank} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="serif" style={{ width: 40, height: 40, borderRadius: '50%', background: z.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>{z.hanja}</span>
                  <span style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: 11, color: '#6B645A', fontWeight: 600 }}>{r.rank}위</span><span style={{ fontSize: 14, fontWeight: 700 }}>{z.name}띠</span></span>
                </div>
              ); })}
            </div>
          </div>
        )}
        <p style={{ margin: 'auto 0 0', fontSize: 11, lineHeight: 1.6, color: '#5A544B', position: 'relative' }}>사주 해석은 전통적인 해석 체계를 바탕으로 한 참고 콘텐츠입니다. 중요한 결정은 현실적인 정보와 본인의 판단을 함께 고려해 주세요.</p>
      </div>
    </div>
  );
});
export default ShareCard;
