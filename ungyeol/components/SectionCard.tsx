import { ZODIAC } from '@/lib/saju/constants';
import { Chevron, RuleOrn } from './Ornaments';
import type { MatchRank, Section, YearRank } from '@/lib/saju/types';

const RANK_HAN = ['一', '二', '三'];
const rankView = (r: MatchRank | YearRank) => ({ z: ZODIAC[r.animal], label: `${r.rank}위`, han: RANK_HAN[r.rank - 1] });

interface Props { section: Section; no: string; first?: boolean; open: boolean; onToggle: () => void; print?: boolean }

/** 해석서의 한 장(章). 카드 대신 금박 구분선과 소제목으로 나눈다. */
export default function SectionCard({ section: s, no, first, open: openProp, onToggle, print }: Props) {
  const open = print || openProp;
  return (
    <section id={print ? undefined : 'sec-' + s.id} aria-labelledby={'h-' + s.id} className="chapter">
      {!first && <RuleOrn className="chapter__orn" />}
      <div className="chapter__head">
        <span aria-hidden="true" className="chapter__icon">{s.icon}</span>
        <div style={{ minWidth: 0 }}>
          <span className="chapter__kicker">第{no}章</span>
          <h2 id={'h-' + s.id} className="chapter__title">{s.title}</h2>
        </div>
      </div>
      <p className="chapter__summary">{s.summary}</p>

      {s.type === 'fortune' && (
        <>
          <div className="chapter__body">
            {s.body.map((para, i) => <p key={i}>{para}</p>)}
          </div>
          {s.tips.length > 0 && (
            <div className="tips">
              <h3><i aria-hidden="true" />이렇게 활용해 보세요</h3>
              <ol>
                {s.tips.map((t, i) => <li key={i}><b aria-hidden="true">{RANK_HAN[i] ?? i + 1}</b><span>{t}</span></li>)}
              </ol>
            </div>
          )}
          {s.details.length > 0 && (
            <div className="more">
              {!print && <button onClick={onToggle} aria-expanded={open} aria-controls={'d-' + s.id} className="link-btn">{open ? '접기' : '더 자세히 보기'}<Chevron open={open} /></button>}
              {open && (
                <dl id={'d-' + s.id} className="details">
                  {s.details.map(d => <div key={d.label}><dt>{d.label}</dt><dd>{d.text}</dd></div>)}
                </dl>
              )}
            </div>
          )}
        </>
      )}

      {s.type === 'match' && (
        <>
          <div className="ranks ranks--cols">
            {s.ranks.map(r => { const v = rankView(r); return (
              <article key={r.rank} className="rank" data-rank={r.rank}>
                <div className="rank__id">
                  <span aria-hidden="true" className="zodiac">{v.z.hanja}</span>
                  <div>
                    <span className="rank__no">{v.label}</span>
                    <h3 className="rank__name">{v.z.name}띠</h3>
                  </div>
                </div>
                <p className="rank__kw">{r.keywords.join(' · ')}</p>
                <p className="rank__rel">어울리는 관계 · {r.relation}</p>
                <p className="rank__reason">{r.reason}</p>
              </article>
            ); })}
          </div>
          <p className="ranks-note">{s.notice}</p>
          <div className="more">
            {print ? <p className="sub-h" style={{ marginTop: 8 }}><i aria-hidden="true" />띠는 언제부터 바뀌나요?</p> : <button onClick={onToggle} aria-expanded={open} aria-controls={'d-' + s.id} className="link-btn">띠는 언제부터 바뀌나요?<Chevron open={open} /></button>}
            {open && <p id={'d-' + s.id} className="boundary">{s.boundary}</p>}
          </div>
        </>
      )}

      {s.type === 'year' && (
        <>
          <div className="criteria">
            <h3>순위는 이렇게 정했어요</h3>
            <p>{s.criteria}</p>
          </div>
          <div className="ranks">
            {s.ranks.map(r => { const v = rankView(r); return (
              <article key={r.rank} className="yrank rank" data-rank={r.rank} style={{ padding: '22px 0' }}>
                <div className="rank__id">
                  <span aria-hidden="true" className="zodiac">{v.z.hanja}</span>
                  <div>
                    <span className="rank__no">{v.label}</span>
                    <h3 className="rank__name">{v.z.name}띠</h3>
                  </div>
                </div>
                <div className="yrank__cell"><b>함께하면 좋은 활동</b><span className="strong">{r.activity}</span></div>
                <div className="yrank__cell"><b>기대할 수 있는 점</b><span>{r.expect}</span></div>
                <div className="yrank__cell"><b className="caution">주의할 점</b><span>{r.caution}</span></div>
              </article>
            ); })}
          </div>
        </>
      )}
    </section>
  );
}
