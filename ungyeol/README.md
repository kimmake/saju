# 운결 (Ungyeol)

사주 분석 웹 서비스 — Next.js(App Router) + TypeScript. 디자인 레퍼런스는 `project/운결.dc.html`.

```bash
npm install
cp .env.example .env.local   # ANTHROPIC_API_KEY는 선택
npm run dev
```

- `lib/saju/` — 만세력 계산(`chart.ts`), 음력 변환·시각 보정(`calendar.ts`), 띠 궁합(`matches.ts`)
- 해석 문장: `ANTHROPIC_API_KEY`가 있으면 AI(`interpret.ts`), 없거나 실패하면 규칙 기반(`ruleInterpret.ts`: 일간·십신·지장간·월지/일지/시지·합충)
- `app/api/analyze` — 서버에서 계산과 해석을 수행

## 오늘의 운세 (`/today`)

사주 풀이와 별개로 쓸 수 있는 하루 한 장의 운세첩. `app/api/today`(POST: 운세, GET: 오늘 날짜·일진만)가 `lib/saju/today.ts`를 호출한다.

- 오늘 = 한국 시간(Asia/Seoul) 달력 날짜, 그 날짜의 일주가 일진 (자시 23시 기준 미적용). 날짜는 서버가 정하며 KST 자정에 바뀐다. 열어 둔 화면도 자정이 지나면 다시 불러온다.
- 기존 `computeChart`·`tenGod`·`rel`·`analyzeGods`를 그대로 쓴다: 일간 기준 오늘 천간·지지(본기)의 십성, 명식 지지와의 육합·삼합·충, 일간과의 천간합·충, 단순 강약(억부), 오행 보완·과다를 규칙으로 더해 5단계 등급과 문장을 만든다.
- 난수 없음. 문장 변형은 (명식 + 날짜) 해시로 골라 같은 조건이면 언제나 같은 결과가 나온다.
- 행운 요소: 강약으로 도움이 되는 오행 후보 → 오늘 일진의 오행까지 더해 가장 부족한 오행 → 오방색·하도의 수·방위·십이시진(한국 30분 늦춤) 배속.
- 출생 정보 재사용: 다른 서비스로 넘어갈 때 sessionStorage로 잠시 넘기고 받는 화면이 사용 여부를 묻는다. ‘이 기기에 저장’에 동의한 경우에만 localStorage에 둔다. 서버 저장 없음, 이름은 넘기지 않음.
- 공유 이미지(1080×1920)와 공유 링크(`/today`)에는 생년월일·출생 시간이 들어가지 않는다.

```bash
npx tsx scripts/today/check.ts   # 결정성·날짜 변화·KST 자정 경계·등급 분포·조사 점검
```

## 디자인

한국 전통 명리학 서책 × 현대 편집 디자인. 토큰과 컴포넌트 스타일은 `app/globals.css` 한 곳에 있다.

- 색: 한지 `#F5EFE2` · 아이보리 `#FBF8F0` · 먹 `#25231F` · 남색 `#142C46`(주 포인트) · 금박선 `#B4975D`(선·장식 전용, 글자는 `#7A6232`) · 녹색 `#355B49` · 낙관 `#943C32`
- 글꼴: 제목 Song Myung, 소제목·본문 Noto Serif KR, 입력·보조 UI Pretendard(npm 패키지로 자체 호스팅)
- 배경 에셋 `public/art/`: 한지 섬유 텍스처와 수묵 산수·원상은 `scripts/art/`의 스크립트로 렌더링한 래스터 이미지다 (그림 안에 글자 없음)
- 결과 이미지 저장: `lib/fontEmbed.ts`가 카드에 쓰인 글자의 유니코드 범위 조각만 골라 넣어 저장 속도를 유지한다

## 배포

Vercel: Root Directory `ungyeol`, Framework Preset Next.js. 해석에 AI를 쓰려면 환경 변수 `ANTHROPIC_API_KEY`를 추가한다.
