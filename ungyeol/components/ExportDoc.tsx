/* eslint-disable @next/next/no-img-element */
import { forwardRef } from 'react';
import DailySection from './DailySection';
import ResultScreen from './ResultScreen';
import { Knot, Stamp } from './Frame';
import type { AnalyzeResult } from '@/lib/saju/types';
import type { TodayResult } from '@/lib/saju/today';

interface Props { kind: 'full' | 'today'; today: TodayResult | null; saju: AnalyzeResult | null; title: string; birthLine: string; host: string }

/**
 * 저장 전용 문서: 화면에 보이는 결과 컴포넌트를 그대로(같은 데이터·같은 스타일) 모두 펼친 상태로 그린다.
 * 화면 밖 고정 너비(760px)에 그려 기기와 상관없이 같은 판면이 나온다.
 */
const ExportDoc = forwardRef<HTMLDivElement, Props>(function ExportDoc({ kind, today, saju, title, birthLine, host }, ref) {
  const saved = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
  return (
    <div aria-hidden="true" className="export-host">
      <div ref={ref} className="export-root">
        <div className="export-frame" />
        {[0, 1, 2, 3].map(i => <img key={i} className={`export-corner export-corner--${i}`} src="/art/corner.svg" alt="" />)}
        <img className="export-pine" src="/art/pine.webp" alt="" />
        <img className="export-sun" src="/art/sun.webp" alt="" />
        <header className="export-head">
          <span className="brush export-brand">운결<Stamp ch="命" /></span>
          <span className="export-han">運結 · {kind === 'full' ? '사주 해석서' : '오늘의 운세첩'}</span>
          <Knot />
        </header>
        {today && <DailySection r={today} print />}
        {kind === 'full' && saju && (
          <>
            <div className="part-divider">
              <Knot />
              <small>第二部</small>
              <h2 className="brush">나의 사주팔자</h2>
              <p>타고난 사주로 읽는 평생의 흐름 · 한 권의 해석서</p>
            </div>
            <ResultScreen result={saju} title={title} birthLine={birthLine} print />
          </>
        )}
        <footer className="export-foot">
          <Knot />
          <p>사주와 오늘의 운세는 전통 명리학에 기반한 참고용·오락용 콘텐츠예요. 중요한 결정은 현실적인 정보와 본인의 판단을 함께 고려해 주세요.</p>
          <p className="export-sign"><span className="brush">운결</span> {host} · {saved} 저장<Stamp ch="結" /></p>
        </footer>
      </div>
    </div>
  );
});
export default ExportDoc;
