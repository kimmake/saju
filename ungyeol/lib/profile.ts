import type { FormState } from './form';

/**
 * 출생 정보 재사용 (모두 이 기기의 브라우저 안에서만, 서버에는 저장하지 않는다)
 * - handoff: 사용자가 다른 서비스로 넘어가는 버튼을 눌렀을 때만 sessionStorage에 잠시 둔다.
 *            받는 화면은 "이 정보를 쓸까요?"를 묻고, 답과 상관없이 바로 지운다.
 * - saved:   ‘이 기기에 저장’에 동의했을 때만 localStorage에 둔다. 언제든 지울 수 있다.
 * 이름(별명)은 넘기지도 저장하지도 않는다.
 */
export type BirthProfile = Omit<FormState, 'name'>;
const HANDOFF = 'ungyeol:handoff', SAVED = 'ungyeol:profile';

const strip = (f: FormState | BirthProfile): BirthProfile => {
  const { calendar, year, month, day, leap, hour, minute, timeUnknown, gender, dstChoice } = f;
  return { calendar, year, month, day, leap, hour, minute, timeUnknown, gender, dstChoice };
};
const read = (store: () => Storage, key: string): BirthProfile | null => {
  try {
    const raw = store().getItem(key); if (!raw) return null;
    const p = JSON.parse(raw);
    return p && typeof p.year === 'string' && (p.calendar === 'solar' || p.calendar === 'lunar') ? strip(p) : null;
  } catch { return null; }
};
const write = (store: () => Storage, key: string, f: FormState | BirthProfile) => { try { store().setItem(key, JSON.stringify(strip(f))); } catch { /* 저장 불가 환경 */ } };
const remove = (store: () => Storage, key: string) => { try { store().removeItem(key); } catch { /* noop */ } };
const ss = () => window.sessionStorage, ls = () => window.localStorage;

export const setHandoff = (f: FormState | BirthProfile) => write(ss, HANDOFF, f);
export const takeHandoff = (): BirthProfile | null => { const p = read(ss, HANDOFF); remove(ss, HANDOFF); return p; };
export const loadSaved = () => read(ls, SAVED);
export const saveProfile = (f: FormState | BirthProfile) => write(ls, SAVED, f);
export const clearSaved = () => remove(ls, SAVED);
