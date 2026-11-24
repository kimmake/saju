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

## 흐름과 오늘의 운세

표지 → 출생 정보 한 번 입력 → 결과(맨 위 오늘의 운세, 이어서 전체 사주). `/api/today`와 기존 `/api/analyze`를 동시에 요청한다. 예전 `/today` 링크는 `/?go=today`로 이어진다.

- 오늘 = 한국 시간(Asia/Seoul) 달력 날짜, 그 날짜의 일주가 일진 (자시 23시 기준 미적용). 열어 둔 화면은 자정이 지나면 오늘의 운세만 다시 받는다(사주는 다시 계산하지 않음).
- `lib/saju/today.ts`는 기존 `computeChart`·`tenGod`·`rel`·`analyzeGods`를 그대로 쓴다: 일간 기준 오늘 천간·지지(본기)의 십성, 명식 지지와의 육합·삼합·충, 일간과의 천간합·충, 단순 강약(억부), 오행 보완·과다를 규칙으로 더해 5단계 등급과 문장을 만든다. 난수 없음.
- 출생 정보는 ‘이 기기에 저장’에 동의했을 때만 localStorage에 둔다. 서버 저장 없음. 표지·입력·결과에서 바꾸거나 지울 수 있다.
- 공유 포스터(1080×1920)와 공유 링크에는 이름·생년월일·출생 시간이 들어가지 않는다.
- 결과 저장(`components/SaveMenu.tsx`): 전체 결과 PNG · 오늘의 운세 PNG · SNS 포스터 1080×1920 · 전체 결과 A4 PDF. 저장 전용 문서(`ExportDoc`)가 화면과 같은 결과 컴포넌트를 `print` 모드(모두 펼침, 버튼 없음)·고정 760px로 그리며, 다시 계산하지 않고 화면의 결과 데이터를 그대로 쓴다. `lib/exportImage.ts`가 글꼴·그림 로딩을 기다린 뒤 16,000px 이하 조각으로 그려 섹션 경계에서 잇거나 나눈다(iOS는 1,600만 화소 단위로 여러 장). 이름·생년월일·시간·성별 포함 여부는 저장 창에서 고른다.
- 그림 에셋과 출처: `public/art/SOURCES.md`. 붓글씨 서체: 조선궁서체(`public/fonts`, npm `@noonnu/chosun-gs` MIT 배포본).

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
