/* eslint-disable @next/next/no-img-element */
import { forwardRef } from 'react';
import type { TodayResult } from '@/lib/saju/today';

const SERIF = "'Noto Serif KR', serif";
const BRUSH = "'ChosunGs', 'Song Myung', serif";
const SANS = "'Pretendard Variable', Pretendard, sans-serif";
const GOLD = 'rgba(180,151,93,.85)', NAVY = '#142C46', INK = '#25231F';
const DIR_HAN: Record<string, string> = { 동쪽: '東', 서쪽: '西', 남쪽: '南', 북쪽: '北' };

function Star({ on, size = 11 }: { on: boolean; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block' }}><path d="M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17l-5.7 3.1 1.2-6.4L2.8 9.3l6.4-.8z" fill={on ? NAVY : 'none'} stroke={on ? NAVY : '#B4975D'} strokeWidth="1.6" /></svg>;
}
const Stars = ({ n, size }: { n: number; size?: number }) => <span style={{ display: 'inline-flex', gap: 1 }}>{[1, 2, 3, 4, 5].map(i => <Star key={i} on={i <= n} size={size} />)}</span>;
const Head = ({ t }: { t: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: SERIF, fontSize: 12.5, fontWeight: 700, color: INK, marginBottom: 7 }}>
    <span style={{ width: 34, height: 1, background: GOLD }} /><span style={{ width: 5, height: 5, background: '#B4975D', transform: 'rotate(45deg)' }} />{t}<span style={{ width: 5, height: 5, background: '#B4975D', transform: 'rotate(45deg)' }} /><span style={{ width: 34, height: 1, background: GOLD }} />
  </div>
);

/**
 * 오늘의 운세 공유 포스터: 540×960 → 1080×1920 (9:16).
 * 브랜드·날짜·핵심 운세·분야별 요약·행운의 색과 숫자·오늘의 띠·한마디·주소. 이름·생년월일·출생 시간은 넣지 않는다.
 */
