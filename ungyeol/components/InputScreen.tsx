'use client';
/* eslint-disable @next/next/no-img-element */
import type { FormEvent } from 'react';
import BirthFields from './BirthFields';
import { Arrow, Knot } from './Frame';
import { validate, type FormState } from '@/lib/form';

interface Props {
  form: FormState; touched: Record<string, boolean>; submitted: boolean; formError: string;
  remember: boolean; hasSaved: boolean;
  onChange: (patch: Partial<FormState>) => void; onTouch: (k: string) => void; onInvalid: () => void; onSubmit: () => void;
  onRemember: (v: boolean) => void; onForget: () => void;
}

/** 출생 정보 입력: 한 번 입력하면 오늘의 운세와 전체 사주를 함께 본다. 기존 입력 항목·검증은 그대로다. */
export default function InputScreen({ form: f, touched, submitted, formError, remember, hasSaved, onChange, onTouch, onInvalid, onSubmit, onRemember, onForget }: Props) {
  const errors = validate(f);
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
    <main className="entry">
      <img className="entry__plum" src="/art/plum.webp" alt="" aria-hidden="true" width={900} height={791} />
      <header className="entry__head">
        <h1 className="brush">출생 정보 입력</h1>
        <Knot />
        <p>정확한 풀이를 위해 아래 정보를 입력해 주세요.<br />한 번 입력으로 오늘의 운세와 나의 사주를 함께 봐요.</p>
      </header>

      <form id="birth-form" onSubmit={submit} noValidate className="entry-panel" aria-label="출생 정보">
        <div className="field">
          <label htmlFor="f-name" className="lbl">이름 또는 별명 <small>선택</small></label>
          <input id="f-name" className="input" value={f.name} onChange={e => onChange({ name: e.target.value })} maxLength={12} placeholder="예: 하늘" autoComplete="nickname" />
          <p className="note">결과 제목에 “○○님의 사주 이야기”로 표시돼요.</p>
        </div>

        <BirthFields form={f} touched={touched} submitted={submitted} onChange={onChange} onTouch={onTouch} />

        <div className="consent">
          <label className="check" style={{ border: 0, padding: 0, minHeight: 44 }}>
            <input type="checkbox" checked={remember} onChange={e => onRemember(e.target.checked)} />
            다음에도 바로 볼 수 있게 이 기기에 저장
          </label>
          <p className="note">동의한 경우에만 이 브라우저에 저장하고, 서버에는 저장하지 않아요. 언제든 바꾸거나 지울 수 있어요.</p>
          {hasSaved && <button type="button" className="link-btn" style={{ alignSelf: 'flex-start' }} onClick={onForget}>저장된 출생 정보 지우기</button>}
        </div>

        {formError && <p role="alert" className="callout callout--seal">{formError}</p>}
      </form>

      <button type="submit" form="birth-form" className="cta cta--block">나의 운세 확인하기 <Arrow /></button>
      <figure className="entry-foot" aria-hidden="true" style={{ marginBlock: 0 }}><img src="/art/landscape-mist.webp" alt="" width={1400} height={372} loading="lazy" /></figure>
    </main>
  );
}
