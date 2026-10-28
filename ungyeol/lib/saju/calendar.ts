import { Solar, Lunar, LunarYear, ShouXingUtil } from 'lunar-javascript';
import KoreanLunarCalendar from 'korean-lunar-calendar';
import type { DstChoice } from './types';

// ── 국내 시각 보정: 표준시 변경 이력 + 서머타임 ──
// 표준 자오선 135°(UTC+9) 시기는 동경 127.5° 기준 30분 보정, 127.5°(UTC+8:30) 시기는 0분.
// 브라우저/서버 현지 시간대의 영향을 피하려고 모든 '시계 시각'을 UTC 기준 가상 시각으로 다룬다.
export const clockDate = (y: number, m: number, d: number, h = 0, mi = 0) => new Date(Date.UTC(y, m - 1, d, h, mi));
const D_ = clockDate;
const TZ_8_30: [Date, Date][] = [[D_(1908, 4, 1), D_(1912, 1, 1)], [D_(1954, 3, 21), D_(1961, 8, 10)]];
const DST: [Date, Date][] = [ // [시작, 종료) 현지 시계 기준
  [D_(1948, 6, 1), D_(1948, 9, 13)], [D_(1949, 4, 3), D_(1949, 9, 11)], [D_(1950, 4, 1), D_(1950, 9, 10)], [D_(1951, 5, 6), D_(1951, 9, 9)],
  [D_(1955, 5, 5), D_(1955, 9, 9)], [D_(1956, 5, 20), D_(1956, 9, 30)], [D_(1957, 5, 5), D_(1957, 9, 22)], [D_(1958, 5, 4), D_(1958, 9, 21)],
  [D_(1959, 5, 3), D_(1959, 9, 20)], [D_(1960, 5, 1), D_(1960, 9, 18)],
  [D_(1987, 5, 10, 2), D_(1987, 10, 11, 3)], [D_(1988, 5, 8, 2), D_(1988, 10, 9, 3)],
];
const inRange = (t: Date, list: [Date, Date][]) => list.some(([a, b]) => t >= a && t < b);
const HOUR = 3600000;

export interface DstBoundary { type: 'gap' | 'overlap'; at: Date }
// 서머타임 경계: 시작 직후 1시간은 시계에 없던 시각(gap), 종료 직전 1시간은 두 번 있었던 시각(overlap)
export function dstBoundary(clock: Date): DstBoundary | null {
  for (const [a, b] of DST) {
    if (clock >= a && clock < new Date(a.getTime() + HOUR)) return { type: 'gap', at: a };
    if (clock >= new Date(b.getTime() - HOUR) && clock < b) return { type: 'overlap', at: b };
  }
  return null;
}
export function koreaCorrection(clock: Date, choice: DstChoice | null) {
  const bd = dstBoundary(clock);
  let dst = inRange(clock, DST);
  if (bd && bd.type === 'gap') dst = false;
  if (bd && bd.type === 'overlap' && choice === 'std') dst = false;
  const lon = !inRange(clock, TZ_8_30);
  const minutes = (dst ? 60 : 0) + (lon ? 30 : 0);
  const text = dst && lon ? '서머타임 1시간과 경도 보정 30분을 빼'
    : dst ? '서머타임 1시간을 빼(당시 표준시가 동경 127.5° 기준이라 경도 보정은 없어요)'
    : lon ? '경도 보정 30분을 빼' : '당시 표준시가 동경 127.5° 기준이라 보정 없이';
  return { minutes, text, toBeijing: (dst ? 60 : 0) + (lon ? 60 : 30), boundary: bd, dst };
}

