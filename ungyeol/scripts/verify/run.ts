import fs from 'node:fs';
import { computeChart } from '../../lib/saju/chart';
const cases: any[] = JSON.parse(fs.readFileSync('cases.json', 'utf8'));
let bad = 0; const shown: string[] = []; const byPart = [0, 0, 0, 0];
for (const [y, m, d, h, mi, ...ref] of cases) {
  const c = computeChart({ name: null, calendar: 'solar', isLeapMonth: false, birth: { year: y, month: m, day: d }, time: { hour: h, minute: mi }, region: '대한민국', gender: null, dstChoice: 'dst' });
  const got = [c.gz.year, c.gz.month, c.gz.day, c.gz.time];
  const diff = got.map((g, i) => g !== ref[i]);
  if (diff.some(Boolean)) { bad++; diff.forEach((x, i) => x && byPart[i]++); if (shown.length < 15) shown.push(`${y}-${m}-${d} ${h}:${mi} lib=${got.join(' ')} ref=${ref.join(' ')}`); }
}
console.log('cases', cases.length, 'mismatch', bad, 'by 년월일시', byPart); console.log(shown.join('\n'));
