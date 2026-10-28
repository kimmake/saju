import { Solar } from 'lunar-javascript';
import { STEM, BRANCH, EL_KO, EL_HAN, tenGod } from './constants';
import { clockDate, koreaCorrection, koreanLunarToSolar, dstBoundary } from './calendar';
import type { Element, Pillar, SajuInput } from './types';

export interface Chart {
  gz: { year: string; month: string; day: string; time: string | null };
  pillars: Pillar[];
  elements: Record<Element, number>;
  dayStem: string;
  yearBranch: string;
  notes: string[];
  daeun: string | null;
}

export function computeChart(input: SajuInput): Chart {
  const { year: y, month: m, day: d } = input.birth;
  const hasTime = !!input.time;
  const h = hasTime ? input.time!.hour : 12, mi = hasTime ? input.time!.minute : 0;
  let solar: any;
  if (input.calendar === 'lunar') {
    const s = koreanLunarToSolar(y, m, input.isLeapMonth, d);
    solar = Solar.fromYmdHms(s.getYear(), s.getMonth(), s.getDay(), h, mi, 0);
  } else {
    solar = Solar.fromYmdHms(y, m, d, h, mi, 0);
  }
  const notes: string[] = [];
  if (input.calendar === 'lunar') notes.push(`한국 음력(한국 표준시 기준) 날짜를 양력 ${solar.getYear()}년 ${solar.getMonth()}월 ${solar.getDay()}일로 바꿔 계산했어요.`);
  let cnSolar: any = null;
  if (hasTime) {
    const clock = clockDate(solar.getYear(), solar.getMonth(), solar.getDay(), solar.getHour(), solar.getMinute());
    const { minutes, text, toBeijing, boundary } = koreaCorrection(clock, input.dstChoice);
    if (boundary && boundary.type === 'gap') notes.push('입력한 시각은 서머타임이 시작되며 시계에서 건너뛴 시간이라, 표준시로 적힌 시각으로 보고 계산했어요.');
    if (boundary && boundary.type === 'overlap') notes.push(input.dstChoice === 'std' ? '서머타임이 끝난 뒤의 시각(두 번째)으로 계산했어요.' : '서머타임 중의 시각(첫 번째)으로 계산했어요.');
    const cn = new Date(clock.getTime() - toBeijing * 60000);
    cnSolar = Solar.fromYmdHms(cn.getUTCFullYear(), cn.getUTCMonth() + 1, cn.getUTCDate(), cn.getUTCHours(), cn.getUTCMinutes(), 0);
    const dt = new Date(clock.getTime() - minutes * 60000);
    solar = Solar.fromYmdHms(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate(), dt.getUTCHours(), dt.getUTCMinutes(), 0);
    notes.push(`태어난 시각에서 ${text} 실제 태양시(${String(dt.getUTCHours()).padStart(2, '0')}:${String(dt.getUTCMinutes()).padStart(2, '0')}) 기준으로 계산했어요.`);
  }
  if (!hasTime) notes.push('태어난 시간을 몰라 시주는 비워 두고, 오행은 여섯 글자로 셌어요.');

  // 년·월주와 대운: 절입 시각과 같은 순간으로 비교(라이브러리 절기표는 UTC+8 기준)
  if (!cnSolar) cnSolar = Solar.fromYmdHms(solar.getYear(), solar.getMonth(), solar.getDay(), 11, 0, 0);
  const ecInst = cnSolar.getLunar().getEightChar();
  // 일·시주: 실제 태양시 기준. 국내 만세력 일반 기준대로 자시(23시) 시작 시 일주도 다음 날로(야자시 미적용)
  const ec = solar.getLunar().getEightChar();
  ec.setSect(1);
  const gz = { year: ecInst.getYear() as string, month: ecInst.getMonth() as string, day: ec.getDay() as string, time: hasTime ? (ec.getTime() as string) : null };
  if (!hasTime) {
    const at = (hh: number) => Solar.fromYmdHms(solar.getYear(), solar.getMonth(), solar.getDay(), hh, 0, 0).getLunar().getEightChar().getMonth();
    if (at(0) !== at(23)) notes.push('태어난 날이 절기가 바뀌는 날이라, 시간을 알면 월주가 달라질 수 있어요.');
  }
  const dayStem = gz.day[0];
  const mk = (label: string, note: string, s: string | null, key: string): Pillar => s ? {
    label, note, stem: s[0], stemKo: STEM[s[0]][0], stemEl: STEM[s[0]][1], branch: s[1], branchKo: BRANCH[s[1]][0], branchEl: BRANCH[s[1]][1],
    stemGod: key === 'day' ? '일간(나)' : tenGod(dayStem, s[0]), branchGod: tenGod(dayStem, BRANCH[s[1]][3]), isDay: key === 'day',
  } : { label, note, stem: '?', stemKo: '시간 모름', stemEl: 'none', branch: '?', branchKo: '', branchEl: 'none', unknown: true };
  const pillars = [mk('시주', '태어난 시', gz.time, 'time'), mk('일주', '태어난 날', gz.day, 'day'), mk('월주', '태어난 달', gz.month, 'month'), mk('년주', '태어난 해', gz.year, 'year')];
  const elements: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  pillars.forEach(p => { if (!p.unknown) { elements[p.stemEl as Element]++; elements[p.branchEl as Element]++; } });

  let daeun: string | null = null;
  if (input.gender) {
    try {
      const yun = ecInst.getYun(input.gender === 'male' ? 1 : 0), list = yun.getDaYun(), now = new Date().getFullYear();
      const first = list[1], cur = list.find((x: any, i: number) => i > 0 && x.getStartYear() <= now && now <= x.getEndYear());
      daeun = `대운은 ${first.getStartAge()}세 무렵 시작해요.` + (cur ? ` 지금은 ${cur.getGanZhi()} 대운(${cur.getStartYear()}–${cur.getEndYear()}년)을 지나고 있어요.` : '');
    } catch { daeun = null; }
  }
  return { gz, pillars, elements, dayStem, yearBranch: gz.year[1], notes, daeun };
}

export function elementNote(el: Record<Element, number>): string {
  const ks = Object.keys(el) as Element[], max = Math.max(...ks.map(k => el[k])), min = Math.min(...ks.map(k => el[k]));
  const top = ks.filter(k => el[k] === max).map(k => `${EL_KO[k]}(${EL_HAN[k]})`).join('·');
  const low = ks.filter(k => el[k] === min).map(k => `${EL_KO[k]}(${EL_HAN[k]})`).join('·');
  return `${top} 기운이 가장 많고, ${low}${min === 0 ? '는 비어 있는' : '가 적은'} 구성이에요.`;
}

/** 화면용: 입력한 출생 시각이 서머타임 경계에 걸리는지 확인 */
export function dstCheck(input: SajuInput): 'gap' | 'overlap' | null {
  try {
    if (!input.time) return null;
    const { year: y, month: m, day: d } = input.birth;
    const s = input.calendar === 'lunar' ? koreanLunarToSolar(y, m, input.isLeapMonth, d) : Solar.fromYmd(y, m, d);
    const bd = dstBoundary(clockDate(s.getYear(), s.getMonth(), s.getDay(), input.time.hour, input.time.minute));
    return bd ? bd.type : null;
  } catch { return null; }
}
