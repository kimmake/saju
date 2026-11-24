import { forwardRef } from 'react';
import type { TodayResult } from '@/lib/saju/today';

const SERIF = "'Noto Serif KR', serif";
const DISPLAY = "'Song Myung', 'Noto Serif KR', serif";
const SANS = "'Pretendard Variable', Pretendard, sans-serif";
const GOLD = 'rgba(180,151,93,.85)';

/**
 * 세로형 공유 이미지(540×960 → 1080×1920, 9:16). 날짜·일진·총운·행운 요소·오늘의 한마디만 담는다.
 * 생년월일·출생 시간·이름·개인 일주 등 출생 정보는 넣지 않는다.
 */
const TodayShareCard = forwardRef<HTMLDivElement, { r: TodayResult }>(function TodayShareCard({ r }, ref) {
  const label = (t: string) => <span style={{ fontFamily: SERIF, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.14em', color: '#7A6232' }}>{t}</span>;
  return (
    <div aria-hidden="true" style={{ position: 'fixed', left: -10000, top: 0, pointerEvents: 'none' }}>
      <div ref={ref} style={{ width: 540, height: 960, boxSizing: 'border-box', position: 'relative', overflow: 'hidden', backgroundColor: '#F5EFE2', backgroundImage: "url('/art/hanji.webp')", backgroundSize: '720px 720px', color: '#25231F', fontFamily: SANS, wordBreak: 'keep-all' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/art/moon-panorama.webp" alt="" style={{ position: 'absolute', left: 0, top: 0, width: 540, height: 168, objectFit: 'cover', objectPosition: '70% 22%', opacity: 0.8, WebkitMaskImage: 'linear-gradient(#000 55%, transparent)', maskImage: 'linear-gradient(#000 55%, transparent)' }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/art/mountains-left.webp" alt="" style={{ position: 'absolute', left: 0, bottom: 0, width: 300, opacity: 0.22 }} />
        <div style={{ position: 'absolute', inset: 16, border: `1px solid ${GOLD}` }} />
        <div style={{ position: 'absolute', inset: 21, border: '1px solid rgba(180,151,93,.38)' }} />

        <div style={{ position: 'relative', padding: '178px 48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <span style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 600 }}>{r.date.label} {r.date.weekday}</span>
          <span style={{ fontFamily: SERIF, fontSize: 12, color: '#625C51', marginTop: 2 }}>{r.date.lunar} · {r.date.ganzhi}日 {r.date.ganzhiKo}일</span>
          <span style={{ fontFamily: DISPLAY, fontSize: 52, lineHeight: 1.15, letterSpacing: '0.04em', marginTop: 10 }}>오늘의 운세</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            {label('오늘의 총운')}
            <span style={{ display: 'inline-flex', gap: 5 }}>{[1, 2, 3, 4, 5].map(i => <i key={i} style={{ width: 10, height: 10, transform: 'rotate(45deg)', border: '1px solid #142C46', background: i <= r.total.score ? '#142C46' : 'transparent', display: 'inline-block' }} />)}</span>
            <span style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 700, color: '#142C46' }}>{r.total.grade}</span>
          </div>
          <p style={{ margin: '14px 0 0', fontFamily: SERIF, fontSize: 18, fontWeight: 700, lineHeight: 1.6, color: '#142C46' }}>{r.total.headline}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {r.total.keywords.map(k => <span key={k} style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 600, padding: '4px 11px', color: '#142C46', border: '1px solid rgba(20,44,70,.3)', background: 'rgba(251,248,240,.7)' }}># {k}</span>)}
          </div>
        </div>

        <div style={{ position: 'relative', margin: '26px 48px 0', borderTop: `1px solid ${GOLD}`, borderBottom: `1px solid ${GOLD}`, display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 0 }}>
          {([
            ['행운의 색상', <span key="c" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{r.lucky.colors.map(c => <span key={c.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><i style={{ width: 20, height: 20, background: c.hex, border: '1px solid rgba(37,35,31,.25)', display: 'inline-block' }} />{c.name}</span>)}</span>],
            ['행운의 숫자', <span key="n" style={{ fontFamily: DISPLAY, fontSize: 24, color: '#142C46', letterSpacing: '0.1em' }}>{r.lucky.numbers.join(' · ')}</span>],
            ['행운의 방향', r.lucky.direction],
            ['행운의 시간', `${r.lucky.time.range}`],
          ] as const).map(([k, v], i) => (
            <div key={k} style={{ padding: '14px 0', paddingLeft: i % 2 ? 16 : 0, borderLeft: i % 2 ? '1px solid rgba(37,35,31,.14)' : 'none', borderTop: i > 1 ? '1px solid rgba(37,35,31,.14)' : 'none', display: 'flex', flexDirection: 'column', gap: 6, fontFamily: SERIF, fontSize: 14.5, fontWeight: 600 }}>
              {label(k)}<span>{v}</span>
            </div>
          ))}
        </div>
        <p style={{ position: 'relative', margin: '14px 48px 0', fontFamily: SERIF, fontSize: 13.5, lineHeight: 1.7, textAlign: 'center', color: '#4D483F' }}>행운의 물건 · {r.lucky.item}<br />{r.lucky.action}</p>

        <div style={{ position: 'relative', margin: '36px 48px 0', padding: '32px 26px 36px', border: '1px solid #25231F', boxShadow: 'inset 0 0 0 4px #FBF8F0, inset 0 0 0 5px rgba(180,151,93,.75)', background: 'rgba(251,248,240,.75)', textAlign: 'center' }}>
          <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', padding: '0 10px', background: '#F5EFE2', fontFamily: SERIF, fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', color: '#7A6232', whiteSpace: 'nowrap' }}>오늘의 한마디</span>
          <span style={{ fontFamily: DISPLAY, fontSize: 21, lineHeight: 1.7 }}>“{r.word}”</span>
          <span style={{ position: 'absolute', right: 10, bottom: 10, width: 26, height: 26, background: '#943C32', color: '#FBF1EA', fontFamily: SERIF, fontWeight: 700, fontSize: 10, lineHeight: 1.05, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 3 }}><span>運</span><span>結</span></span>
        </div>

        <div style={{ position: 'absolute', left: 48, right: 48, bottom: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><span style={{ fontFamily: DISPLAY, fontSize: 22 }}>운결</span><span style={{ fontFamily: SERIF, fontSize: 11, color: '#7A6232', letterSpacing: '0.3em' }}>運結</span></span>
          <span style={{ fontSize: 10, color: '#625C51', textAlign: 'right', lineHeight: 1.5 }}>전통 명리학 해석을 바탕으로 한<br />참고용 콘텐츠입니다.</span>
        </div>
      </div>
    </div>
  );
});
export default TodayShareCard;
