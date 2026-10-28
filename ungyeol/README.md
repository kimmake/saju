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