const TodayPoster = forwardRef<HTMLDivElement, { r: TodayResult; host: string }>(function TodayPoster({ r, host }, ref) {
  return (
    <div aria-hidden="true" style={{ position: 'fixed', left: -10000, top: 0, pointerEvents: 'none' }}>
      <div ref={ref} style={{ width: 540, height: 960, boxSizing: 'border-box', position: 'relative', overflow: 'hidden', backgroundColor: '#F5EFE2', backgroundImage: "url('/art/hanji.webp')", backgroundSize: '720px 720px', color: INK, fontFamily: SANS, wordBreak: 'keep-all' }}>
        <img src="/art/pine.webp" alt="" style={{ position: 'absolute', left: 10, top: 10, width: 230, opacity: 0.9 }} />
        <img src="/art/sun.webp" alt="" style={{ position: 'absolute', right: 44, top: 40, width: 58, opacity: 0.85 }} />
        <img src="/art/landscape-mist.webp" alt="" style={{ position: 'absolute', left: 0, top: 176, width: 540, height: 120, objectFit: 'cover', opacity: 0.32 }} />
        <img src="/art/landscape-peaks.webp" alt="" style={{ position: 'absolute', left: 0, bottom: 0, width: 540, opacity: 0.16 }} />
        <div style={{ position: 'absolute', inset: 12, border: `1px solid ${GOLD}` }} />
        <div style={{ position: 'absolute', inset: 16, border: '1px solid rgba(180,151,93,.38)' }} />
        {[0, 1, 2, 3].map(i => <img key={i} src="/art/corner.svg" alt="" style={{ position: 'absolute', width: 34, ...(i < 2 ? { top: 11 } : { bottom: 11 }), ...(i % 2 ? { right: 11 } : { left: 11 }), transform: `scale(${i % 2 ? -1 : 1}, ${i > 1 ? -1 : 1})` }} />)}

        <div style={{ position: 'relative', padding: '118px 40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <span style={{ fontFamily: SERIF, fontSize: 13.5, fontWeight: 600 }}>{r.date.label} · {r.date.weekday}</span>
          <span style={{ fontFamily: BRUSH, fontSize: 56, lineHeight: 1.12, marginTop: 4, letterSpacing: '0.04em' }}>오늘의 운세</span>
          <span style={{ fontFamily: SERIF, fontSize: 11.5, color: '#625C51', marginTop: 2 }}>{r.date.lunar} · 일진 {r.date.ganzhi}日 {r.date.ganzhiKo}일</span>
        </div>

        <div style={{ position: 'relative', margin: '20px 30px 0', display: 'flex', alignItems: 'stretch', border: `1px solid ${GOLD}`, background: 'rgba(251,248,240,.85)' }}>
          <div style={{ width: 46, margin: 4, alignSelf: 'stretch', background: NAVY, color: '#FBF8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: BRUSH, fontSize: 22, writingMode: 'vertical-rl', letterSpacing: '0.2em' }}>총운</div>
          <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 800, lineHeight: 1.4 }}>{r.total.headline}</span>
            <span style={{ fontSize: 12, lineHeight: 1.65, color: '#4D483F' }}>{r.total.summary}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Stars n={r.total.score} size={14} /><span style={{ fontFamily: SERIF, fontSize: 12, fontWeight: 700, color: NAVY }}>{r.total.grade}</span><span style={{ fontSize: 11, color: '#4D483F' }}>{r.total.keywords.map(k => '#' + k).join('  ')}</span></span>
          </div>
        </div>

        <div style={{ position: 'relative', margin: '16px 30px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <Head t="분야별 운세" />
            {r.categories.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(37,35,31,.12)', fontFamily: SERIF, fontSize: 12.5, fontWeight: 600 }}>{c.title}<Stars n={c.score} /></div>
            ))}
          </div>
          <div>
            <Head t="오늘의 행운" />
            {([
              ['색', <span key="c" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>{r.lucky.colors.map(c => <span key={c.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><i style={{ width: 11, height: 11, borderRadius: '50%', background: c.hex, border: '1px solid rgba(37,35,31,.3)', display: 'inline-block' }} />{c.name}</span>)}</span>],
              ['숫자', r.lucky.numbers.join(', ')],
              ['방향', `${DIR_HAN[r.lucky.direction] ?? '中'} ${r.lucky.direction}`],
              ['시간', r.lucky.time.range],
              ['물건', r.lucky.item],
            ] as const).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid rgba(37,35,31,.12)', fontFamily: SERIF, fontSize: 12, alignItems: 'center' }}><span style={{ color: '#7A6232', fontWeight: 700, width: 26, flex: 'none' }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span></div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', margin: '16px 30px 0' }}>
          <Head t="오늘 나와 잘 맞는 띠" />
          <div style={{ display: 'flex', justifyContent: 'center', gap: 22 }}>
            {r.matches.map(m => (
              <div key={m.rank} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 70, height: 70, borderRadius: '50%', background: '#FFFDF8', border: `1px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}><img src={`/art/zodiac/${m.animal}.webp`} alt="" style={{ width: 62 }} /></span>
                <span style={{ fontFamily: SERIF, fontSize: 11.5, fontWeight: 700, padding: '2px 9px', background: m.rank === 1 ? NAVY : '#EFE4CC', color: m.rank === 1 ? '#FBF8F0' : INK, border: `1px solid ${m.rank === 1 ? NAVY : GOLD}` }}>{m.rank}위 {m.name}띠</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', margin: '22px 30px 0', padding: '24px 24px 30px', border: '2px solid #355B49', boxShadow: 'inset 0 0 0 4px #FBF8F0, inset 0 0 0 5px rgba(53,91,73,.55)', background: 'rgba(251,248,240,.88)', textAlign: 'center' }}>
          <div style={{ fontFamily: SERIF, fontSize: 12.5, fontWeight: 700, color: '#355B49', letterSpacing: '0.12em', marginBottom: 6 }}>오늘의 한마디</div>
          <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, lineHeight: 1.8 }}>“{r.word}”</div>
          <div style={{ marginTop: 10, fontSize: 11.5, color: '#355B49', lineHeight: 1.6 }}>오늘의 실천 · {r.total.advice}</div>
          <span style={{ position: 'absolute', right: 9, bottom: 8, width: 22, height: 22, background: '#943C32', color: '#FBF1EA', fontFamily: SERIF, fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3 }}>結</span>
        </div>

        <div style={{ position: 'absolute', left: 30, right: 30, bottom: 30, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}><span style={{ fontFamily: BRUSH, fontSize: 26 }}>운결</span><span style={{ fontFamily: SERIF, fontSize: 10.5, color: '#7A6232', letterSpacing: '0.3em' }}>運結</span></span>
          <span style={{ textAlign: 'right', fontSize: 10, lineHeight: 1.5, color: '#4D483F' }}><b style={{ fontFamily: SERIF, fontSize: 11.5, color: NAVY }}>{host}</b><br />전통 명리학에 기반한 참고용·오락용 콘텐츠입니다.</span>
        </div>
      </div>
    </div>
  );
});
export default TodayPoster;
