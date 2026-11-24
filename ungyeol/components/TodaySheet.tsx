'use client';
import { useState } from 'react';
import { Chevron, Corners, Seal } from './Ornaments';
import type { TodayResult } from '@/lib/saju/today';

const NUM = ['一', '二', '三', '四', '五'];
const SECTIONS = [['t-total', '총운'], ['t-fields', '분야별 운세'], ['t-lucky', '행운의 요소'], ['t-match', '잘 맞는 띠'], ['t-word', '오늘의 한마디']] as const;

export function Grade({ score, label, large }: { score: number; label?: string; large?: boolean }) {
  return (
    <span className={`grade${large ? ' grade--lg' : ''}`} role="img" aria-label={`5단계 중 ${score}단계${label ? ` (${label})` : ''}`}>
      {[1, 2, 3, 4, 5].map(i => <i key={i} data-on={i <= score} />)}
      {label && <span className="grade__label" aria-hidden="true">{label}</span>}
    </span>
  );
}

export function Iljin({ date }: { date: TodayResult['date'] }) {
  return (
    <div className="iljin">
      <div className="iljin__ring" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/art/enso.webp" alt="" width={640} height={640} />
        <span>{date.ganzhi}</span>
      </div>
      <dl>
        <dt>오늘의 일진</dt>
        <dd>{date.ganzhi}日 · {date.ganzhiKo}일<small>{date.animal}의 날 · 한국 시간 자정 기준</small></dd>
      </dl>
    </div>
  );
}

/** 하루 한 장의 운세첩: 머리(날짜·일진) → 목차 → 一 총운 → 二 분야별 → 三 행운 → 四 띠 → 五 한마디 */
export default function TodaySheet({ r }: { r: TodayResult }) {
  const [basisOpen, setBasisOpen] = useState(false);
  return (
    <article className="sheet almanac" aria-labelledby="t-title">
      <Corners />
      <figure className="almanac__art" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/art/moon-panorama.webp" alt="" width={1600} height={760} />
      </figure>
      <header className="almanac__head">
        <p className="almanac__date">{r.date.label} {r.date.weekday} <span>· {r.date.lunar}</span></p>
        <h1 id="t-title" className="almanac__title">오늘의 운세</h1>
        <Iljin date={r.date} />
      </header>

      <nav aria-label="운세첩 목차">
        <ol className="contents">
          {SECTIONS.map(([id, label], i) => <li key={id}><a href={'#' + id}><b aria-hidden="true">{NUM[i]}</b>{label}</a></li>)}
        </ol>
      </nav>

      <section id="t-total" className="leaf" aria-labelledby="h-total">
        <div className="leaf-head"><b aria-hidden="true">一</b><h2 id="h-total">오늘의 총운</h2></div>
        <div className="overall">
          <div className="overall__top">
            <Grade score={r.total.score} label={r.total.grade} large />
            <ul className="keywords" aria-label="오늘의 핵심 키워드" style={{ margin: 0 }}>
              {r.total.keywords.map(k => <li key={k}># {k}</li>)}
            </ul>
          </div>
          <p className="overall__head">{r.total.headline}</p>
          <div className="overall__flow">{r.total.flow.map((p, i) => <p key={i}>{p}</p>)}</div>
          <div className="do-dont">
            <div className="caution"><h3>오늘 조심할 부분</h3><p>{r.total.caution}</p></div>
            <div className="action"><h3>적극적으로 해 보면 좋은 일</h3><p>{r.total.action}</p></div>
          </div>
        </div>
      </section>

      <section id="t-fields" className="leaf" aria-labelledby="h-fields">
        <div className="leaf-head"><b aria-hidden="true">二</b><h2 id="h-fields">분야별 운세</h2></div>
        <ul className="fields-list">
          {r.categories.map(c => (
            <li key={c.id} className="field-row">
              <span className="field-row__han" aria-hidden="true">{c.han}</span>
              <div className="field-row__top"><h3>{c.title}</h3><Grade score={c.score} label={c.grade} /></div>
              <p>{c.text}</p>
              <p className="field-row__tip"><b>오늘의 실천</b>{c.tip}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="t-lucky" className="leaf" aria-labelledby="h-lucky">
        <div className="leaf-head"><b aria-hidden="true">三</b><h2 id="h-lucky">오늘의 행운 요소</h2></div>
        <dl className="lucky">
          <div><dt>행운의 색상</dt><dd><span className="swatches">{r.lucky.colors.map(c => <span key={c.name} className="swatch"><i style={{ background: c.hex }} aria-hidden="true" />{c.name}</span>)}</span></dd></div>
          <div><dt>행운의 숫자</dt><dd><span className="numerals">{r.lucky.numbers.join(' · ')}</span></dd></div>
          <div><dt>행운의 방향</dt><dd>{r.lucky.direction}</dd></div>
          <div><dt>행운의 시간대</dt><dd>{r.lucky.time.range}<small>{r.lucky.time.name} · 한국 시각</small></dd></div>
          <div className="lucky__wide"><dt>행운의 물건</dt><dd>{r.lucky.item}</dd></div>
          <div className="lucky__wide"><dt>행운을 돕는 행동</dt><dd>{r.lucky.action}</dd></div>
        </dl>
        <p className="lucky-note">오늘의 행운 오행 {r.lucky.elementLabel} · {r.lucky.note}</p>
      </section>

      <section id="t-match" className="leaf" aria-labelledby="h-match">
        <div className="leaf-head"><b aria-hidden="true">四</b><h2 id="h-match">오늘 나와 잘 맞는 띠</h2></div>
        <div>
          {r.matches.map(m => (
            <article key={m.rank} className="zrank" data-rank={m.rank}>
              <span className="zmark" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/art/enso.webp" alt="" width={640} height={640} />
                <span>{m.hanja}</span>
              </span>
              <div className="zrank__name"><small>{m.rank}위</small><h3>{m.name}띠</h3></div>
              <p>{m.reason}</p>
              <p className="zrank__adv"><b>관계 조언</b>{m.advice}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="t-word" className="maxim" aria-labelledby="h-word">
        <h2 id="h-word" className="maxim__label">五 · 오늘의 한마디</h2>
        <blockquote>“{r.word}”</blockquote>
        <Seal />
      </section>

      <div className="basis">
        <button className="link-btn" aria-expanded={basisOpen} aria-controls="t-basis" onClick={() => setBasisOpen(o => !o)}>이렇게 풀었어요<Chevron open={basisOpen} /></button>
        {basisOpen && (
          <ul id="t-basis">
            <li>내 일주 {r.basis.dayPillar}({r.basis.dayPillarKo}) · 명식의 강약 {r.basis.strength} · 오늘 천간의 십성 {r.basis.stemGod} · 오늘 지지(본기)의 십성 {r.basis.branchGod}</li>
            {r.basis.relations.length ? r.basis.relations.map(x => <li key={x}>{x}</li>) : <li>오늘의 간지는 명식과 뚜렷한 합·충을 이루지 않아요.</li>}
            {r.notes.map(n => <li key={n}>{n}</li>)}
          </ul>
        )}
      </div>
    </article>
  );
}