// ── 한국 음력 → 양력 ──
// 한국천문연구원(KASI) 음양력 데이터 기반 공개 라이브러리(korean-lunar-calendar, 1000–2050년)를 우선 사용.
// 범위 밖이면 아래 자체 계산(krLunarMonths)으로 대체한다.
// 라이브러리 음력은 중국(UTC+8) 기준. 한국 음력은 UTC+9 기준이라 삭(신월)·중기의 날짜를 한국 시간으로 다시 정해
// 달의 시작과 윤달을 새로 계산한다.
const ZHONGQI = ['冬至', '大寒', '雨水', '春分', '谷雨', '小满', '夏至', '大暑', '处暑', '秋分', '霜降', '小雪', 'DONG_ZHI', 'DA_HAN', 'YU_SHUI'];
function krMonthStart(jdBj: number): number {
  const d0 = jdBj - 2451545;
  const t = ShouXingUtil.shuoHigh(Math.floor((d0 + 8) / 29.5306) * Math.PI * 2);
  if (Math.floor(t + 0.5) !== d0) return jdBj;
  return jdBj + (Math.floor(t + 1 / 24 + 0.5) - d0);
}
interface KrMonth { y: number; m: number; leap: boolean; start: number; len: number }
const krYearCache: Record<number, KrMonth[]> = {};
export function krLunarMonths(Y: number): KrMonth[] {
  if (krYearCache[Y]) return krYearCache[Y];
  const starts = new Set<number>();
  for (let y = Y - 1; y <= Y + 2; y++) LunarYear.fromYear(y).getMonths().forEach((m: any) => starts.add(m.getFirstJulianDay()));
  const S = [...starts].sort((a, b) => a - b).map(krMonthStart);
  const zq: number[] = [], ws: number[] = [], seen = new Set<number>();
  for (let y = Y - 1; y <= Y + 2; y++) {
    const t = Lunar.fromYmd(y, 6, 1).getJieQiTable();
    for (const k in t) {
      if (!ZHONGQI.includes(k)) continue;
      const jd = t[k].getJulianDay(), key = Math.round(jd * 100);
      if (seen.has(key)) continue;
      seen.add(key);
      const day = Math.floor(jd + 1 / 24 + 0.5);
      zq.push(day);
      if (k === '冬至' || k === 'DONG_ZHI') ws.push(day);
    }
  }
  ws.sort((a, b) => a - b);
  const idx = (day: number) => { for (let i = 0; i < S.length - 1; i++) if (day >= S[i] && day < S[i + 1]) return i; return -1; };
  const hasZq = (i: number) => zq.some(d => d >= S[i] && d < S[i + 1]);
  const out: KrMonth[] = [];
  for (let w = 0; w < ws.length - 1; w++) {
    const a = idx(ws[w]), b = idx(ws[w + 1]);
    if (a < 0 || b < 0) continue;
    const wsYear = Solar.fromJulianDay(ws[w]).getYear(), leapNeeded = b - a === 13;
    let leapDone = false, num = 11, yr = wsYear;
    for (let i = a; i < b; i++) {
      let leap = false;
      if (i > a && leapNeeded && !leapDone && !hasZq(i)) { leap = true; leapDone = true; }
      else if (i > a) { num++; if (num > 12) { num = 1; yr = wsYear + 1; } }
      out.push({ y: yr, m: num, leap, start: S[i], len: S[i + 1] - S[i] });
    }
  }
  return (krYearCache[Y] = out.filter(x => x.y === Y));
}

function koreanLunarToSolarCalc(y: number, m: number, leap: boolean, d: number) {
  const mo = krLunarMonths(y).find(x => x.m === m && x.leap === !!leap);
  if (!mo) throw new Error(leap ? `${y}년에는 음력 윤${m}월이 없어요. 윤달 여부를 확인해 주세요.` : `음력 ${y}년 ${m}월을 찾지 못했어요. 날짜를 확인해 주세요.`);
  if (d < 1 || d > mo.len) throw new Error(`음력 ${y}년 ${leap ? '윤' : ''}${m}월은 ${mo.len}일까지 있어요. 날짜를 확인해 주세요.`);
  return Solar.fromJulianDay(mo.start + d - 1);
}

export function koreanLunarToSolar(y: number, m: number, leap: boolean, d: number) {
  if (y >= 1000 && y <= 2050) {
    const c = new KoreanLunarCalendar();
    if (!c.setLunarDate(y, m, d, !!leap)) {
      const hasLeap = leap && c.setLunarDate(y, m, 1, true);
      throw new Error(leap && !hasLeap ? `${y}년에는 음력 윤${m}월이 없어요. 윤달 여부를 확인해 주세요.` : `음력 ${y}년 ${leap ? '윤' : ''}${m}월에는 ${d}일이 없어요. 날짜를 확인해 주세요.`);
    }
    const s = c.getSolarCalendar();
    return Solar.fromYmd(s.year, s.month, s.day);
  }
  return koreanLunarToSolarCalc(y, m, leap, d);
}
