/* eslint-disable @next/next/no-img-element */
import { Arrow, Knot, Stamp } from './Frame';

interface Props {
  savedLine: string | null;            // 저장된 출생 정보 요약 (있으면 재방문)
  onStart: () => void;                 // 처음: 입력 화면으로
  onToday: () => void;                 // 재방문: 오늘의 운세 바로
  onSaju: () => void;                  // 재방문: 사주 다시 보기
  onEdit: () => void;                  // 재방문: 출생 정보 변경
  onForget: () => void;                // 저장 정보 삭제
}

/** 표지: 서책을 펼치기 전의 첫 장. 소나무와 붉은 해, 붓글씨 상호, 산수, 두 갈래 안내, 하나의 시작 버튼. */
export default function HomeCover({ savedLine, onStart, onToday, onSaju, onEdit, onForget }: Props) {
  return (
    <main className="cover-page">
      <img className="cover-page__pine" src="/art/pine.webp" alt="" aria-hidden="true" width={1200} height={608} fetchPriority="high" />
      <img className="cover-page__sun" src="/art/sun.webp" alt="" aria-hidden="true" width={300} height={300} />

      <header className="cover-head">
        <p className="cover-head__kicker">나의 운을 읽고, 좋은 인연을 연결하다</p>
        <h1 className="brush"><span>운결</span><Stamp ch="命" /></h1>
        <p className="cover-head__sub"><b>運結</b>사주로 읽는 나의 흐름</p>
      </header>

      <figure className="cover-land" aria-hidden="true" style={{ marginBlock: 0 }}><img src="/art/landscape-mist.webp" alt="" width={1400} height={372} /></figure>
      <Knot />

      <section className="panels" aria-label="운결에서 볼 수 있는 이야기">
        <article className="panel">
          <img src="/art/books-brush.webp" alt="" aria-hidden="true" width={560} height={260} />
          <div>
            <h2>나의 사주팔자</h2>
            <p>타고난 기질과 평생의 흐름. 자녀운·배우자운·금전운·직장운·공부운, 띠별 궁합과 2027년 운세까지 한 권으로 풀어 드려요.</p>
          </div>
        </article>
        <article className="panel">
          <img src="/art/lantern.webp" alt="" aria-hidden="true" width={330} height={560} style={{ width: '62%', justifySelf: 'center' }} />
          <img className="panel__plum" src="/art/plum.webp" alt="" aria-hidden="true" width={900} height={791} />
          <div>
            <h2>오늘의 운세</h2>
            <p>매일 자정 새로 펼치는 하루 한 장의 운세첩. 총운과 분야별 운세, 행운 요소, 오늘 잘 맞는 띠를 알려 드려요.</p>
          </div>
        </article>
      </section>

      <div className="cover-cta">
        {savedLine ? (
          <>
            <button className="cta cta--block" onClick={onToday}>오늘의 운세 바로 확인하기 <Arrow /></button>
            <div className="row">
              <button className="btn btn--secondary" onClick={onSaju}>나의 사주 다시 확인하기</button>
              <button className="btn btn--secondary" onClick={onEdit}>출생 정보 변경하기</button>
            </div>
            <p className="cover-saved">이 기기에 저장된 정보: {savedLine} · <button className="link-btn" style={{ minHeight: 32, fontSize: 13 }} onClick={onForget}>저장 정보 삭제</button></p>
          </>
        ) : (
          <>
            <button className="cta cta--block" onClick={onStart}>나의 사주와 오늘의 운세 확인하기 <Arrow /></button>
            <p className="note">출생 정보를 한 번만 입력하면 오늘의 운세와 전체 사주 풀이를 함께 볼 수 있어요.</p>
          </>
        )}
      </div>

      <figure className="cover-foot" aria-hidden="true" style={{ marginBlock: '26px 0' }}>
        <img className="land" src="/art/landscape-mist.webp" alt="" width={1400} height={372} loading="lazy" />
        <img className="plum" src="/art/plum.webp" alt="" width={900} height={791} loading="lazy" />
      </figure>
    </main>
  );
}
