import { ZODIAC } from '@/lib/saju/constants';
import type { MatchRank, Section, YearRank } from '@/lib/saju/types';

const RANK_C = [['#574A86', '#fff', 'rgba(87,74,134,.45)'], ['#E4DDF0', '#3E3366', 'rgba(36,33,29,.12)'], ['#EFEADF', '#4A453E', 'rgba(36,33,29,.12)']];
const toggleBtn = { alignSelf: 'flex-start', height: 42, padding: '0 16px', borderRadius: 999, border: '1px solid rgba(36,33,29,.18)', background: 'transparent', color: '#24211D', fontSize: 14.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 } as const;
const chev = (open: boolean) => <span aria-hidden="true" style={{ fontSize: 11, transform: `rotate(${open ? 180 : 0}deg)` }}>▼</span>;
const rankView = (r: MatchRank | YearRank) => { const z = ZODIAC[r.animal], c = RANK_C[r.rank - 1]; return { z, label: r.rank + '위', bg: c[0], fg: c[1], bd: c[2] }; };

interface Props { section: Section; no: string; open: boolean; onToggle: () => void }

export default function SectionCard({ section: s, no, open, onToggle }: Props) {
  return (
    <section id={'sec-' + s.id} aria-labelledby={'h-' + s.id} style={{ scrollMarginTop: 80, background: '#FBF8F2', border: '1px solid rgba(36,33,29,.1)', borderRadius: 'clamp(20px,5vw,28px)', padding: 'clamp(20px,5vw,36px) clamp(18px,4.5vw,36px)', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 'clamp(12px,3vw,16px)', alignItems: 'flex-start' }}>
        <span aria-hidden="true" className="serif" style={{ flex: 'none', width: 'clamp(44px,11vw,56px)', height: 'clamp(44px,11vw,56px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 24, color: '#574A86', background: '#ECE8F3', border: '1px solid rgba(87,74,134,.25)', boxShadow: '0 0 0 4px #FBF8F2,0 0 0 5px rgba(168,131,63,.35)' }}>{s.icon}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#7D5F24', letterSpacing: '0.04em' }}>{no}</span>
          <h2 id={'h-' + s.id} className="serif" style={{ margin: 0, fontSize: 'clamp(22px,2.6vw,27px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.35 }}>{s.title}</h2>
          <p style={{ margin: '2px 0 0', fontSize: 17, fontWeight: 600, color: '#3E3366', lineHeight: 1.6, textWrap: 'pretty' }}>{s.summary}</p>
        </div>
      </div>

      {s.type === 'fortune' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {s.body.map((para, i) => <p key={i} style={{ margin: 0, fontSize: 16.5, lineHeight: 1.85, color: '#2E2A25', textWrap: 'pretty' }}>{para}</p>)}
          </div>
          {s.tips.length > 0 && (
            <div style={{ padding: '20px 22px', borderRadius: 20, background: '#F3EAD6', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#5C4A1F' }}>✦ 이렇게 활용해 보세요</p>
              <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {s.tips.map((t, i) => (
                  <li key={i} style={{ display: 'flex', gap: 12, fontSize: 15.5, lineHeight: 1.65, color: '#2E2A25' }}>
                    <span style={{ flex: 'none', width: 24, height: 24, borderRadius: '50%', background: '#FBF8F2', color: '#7D5F24', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>{i + 1}</span><span>{t}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {s.details.length > 0 && (
            <>
              <button onClick={onToggle} aria-expanded={open} aria-controls={'d-' + s.id} className="btn-ghost" style={toggleBtn}>{open ? '접기' : '더 자세히 보기'}{chev(open)}</button>
              {open && (
                <div id={'d-' + s.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))', gap: 12, animation: 'ukFade .3s ease' }}>
                  {s.details.map(d => (
                    <div key={d.label} style={{ padding: '18px 20px', borderRadius: 18, border: '1px solid rgba(36,33,29,.1)', background: '#fff', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#3E3366' }}>{d.label}</h3>
                      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.75, color: '#3A352F' }}>{d.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {s.type === 'match' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,230px),1fr))', gap: 14 }}>
            {s.ranks.map(r => { const v = rankView(r); return (
              <article key={r.rank} style={{ position: 'relative', padding: '22px 20px', borderRadius: 22, background: '#fff', border: `1px solid ${v.bd}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <span style={{ position: 'absolute', top: 16, right: 16, fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: v.bg, color: v.fg }}>{v.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span aria-hidden="true" className="serif" style={{ width: 64, height: 64, borderRadius: '50%', background: v.z.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #FBF8F2', boxShadow: '0 0 0 1px rgba(36,33,29,.12)', fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{v.z.hanja}</span>
                  <h3 className="serif" style={{ margin: 0, fontSize: 21, fontWeight: 800 }}>{v.z.name}띠</h3>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{r.keywords.map(k => <span key={k} style={{ whiteSpace: 'nowrap', fontSize: 13.5, fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: '#ECE8F3', color: '#3E3366' }}>{k}</span>)}</div>
                <p style={{ margin: 0, fontSize: 14, color: '#5C4A1F', fontWeight: 600 }}>어울리는 관계 · {r.relation}</p>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.75, color: '#3A352F' }}>{r.reason}</p>
              </article>
            ); })}
          </div>
          <p style={{ margin: 0, fontSize: 14.5, color: '#4A453E', lineHeight: 1.6 }}>{s.notice}</p>
          <button onClick={onToggle} aria-expanded={open} className="btn-ghost" style={toggleBtn}>띠는 언제부터 바뀌나요?{chev(open)}</button>
          {open && <p style={{ margin: 0, padding: '18px 20px', borderRadius: 18, background: '#fff', border: '1px solid rgba(36,33,29,.1)', fontSize: 15, lineHeight: 1.75, color: '#3A352F', animation: 'ukFade .3s ease' }}>{s.boundary}</p>}
        </>
      )}

      {s.type === 'year' && (
        <>
          <div style={{ padding: '16px 20px', borderRadius: 18, background: '#ECE8F3', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#3E3366' }}>순위는 이렇게 정했어요</p>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.7, color: '#2E2A25' }}>{s.criteria}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {s.ranks.map(r => { const v = rankView(r); return (
              <article key={r.rank} style={{ padding: 20, borderRadius: 22, background: '#fff', border: `1px solid ${v.bd}`, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,200px),1fr))', gap: '16px 20px', alignItems: 'start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span aria-hidden="true" className="serif" style={{ flex: 'none', width: 60, height: 60, borderRadius: '50%', background: v.z.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #FBF8F2', boxShadow: '0 0 0 1px rgba(36,33,29,.12)', fontSize: 24, fontWeight: 800 }}>{v.z.hanja}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ alignSelf: 'flex-start', fontSize: 12.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: v.bg, color: v.fg }}>{v.label}</span>
                    <h3 className="serif" style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{v.z.name}띠</h3>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><span style={{ fontSize: 13, fontWeight: 700, color: '#7D5F24' }}>함께하면 좋은 활동</span><span style={{ fontSize: 16, fontWeight: 700 }}>{r.activity}</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><span style={{ fontSize: 13, fontWeight: 700, color: '#3E3366' }}>기대할 수 있는 점</span><span style={{ fontSize: 14.5, lineHeight: 1.7, color: '#3A352F' }}>{r.expect}</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><span style={{ fontSize: 13, fontWeight: 700, color: '#8A3B2E' }}>주의할 점</span><span style={{ fontSize: 14.5, lineHeight: 1.7, color: '#3A352F' }}>{r.caution}</span></div>
              </article>
            ); })}
          </div>
        </>
      )}
    </section>
  );
}
