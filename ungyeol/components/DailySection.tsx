'use client';
/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import { Chevron } from './Ornaments';
import { Knot, Stamp, Stars } from './Frame';
import type { TodayResult } from '@/lib/saju/today';

const DIR_HAN: Record<string, string> = { 동쪽: '東', 서쪽: '西', 남쪽: '南', 북쪽: '北' };
const dirHan = (d: string) => DIR_HAN[d] ?? '中';

interface Props { r: TodayResult; busy?: boolean; msg?: string; msgErr?: boolean; onSave?: () => void; onShare?: () => void; print?: boolean }

/** 오늘의 운세: 매일 한 장씩 받는 운세첩. 결과 페이지 맨 위에 놓인다. */
export default function DailySection({ r, busy, msg, msgErr, onSave, onShare, print }: Props) {
  const [totalOpenS, setTotalOpen] = useState(false);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [basisOpenS, setBasisOpen] = useState(false);
  const totalOpen = print || totalOpenS, basisOpen = print || basisOpenS;
  const L = r.lucky;

  return (
    <section id={print ? undefined : 'today'} className="daily" aria-labelledby="today-title">
      <header className="daily-head">
        <div className="daily-head__land" aria-hidden="true"><img src="/art/landscape-mist.webp" alt="" width={1400} height={372} /></div>
        <p className="daily-date"><img src="/art/cloud.svg" alt="" aria-hidden="true" width={96} height={30} />{r.date.label} · {r.date.weekday}<img src="/art/cloud.svg" alt="" aria-hidden="true" width={96} height={30} /></p>
        <h1 id="today-title" className="brush">오늘의 운세<Stamp /></h1>
        <p className="daily-iljin">{r.date.lunar} · 오늘의 일진 <b>{r.date.ganzhi}日</b> ({r.date.ganzhiKo}일)</p>
        <Knot />
      </header>

      <div className="total">
        <div className="total__label" aria-hidden="true">총운</div>
        <div className="total__body">
          <h2><span className="sr-only">오늘의 총운: </span>{r.total.headline}</h2>
          <div className="total__meta"><Stars score={r.total.score} label={r.total.grade} large /><span className="grade-txt">{r.total.grade}</span></div>
          <p>{r.total.summary}</p>
          <ul className="keywords" aria-label="오늘의 핵심 키워드" style={{ margin: 0 }}>{r.total.keywords.map(k => <li key={k}># {k}</li>)}</ul>
          {!print && <button className="link-btn" style={{ alignSelf: 'flex-start' }} aria-expanded={totalOpen} aria-controls="total-more" onClick={() => setTotalOpen(o => !o)}>{totalOpen ? '총운 접기' : '총운 자세히 보기'}<Chevron open={totalOpen} /></button>}
          {totalOpen && (
            <dl id="total-more" className="total__more">
              <div><dt>오늘의 흐름</dt><dd>{r.total.flow.map((p, i) => <p key={i}>{p}</p>)}</dd></div>
              <div><dt>찾아올 수 있는 기회</dt><dd>{r.total.chance}</dd></div>
              <div><dt className="warn">주의하면 좋은 부분</dt><dd>{r.total.caution}</dd></div>
              <div><dt>적극적으로 해 보면 좋은 일</dt><dd>{r.total.action}</dd></div>
              <div><dt>일상 속 실천</dt><dd>{r.total.advice}</dd></div>
            </dl>
          )}
          <img className="total__plum" src="/art/plum.webp" alt="" aria-hidden="true" width={900} height={791} />
        </div>
      </div>

      <div className="twin">
        <section aria-labelledby="h-fields">
          <h2 id="h-fields" className="orn-h"><i aria-hidden="true" />분야별 운세<i aria-hidden="true" /></h2>
          <ul className="frows">
            {r.categories.map(c => {
              const open = print || openCat === c.id;
              return (
                <li key={c.id} className="frow">
                  <button aria-expanded={open} aria-controls={'fd-' + c.id} onClick={() => setOpenCat(o => (o === c.id ? null : c.id))}>
                    <span>{c.title}<small aria-hidden="true">{c.han}</small></span>
                    <Stars score={c.score} label={c.grade} />
                    {!print && <Chevron open={open} />}
                  </button>
                  {open && (
                    <div id={'fd-' + c.id} className="frow__detail">
                      <span className="kw">#{c.keyword} · {c.grade}</span>
                      <p>{c.text}</p>
                      <p className="tip"><b>오늘의 실천</b>{c.tip}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {!print && <p className="daily-note" style={{ marginTop: 8, textAlign: 'left' }}>항목을 누르면 자세한 풀이가 펼쳐져요.</p>}
        </section>

        <section aria-labelledby="h-lucky">
          <h2 id="h-lucky" className="orn-h"><i aria-hidden="true" />오늘의 행운<i aria-hidden="true" /></h2>
          <dl className="lrows">
            <div className="lrow"><span className="licon licon--swatch" style={{ background: L.colors[0].hex }} aria-hidden="true" /><dt>행운의 색</dt><dd>{L.colors.map(c => <span key={c.name} className="sw"><i style={{ background: c.hex }} aria-hidden="true" />{c.name}</span>)}</dd></div>
            <div className="lrow"><span className="licon" aria-hidden="true">{L.numbers[0]}</span><dt>행운의 숫자</dt><dd>{L.numbers.join(', ')}</dd></div>
            <div className="lrow"><span className="licon" aria-hidden="true">{dirHan(L.direction)}</span><dt>행운의 방향</dt><dd>{L.direction}</dd></div>
            <div className="lrow"><span className="licon" aria-hidden="true">時</span><dt>행운의 시간</dt><dd>{L.time.range}<small>{L.time.name} · 한국 시각</small></dd></div>
            <div className="lrow"><span className="licon" aria-hidden="true">物</span><dt>행운의 물건</dt><dd>{L.item}</dd></div>
            <div className="lrow"><span className="licon" aria-hidden="true">行</span><dt>행운의 행동</dt><dd>{L.action}</dd></div>
          </dl>
          <p className="lucky-why">오늘의 행운 오행 {L.elementLabel}. {L.note}</p>
        </section>
      </div>

      <section className="zodiac-today" aria-labelledby="h-zt">
        <h2 id="h-zt" className="orn-h"><i aria-hidden="true" />오늘 나와 잘 맞는 띠<i aria-hidden="true" /></h2>
        <p className="sub">평생 궁합·2027년 궁합과 달리, 오늘의 일진({r.date.ganzhi})으로 본 하루 궁합이에요.</p>
        <ol className="medals">
          {r.matches.map(m => (
            <li key={m.rank} className="medal" data-rank={m.rank}>
              <span className="medal__ring"><img src={`/art/zodiac/${m.animal}.webp`} alt={`${m.name} 그림`} width={400} height={400} loading={print ? undefined : 'lazy'} /></span>
              <span className="medal__pill">{m.rank}위 {m.name}띠</span>
            </li>
          ))}
        </ol>
        <ul className="zwhy">
          {r.matches.map(m => (
            <li key={m.rank}><b>{m.rank}위 {m.name}띠 <span aria-hidden="true" style={{ color: 'var(--gold-text)' }}>{m.hanja}</span></b><p>{m.reason}</p><p className="adv"><span>관계 조언</span>{m.advice}</p></li>
          ))}
        </ul>
      </section>

      <section className="maxim2" aria-labelledby="h-word">
        <div className="maxim2__land" aria-hidden="true"><img src="/art/landscape-mist.webp" alt="" width={1400} height={372} /></div>
        <h2 id="h-word" className="orn-h" style={{ color: 'var(--green)' }}><i aria-hidden="true" />오늘의 한마디<i aria-hidden="true" /></h2>
        <blockquote>“{r.word}”</blockquote>
        <Stamp ch="結" />
      </section>

      <div className="basis2">
        {print ? <p className="sub-h"><i aria-hidden="true" />이렇게 풀었어요 · 해석 범위 안내</p> : <button className="link-btn" aria-expanded={basisOpen} aria-controls="t-basis" onClick={() => setBasisOpen(o => !o)}>이렇게 풀었어요 · 해석 범위 안내<Chevron open={basisOpen} /></button>}
        {basisOpen && (
          <ul id="t-basis">
            <li>내 일주 {r.basis.dayPillar}({r.basis.dayPillarKo}) · 명식의 강약 {r.basis.strength} · 오늘 천간의 십성 {r.basis.stemGod} · 오늘 지지(본기)의 십성 {r.basis.branchGod}</li>
            {r.basis.relations.length ? r.basis.relations.map(x => <li key={x}>{x}</li>) : <li>오늘의 간지는 명식과 뚜렷한 합·충을 이루지 않아요.</li>}
            {r.scope.map(x => <li key={x} className="scope">{x}</li>)}
            {r.notes.map(n => <li key={n}>{n}</li>)}
          </ul>
        )}
      </div>

      {!print && (
        <>
          <div className="daily-actions">
            <button className="btn btn--primary" onClick={onSave} aria-busy={busy}>{busy ? '이미지 만드는 중…' : '결과 저장하기'}</button>
            <button className="btn btn--ghost" onClick={onShare}>링크 공유하기</button>
          </div>
          <p aria-live="polite" className="save-msg" data-error={msgErr} style={{ textAlign: 'center', margin: 0 }}>{msg}</p>
          <p className="daily-note">한국 시간 매일 자정에 새 운세로 바뀌어요. 공유 링크와 SNS 이미지에는 이름·생년월일·출생 시간이 들어가지 않아요.</p>
        </>
      )}
    </section>
  );
}
