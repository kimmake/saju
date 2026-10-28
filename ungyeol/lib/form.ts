import { dstCheck } from '@/lib/saju/chart';
import type { DstChoice, SajuInput } from '@/lib/saju/types';

export interface FormState {
  name: string; year: string; month: string; day: string; calendar: 'solar' | 'lunar'; leap: boolean;
  hour: string; minute: string; timeUnknown: boolean; gender: 'female' | 'male' | null; dstChoice: DstChoice | null;
}
export const EMPTY_FORM: FormState = { name: '', year: '', month: '', day: '', calendar: 'solar', leap: false, hour: '', minute: '', timeUnknown: false, gender: null, dstChoice: null };

export type FormErrors = Partial<Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'dstChoice', string>>;

export function toInput(f: FormState): SajuInput {
  return {
    name: f.name.trim() || null, calendar: f.calendar, isLeapMonth: f.calendar === 'lunar' && f.leap,
    birth: { year: +f.year, month: +f.month, day: +f.day },
    time: f.timeUnknown ? null : { hour: +f.hour, minute: f.minute === '' ? 0 : +f.minute },
    region: '대한민국', gender: f.gender, dstChoice: f.dstChoice,
  };
}

export function dstType(f: FormState): 'gap' | 'overlap' | null {
  if (f.timeUnknown || f.hour === '' || !f.year || !f.month || !f.day) return null;
  if (f.year.length !== 4 || +f.hour > 23 || (f.minute !== '' && +f.minute > 59)) return null;
  return dstCheck(toInput(f));
}

export function validate(f: FormState): FormErrors {
  const e: FormErrors = {}, now = new Date();
  const Y = +f.year, M = +f.month, D = +f.day, lunar = f.calendar === 'lunar';
  if (!f.year) e.year = '태어난 연도를 입력해 주세요.';
  else if (!/^\d{4}$/.test(f.year)) e.year = '연도는 4자리 숫자로 입력해 주세요. (예: 1994)';
  else if (Y < 1900) e.year = '1900년 이후 연도를 입력해 주세요.';
  else if (Y > now.getFullYear()) e.year = '미래의 연도는 입력할 수 없어요.';
  if (!f.month) e.month = '태어난 월을 입력해 주세요.';
  else if (M < 1 || M > 12) e.month = '월은 1에서 12 사이로 입력해 주세요.';
  if (!f.day) e.day = '태어난 일을 입력해 주세요.';
  else {
    const max = lunar ? 30 : (M >= 1 && M <= 12 ? new Date(Y || 2000, M, 0).getDate() : 31);
    if (D < 1 || D > max) e.day = lunar ? '음력 날짜는 1일에서 30일 사이로 입력해 주세요.' : (M >= 1 && M <= 12 ? `${M}월은 ${max}일까지 있어요. 날짜를 확인해 주세요.` : '일은 1에서 31 사이로 입력해 주세요.');
    else if (!e.year && !e.month && new Date(Y, M - 1, D) > now) e.day = '오늘 이후의 날짜는 입력할 수 없어요.';
  }
  if (!f.timeUnknown) {
    if (f.hour === '') e.hour = '태어난 시를 입력하거나 ‘시간 모름’을 선택해 주세요.';
    else if (+f.hour > 23) e.hour = '시는 0에서 23 사이로 입력해 주세요.';
    if (f.minute !== '' && +f.minute > 59) e.minute = '분은 0에서 59 사이로 입력해 주세요.';
    if (!e.year && !e.month && !e.day && !e.hour && !e.minute && !f.dstChoice && dstType(f) === 'overlap') e.dstChoice = '서머타임 중인지, 끝난 뒤인지 골라 주세요.';
  }
  return e;
}

export function birthLine(f: FormState): string {
  const cal = f.calendar === 'solar' ? '양력' : '음력' + (f.leap ? '(윤달)' : '');
  let t = '시간 모름';
  if (!f.timeUnknown && f.hour !== '') { const h = +f.hour, m = f.minute === '' ? 0 : +f.minute; t = `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}시${m ? ' ' + m + '분' : ''}`; }
  const g = f.gender ? ({ female: '여성', male: '남성' })[f.gender] : null;
  return [`${cal} ${f.year}년 ${+f.month}월 ${+f.day}일`, t, g].filter(Boolean).join(' · ');
}

/** 한글 IME 조합 중에는 걸러 내지 않고, 조합이 끝나면 전각 숫자를 일반 숫자로 바꾼 뒤 숫자만 남긴다. */
export function cleanDigits(raw: string, max: number, composing: boolean): string {
  if (composing) return raw;
  return raw.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 65248)).replace(/[^\d]/g, '').slice(0, max);
}
