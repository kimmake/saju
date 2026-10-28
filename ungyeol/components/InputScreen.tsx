'use client';
import type { CSSProperties, ChangeEvent, FormEvent } from 'react';
import { cleanDigits, dstType, validate, type FormState } from '@/lib/form';

const TOPICS = ['자녀운', '배우자운', '금전운', '직장운', '나와 어울리는 띠', '2027년 함께하면 좋은 띠', '공부운'];
const labelS: CSSProperties = { fontSize: 13, color: '#4A453E' };
const legendS: CSSProperties = { fontSize: 15, fontWeight: 600, padding: 0, marginBottom: 10 };
const fieldsetS: CSSProperties = { border: 0, margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 };
const colS: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };
const errS: CSSProperties = { margin: 0, fontSize: 13.5, color: '#A33A2A', fontWeight: 500 };
const noteS = (c = '#6B645A'): CSSProperties => ({ margin: 0, fontSize: 13, lineHeight: 1.6, color: c });
const inputS = (border: string): CSSProperties => ({ height: 52, borderRadius: 14, border: `1px solid ${border}`, background: '#fff', padding: '0 14px', fontSize: 16, color: '#24211D', minWidth: 0 });
const checkRow = (bg: string): CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, cursor: 'pointer', padding: '12px 14px', borderRadius: 14, background: bg });
const checkS: CSSProperties = { width: 20, height: 20, accentColor: '#574A86', margin: 0 };

interface Props {
  form: FormState; touched: Record<string, boolean>; submitted: boolean; formError: string;
  onChange: (patch: Partial<FormState>) => void; onTouch: (k: string) => void; onInvalid: () => void; onSubmit: () => void;
}

