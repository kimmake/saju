'use client';
import type { ChangeEvent } from 'react';
import { cleanDigits, dstType, validate, type FormState } from '@/lib/form';

const DEFAULT_GENDER_NOTE = '전통 명리학에서 10년 단위 흐름(대운)의 방향을 정할 때만 쓰여요. 선택하지 않아도 결과를 볼 수 있고, 이 경우 대운 관련 해석은 제외돼요.';

interface Props {
  form: FormState; touched: Record<string, boolean>; submitted: boolean;
  onChange: (patch: Partial<FormState>) => void; onTouch: (k: string) => void;
  showRegion?: boolean; genderLabel?: string; genderNote?: string;
}

/** 생년월일 · 태어난 시간 · 성별 입력란. ‘나의 사주팔자’와 ‘오늘의 운세’가 같은 입력 방식과 검증을 쓴다. */
export default function BirthFields({ form: f, touched, submitted, onChange, onTouch, showRegion = true, genderLabel = '해석에 사용하는 성별', genderNote = DEFAULT_GENDER_NOTE }: Props) {
  const errors = validate(f), dstT = dstType(f);
  const show = (k: keyof typeof errors) => !!errors[k] && (submitted || !!touched[k]);
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

  return (
    <>
          <fieldset className="fieldset">
            <legend className="legend"><span className="legend__num" aria-hidden="true">一</span>생년월일</legend>
            <div role="radiogroup" aria-label="달력 기준" className="segment">
              <button type="button" role="radio" aria-checked={f.calendar === 'solar'} onClick={() => onChange({ calendar: 'solar' })}>양력</button>
              <button type="button" role="radio" aria-checked={f.calendar === 'lunar'} onClick={() => onChange({ calendar: 'lunar' })}>음력</button>
            </div>
            <div className="grid-date">
              {([['year', '연', '예: 1994', 4], ['month', '월', '3', 2], ['day', '일', '12', 2]] as const).map(([k, label, ph, n]) => (
                <div key={k} className="field">
                  <label htmlFor={'f-' + k} className="field__label">{label}</label>
                  <input id={'f-' + k} className="input" inputMode="numeric" value={f[k]} onChange={num(k, n)} onBlur={blur(k)} placeholder={ph} aria-invalid={show(k)} aria-describedby="e-date" />
                </div>
              ))}
            </div>
            <div id="e-date" aria-live="polite" className="err-stack">{dateErrors.map(er => <p key={er} className="err">{er}</p>)}</div>
            {f.calendar === 'lunar' && (
              <label className="check"><input type="checkbox" checked={f.leap} onChange={e => onChange({ leap: e.target.checked })} />윤달에 태어났어요</label>
            )}
            {showIpchunHint && <p className="callout">입춘(2월 4일 전후) 이전 출생이라면 띠는 전년도 기준으로 볼 수 있어요. 실제 분석에서는 절기 시각으로 확인해요.</p>}
          </fieldset>

          <fieldset className="fieldset">
            <legend className="legend"><span className="legend__num" aria-hidden="true">二</span>태어난 시간</legend>
            <div className="grid-2" style={{ opacity: f.timeUnknown ? 0.5 : 1 }}>
              {([['hour', '시 (0–23)', '예: 15'], ['minute', '분 (0–59)', '예: 20']] as const).map(([k, label, ph]) => (
                <div key={k} className="field">
                  <label htmlFor={'f-' + k} className="field__label">{label}</label>
                  <input id={'f-' + k} className="input" inputMode="numeric" value={f[k]} onChange={num(k, 2)} onBlur={blur(k)} disabled={f.timeUnknown} placeholder={ph} aria-invalid={show(k)} aria-describedby="e-time" />
                </div>
              ))}
            </div>
            <p className="note">24시간 기준이에요. 오후 3시 20분은 15시 20분으로 입력해 주세요.</p>
            <div id="e-time" aria-live="polite" className="err-stack">{timeErrors.map(er => <p key={er} className="err">{er}</p>)}</div>
            {dstT === 'overlap' && (
              <div role="group" aria-labelledby="dst-q" className="dst" data-error={!!(errors.dstChoice && submitted)}>
                <p id="dst-q">이 날 이 시각은 서머타임이 끝나면서 시계를 1시간 되돌려 <strong>두 번 있었던 시각</strong>이에요. 어느 쪽에 태어났는지 골라 주세요.</p>
                <div className="dst-options">
                  {([['dst', '서머타임 중 (먼저 온 시각)', '시계를 되돌리기 전'], ['std', '서머타임 끝난 뒤 (나중 시각)', '시계를 되돌린 후']] as const).map(([v, label, sub]) => (
                    <button key={v} type="button" role="radio" aria-checked={f.dstChoice === v} onClick={() => onChange({ dstChoice: v })} className="choice choice--stack"><span>{label}</span><small>{sub}</small></button>
                  ))}
                </div>
                <p className="note" style={{ fontSize: 12.5 }}>모르겠다면 출생 기록(출생증명서 등)에 적힌 시각을 확인해 보세요. 고르지 않으면 계산할 수 없어요.</p>
              </div>
            )}
            {dstT === 'gap' && <p className="callout">이 날 이 시각은 서머타임이 시작되며 시계를 1시간 앞당겨 <strong>실제로는 없던 시각</strong>이에요. 서머타임 적용 전 표준시로 적힌 시각으로 보고 계산해요.</p>}
            <label className="check"><input type="checkbox" checked={f.timeUnknown} onChange={e => onChange({ timeUnknown: e.target.checked })} />시간 모름</label>
            {f.timeUnknown && <p className="callout callout--navy">태어난 시간을 모르면 일부 해석의 구체성이 낮아질 수 있어요. 시간 없이도 결과를 확인할 수 있어요.</p>}
            {showRegion ? (
              <div className="field" style={{ marginTop: 6 }}>
                <span className="field__label">출생 지역</span>
                <div className="input input--static"><span>대한민국</span><small>국내 출생 기준</small></div>
                <p className="note">운결은 국내 출생을 기준으로 해석해요. 실제 태양시(약 −30분)를 반영해 계산해요.</p>
              </div>
            ) : <p className="note">국내 출생 기준이며, 실제 태양시(약 −30분)를 반영해 계산해요.</p>}
          </fieldset>

          <fieldset className="fieldset">
            <legend className="legend"><span className="legend__num" aria-hidden="true">三</span>{genderLabel} <span className="legend__opt">선택</span></legend>
            <div role="radiogroup" aria-label="해석에 사용하는 성별" className="grid-3">
              {([['female', '여성'], ['male', '남성'], [null, '선택 안 함']] as const).map(([v, label]) => (
                <button key={label} type="button" role="radio" aria-checked={f.gender === v} onClick={() => onChange({ gender: v })} className="choice">{label}</button>
              ))}
            </div>
            <p className="note">{genderNote}</p>
          </fieldset>
    </>
  );
}
