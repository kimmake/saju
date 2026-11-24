/** 오늘의 운세 엔진 점검: 결정성, 날짜별 변화, 등급 분포, 조사 오류 패턴. 실행: npx tsx scripts/today/check.ts */
import { todayFortune, kstToday } from '../../lib/saju/today';
import type { SajuInput } from '../../lib/saju/types';
import { STEM, BRANCH } from '../../lib/saju/constants';

const mk = (y: number, m: number, d: number, h: number | null, gender: 'female' | 'male' | null = null): SajuInput => ({
  name: null, calendar: 'solar', isLeapMonth: false, birth: { year: y, month: m, day: d }, time: h === null ? null : { hour: h, minute: 0 }, region: '대한민국', gender, dstChoice: null,
});
let fail = 0;
const a = mk(1994, 3, 12, 15, 'female');
const r1 = JSON.stringify(todayFortune(a, '2026-11-24')), r2 = JSON.stringify(todayFortune(a, '2026-11-24'));
if (r1 !== r2) { console.log('FAIL: 같은 입력·날짜에 결과가 다름'); fail++; }
if (r1 === JSON.stringify(todayFortune(a, '2026-11-25'))) { console.log('FAIL: 날짜가 바뀌어도 결과가 같음'); fail++; }
if (r1 === JSON.stringify(todayFortune(mk(1988, 7, 20, null), '2026-11-24'))) { console.log('FAIL: 다른 사람인데 결과가 같음'); fail++; }

// KST 자정 경계: UTC 14:59 → 전날, 15:00 → 다음 날
const k1 = kstToday(new Date('2026-11-24T14:59:00Z')).ymd, k2 = kstToday(new Date('2026-11-24T15:00:00Z')).ymd;
if (k1 !== '2026-11-24' || k2 !== '2026-11-25') { console.log('FAIL: KST 자정 경계', k1, k2); fail++; }

// 분포와 문장 점검: 200명 × 30일
const dist: Record<string, number[]> = {}; const bad = new Set<string>();
for (let i = 0; i < 200; i++) {
  const inp = mk(1950 + (i * 7) % 60, 1 + (i * 5) % 12, 1 + (i * 11) % 28, i % 4 === 0 ? null : (i * 3) % 24, (['female', 'male', null] as const)[i % 3]);
  for (let d = 1; d <= 30; d++) {
    const r = todayFortune(inp, `2026-11-${String(d).padStart(2, '0')}`.replace('-11-31', '-12-01'));
    const all = [r.total.score, ...r.categories.map(c => c.score)];
    ['total', ...r.categories.map(c => c.id)].forEach((k, j) => { (dist[k] ||= [0, 0, 0, 0, 0, 0])[all[j]]++; });
    const text = JSON.stringify(r);
    if (/undefined|NaN|\[object/.test(text)) bad.add('빈 값');
    // 한자 바로 뒤 조사가 한글 독음의 받침과 맞는지
    for (const m of text.matchAll(/([甲-龥])(이|가|은|는|을|를|과|와) /g)) {
      const r = STEM[m[1]]?.[0] ?? BRANCH[m[1]]?.[0]; if (!r) continue;
      const jong = (r.charCodeAt(0) - 0xac00) % 28 !== 0, want = { 이: true, 가: false, 은: true, 는: false, 을: true, 를: false, 과: true, 와: false }[m[2]];
      if (jong !== want) bad.add(m[0]);
    }
    if (r.matches.length !== 3 || r.lucky.colors.length !== 2) { fail++; }
  }
}
console.log('등급 분포 [1..5]:'); for (const k in dist) console.log(' ', k.padEnd(7), dist[k].slice(1).join(' / '));
if (bad.size) console.log('검토할 표현:', [...bad].slice(0, 20));
console.log(fail ? `FAIL ${fail}` : 'OK');
const s = todayFortune(a, '2026-11-24');
console.log(JSON.stringify({ date: s.date, total: s.total, cat: s.categories.map(c => [c.title, c.score, c.text]), lucky: s.lucky, matches: s.matches, word: s.word, basis: s.basis }, null, 1));
process.exit(fail ? 1 : 0);