export default function InputScreen({ form: f, touched, submitted, formError, onChange, onTouch, onInvalid, onSubmit }: Props) {
  const errors = validate(f), dstT = dstType(f);
  const show = (k: keyof typeof errors) => !!errors[k] && (submitted || !!touched[k]);
  const bc = (k: keyof typeof errors) => (show(k) ? '#A33A2A' : 'rgba(36,33,29,.18)');
  const num = (k: 'year' | 'month' | 'day' | 'hour' | 'minute', n: number) => (e: ChangeEvent<HTMLInputElement>) =>
    onChange({ [k]: cleanDigits(e.target.value, n, (e.nativeEvent as InputEvent).isComposing) });
  const blur = (k: 'year' | 'month' | 'day' | 'hour' | 'minute') => () => {
    if (/\D/.test(f[k])) onChange({ [k]: f[k].replace(/\D/g, '') });
    onTouch(k);
  };
  const dateErrors = (['year', 'month', 'day'] as const).filter(show).map(k => errors[k]!);
  const timeErrors = (['hour', 'minute'] as const).filter(show).map(k => errors[k]!).concat(errors.dstChoice && submitted ? [errors.dstChoice] : []);
  const M = +f.month, Dd = +f.day;
  const showIpchunHint = f.calendar === 'solar' && (M === 1 || (M === 2 && Dd >= 1 && Dd <= 5));
  const dstBorder = errors.dstChoice && submitted ? '#A33A2A' : 'rgba(168,131,63,.35)';
  const seg = (on: boolean): CSSProperties => ({ height: 42, border: 0, borderRadius: 11, fontSize: 15, fontWeight: 600, cursor: 'pointer', background: on ? '#FBF8F2' : 'transparent', color: on ? '#24211D' : '#5A544B', boxShadow: on ? '0 1px 3px rgba(36,33,29,.15)' : 'none' });
  const opt = (on: boolean): CSSProperties => ({ borderRadius: 12, cursor: 'pointer', border: `1px solid ${on ? '#574A86' : 'rgba(36,33,29,.18)'}`, background: on ? '#ECE8F3' : '#fff', color: on ? '#3E3366' : '#3A352F', fontWeight: on ? 700 : 500 });
  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    const first = (['year', 'month', 'day', 'hour', 'minute', 'dstChoice'] as const).find(k => errors[k]);
    if (first) {
      onInvalid();
      setTimeout(() => { const el = first === 'dstChoice' ? document.querySelector<HTMLElement>('[aria-labelledby="dst-q"] button') : document.getElementById('f-' + first); el?.focus(); }, 0);
      return;
    }
    onSubmit();
  };

  return (
    <main style={{ width: '100%', maxWidth: 1160, margin: '0 auto', padding: 'clamp(8px,3vw,24px) clamp(16px,4vw,24px) 72px', display: 'flex', flexWrap: 'wrap', gap: 'clamp(28px,6vw,56px)', alignItems: 'flex-start' }}>
      <div style={{ flex: '1 1 320px', minWidth: 0, position: 'relative', paddingTop: 'clamp(12px,3vw,28px)' }}>
        <svg width="220" height="120" viewBox="0 0 220 120" aria-hidden="true" style={{ position: 'absolute', right: 0, top: 0, opacity: 0.8 }}>
          <g stroke="#B79A5E" strokeWidth="0.8" fill="none" opacity=".7"><line x1="20" y1="90" x2="70" y2="58" /><line x1="70" y1="58" x2="118" y2="70" /><line x1="118" y1="70" x2="160" y2="30" /><line x1="160" y1="30" x2="204" y2="46" /></g>
          <g fill="#A8833F"><circle cx="20" cy="90" r="2.4" /><circle cx="70" cy="58" r="3" /><circle cx="118" cy="70" r="2" /><circle cx="160" cy="30" r="3.4" /><circle cx="204" cy="46" r="2.2" /></g>
        </svg>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#574A86', fontWeight: 600, letterSpacing: '0.02em' }}>나의 운을 읽고, 좋은 인연을 연결하다</p>
        <h1 className="serif" style={{ margin: 0, fontWeight: 800, fontSize: 'clamp(34px,4.6vw,54px)', lineHeight: 1.28, letterSpacing: '-0.03em', textWrap: 'balance' }}>당신의 사주에 담긴 이야기를 만나보세요.</h1>
        <svg width="168" height="18" viewBox="0 0 168 18" aria-hidden="true" style={{ display: 'block', margin: '22px 0 20px' }}><path d="M2 12 Q 22 2 42 10 T 82 10 T 122 10 T 166 8" stroke="#A8833F" strokeWidth="1.4" fill="none" strokeLinecap="round" /></svg>
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.7, color: '#4A453E', maxWidth: 440 }}>타고난 기질부터 관계, 재물, 공부와 일의 흐름까지.</p>
        <div style={{ marginTop: 'clamp(24px,5vw,40px)', padding: 'clamp(16px,4vw,22px) clamp(16px,4vw,24px)', borderRadius: 20, background: 'rgba(251,248,242,.6)', border: '1px solid rgba(36,33,29,.08)', maxWidth: 460 }}>
          <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#6B645A' }}>결과에서 살펴볼 일곱 가지 이야기</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TOPICS.map(t => <span key={t} style={{ whiteSpace: 'nowrap', fontSize: 14, padding: '6px 12px', borderRadius: 999, background: '#FBF8F2', border: '1px solid rgba(36,33,29,.1)', color: '#3A352F' }}>{t}</span>)}
          </div>
        </div>
      </div>

      <form onSubmit={submit} noValidate style={{ flex: '1 1 340px', maxWidth: 540, minWidth: 0, background: '#FBF8F2', border: '1px solid rgba(36,33,29,.1)', borderRadius: 28, padding: 'clamp(22px,4vw,36px)', boxShadow: '0 1px 0 rgba(255,255,255,.8) inset,0 24px 48px -28px rgba(60,45,20,.25)', display: 'flex', flexDirection: 'column', gap: 26 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h2 className="serif" style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>출생 정보 입력</h2>
          <p style={{ margin: 0, fontSize: 14, color: '#6B645A', lineHeight: 1.6 }}>정확할수록 해석이 구체적이에요. 모르는 항목은 비워 두셔도 괜찮아요.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label htmlFor="f-name" style={{ fontSize: 15, fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center' }}>이름 또는 별명 <span style={{ fontSize: 12, fontWeight: 500, color: '#6B645A', padding: '2px 8px', borderRadius: 999, background: '#EFEADF' }}>선택</span></label>
          <input id="f-name" value={f.name} onChange={e => onChange({ name: e.target.value })} maxLength={12} placeholder="예: 하늘" autoComplete="nickname" style={{ ...inputS('rgba(36,33,29,.18)'), padding: '0 16px' }} />
          <p style={noteS()}>결과 제목에 “○○님의 사주 이야기”로 표시돼요.</p>
        </div>

        <fieldset style={fieldsetS}>
          <legend style={legendS}>생년월일</legend>
          <div role="radiogroup" aria-label="달력 기준" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 4, borderRadius: 14, background: '#EFEADF' }}>
            <button type="button" role="radio" aria-checked={f.calendar === 'solar'} onClick={() => onChange({ calendar: 'solar' })} style={seg(f.calendar === 'solar')}>양력</button>
            <button type="button" role="radio" aria-checked={f.calendar === 'lunar'} onClick={() => onChange({ calendar: 'lunar' })} style={seg(f.calendar === 'lunar')}>음력</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr)', gap: 8 }}>
            {([['year', '연', '예: 1994', 4], ['month', '월', '3', 2], ['day', '일', '12', 2]] as const).map(([k, label, ph, n]) => (
              <div key={k} style={colS}>
                <label htmlFor={'f-' + k} style={labelS}>{label}</label>
                <input id={'f-' + k} inputMode="numeric" value={f[k]} onChange={num(k, n)} onBlur={blur(k)} placeholder={ph} aria-invalid={show(k)} aria-describedby="e-date" style={inputS(bc(k))} />
              </div>
            ))}
          </div>
          <div id="e-date" aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{dateErrors.map(er => <p key={er} style={errS}>{er}</p>)}</div>
          {f.calendar === 'lunar' && (
            <label style={checkRow('#F2EEF7')}><input type="checkbox" checked={f.leap} onChange={e => onChange({ leap: e.target.checked })} style={checkS} />윤달에 태어났어요</label>
          )}
          {showIpchunHint && <p style={{ ...noteS('#5C4A1F'), fontSize: 13.5, padding: '10px 14px', borderRadius: 12, background: '#F3EAD6' }}>입춘(2월 4일 전후) 이전 출생이라면 띠는 전년도 기준으로 볼 수 있어요. 실제 분석에서는 절기 시각으로 확인해요.</p>}
        </fieldset>

        <fieldset style={fieldsetS}>
          <legend style={legendS}>태어난 시간</legend>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 8, opacity: f.timeUnknown ? 0.45 : 1 }}>
            {([['hour', '시 (0–23)', '예: 15'], ['minute', '분 (0–59)', '예: 20']] as const).map(([k, label, ph]) => (
              <div key={k} style={colS}>
                <label htmlFor={'f-' + k} style={labelS}>{label}</label>
                <input id={'f-' + k} inputMode="numeric" value={f[k]} onChange={num(k, 2)} onBlur={blur(k)} disabled={f.timeUnknown} placeholder={ph} aria-invalid={show(k)} aria-describedby="e-time" style={inputS(bc(k))} />
              </div>
            ))}
          </div>
          <p style={noteS()}>24시간 기준이에요. 오후 3시 20분은 15시 20분으로 입력해 주세요.</p>
          <div id="e-time" aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{timeErrors.map(er => <p key={er} style={errS}>{er}</p>)}</div>
          {dstT === 'overlap' && (
            <div role="group" aria-labelledby="dst-q" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14, borderRadius: 14, background: '#F3EAD6', border: `1px solid ${dstBorder}` }}>
              <p id="dst-q" style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#5C4A1F' }}>이 날 이 시각은 서머타임이 끝나면서 시계를 1시간 되돌려 <strong>두 번 있었던 시각</strong>이에요. 어느 쪽에 태어났는지 골라 주세요.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,180px),1fr))', gap: 8 }}>
                {([['dst', '서머타임 중 (먼저 온 시각)', '시계를 되돌리기 전'], ['std', '서머타임 끝난 뒤 (나중 시각)', '시계를 되돌린 후']] as const).map(([v, label, sub]) => (
                  <button key={v} type="button" role="radio" aria-checked={f.dstChoice === v} onClick={() => onChange({ dstChoice: v })} style={{ ...opt(f.dstChoice === v), minHeight: 48, padding: '8px 12px', fontSize: 14.5, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2 }}><span>{label}</span><span style={{ fontSize: 12.5, fontWeight: 400, color: '#5A544B' }}>{sub}</span></button>
                ))}
              </div>
              <p style={{ ...noteS('#5A544B'), fontSize: 12.5 }}>모르겠다면 출생 기록(출생증명서 등)에 적힌 시각을 확인해 보세요. 고르지 않으면 계산할 수 없어요.</p>
            </div>
          )}
          {dstT === 'gap' && <p style={{ ...noteS('#5C4A1F'), fontSize: 13.5, padding: '10px 14px', borderRadius: 12, background: '#F3EAD6' }}>이 날 이 시각은 서머타임이 시작되며 시계를 1시간 앞당겨 <strong>실제로는 없던 시각</strong>이에요. 서머타임 적용 전 표준시로 적힌 시각으로 보고 계산해요.</p>}
          <label style={checkRow('#EFEADF')}><input type="checkbox" checked={f.timeUnknown} onChange={e => onChange({ timeUnknown: e.target.checked })} style={checkS} />시간 모름</label>
          {f.timeUnknown && <p style={{ ...noteS('#3E3366'), fontSize: 13.5, padding: '10px 14px', borderRadius: 12, background: '#ECE8F3' }}>태어난 시간을 모르면 일부 해석의 구체성이 낮아질 수 있어요. 시간 없이도 결과를 확인할 수 있어요.</p>}
        </fieldset>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>출생 지역</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, height: 52, borderRadius: 14, border: '1px solid rgba(36,33,29,.12)', background: '#F4F0E8', padding: '0 16px' }}>
            <span style={{ fontSize: 16 }}>대한민국</span>
            <span style={{ whiteSpace: 'nowrap', fontSize: 12.5, color: '#5A544B' }}>국내 출생 기준</span>
          </div>
          <p style={noteS()}>운결은 국내 출생을 기준으로 해석해요. 실제 태양시(약 −30분)를 반영해 계산해요.</p>
        </div>

        <fieldset style={fieldsetS}>
          <legend style={legendS}>해석에 사용하는 성별</legend>
          <div role="radiogroup" aria-label="해석에 사용하는 성별" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
            {([['female', '여성'], ['male', '남성'], [null, '선택 안 함']] as const).map(([v, label]) => (
              <button key={label} type="button" role="radio" aria-checked={f.gender === v} onClick={() => onChange({ gender: v })} style={{ ...opt(f.gender === v), height: 46, fontSize: 15 }}>{label}</button>
            ))}
          </div>
          <p style={noteS()}>전통 명리학에서 10년 단위 흐름(대운)의 방향을 정할 때만 쓰여요. 선택하지 않아도 결과를 볼 수 있고, 이 경우 대운 관련 해석은 제외돼요.</p>
        </fieldset>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
          {formError && <p role="alert" style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#A33A2A', fontWeight: 500, padding: '12px 14px', borderRadius: 12, background: '#F6E3DE' }}>{formError}</p>}
          <button type="submit" className="btn-cta" style={{ height: 58, border: 0, borderRadius: 16, background: '#574A86', color: '#fff', fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', cursor: 'pointer', boxShadow: '0 12px 24px -14px rgba(87,74,134,.8)' }}>내 사주 살펴보기</button>
        </div>
      </form>
    </main>
  );
}
