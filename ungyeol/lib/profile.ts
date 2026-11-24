import { EMPTY_FORM, type FormState } from './form';

/**
 * 출생 정보 저장 (이 기기의 브라우저 localStorage에만, 서버에는 저장하지 않는다)
 * - 입력 화면에서 ‘이 기기에 저장’에 동의했을 때만 저장한다.
 * - 표지·입력·결과 화면에서 언제든 바꾸거나 지울 수 있다.
 */
const SAVED = 'ungyeol:profile';

const pick = (f: FormState): FormState => {
  const { name, calendar, year, month, day, leap, hour, minute, timeUnknown, gender, dstChoice } = f;
  return { name, calendar, year, month, day, leap, hour, minute, timeUnknown, gender, dstChoice };
};

export function loadSaved(): FormState | null {
  try {
    const raw = window.localStorage.getItem(SAVED); if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || typeof p.year !== 'string' || (p.calendar !== 'solar' && p.calendar !== 'lunar')) return null;
    return pick({ ...EMPTY_FORM, ...p, name: typeof p.name === 'string' ? p.name : '' });
  } catch { return null; }
}
export function saveProfile(f: FormState) { try { window.localStorage.setItem(SAVED, JSON.stringify(pick(f))); } catch { /* 저장 불가 환경 */ } }
export function clearSaved() { try { window.localStorage.removeItem(SAVED); } catch { /* noop */ } }
