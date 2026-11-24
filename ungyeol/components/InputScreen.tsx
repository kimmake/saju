'use client';
import type { FormEvent } from 'react';
import BirthFields from './BirthFields';
import { Corners, RuleOrn } from './Ornaments';
import Link from 'next/link';
import { birthLine, EMPTY_FORM, validate, type FormState } from '@/lib/form';
import type { BirthProfile } from '@/lib/profile';

const TOPICS = ['자녀운', '배우자운', '금전운', '직장운', '나와 어울리는 띠', '2027년 함께하면 좋은 띠', '2027년 나의 운세', '공부운'];
const NUM = ['一', '二', '三', '四', '五', '六', '七', '八'];

interface Props {
  form: FormState; touched: Record<string, boolean>; submitted: boolean; formError: string;
  onChange: (patch: Partial<FormState>) => void; onTouch: (k: string) => void; onInvalid: () => void; onSubmit: () => void;
  reuse?: { profile: BirthProfile; source: 'today' | 'saved' } | null; onReuse?: () => void; onDismissReuse?: () => void;
}
const Arrow = () => <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M5 2.5 9.5 7 5 11.5" /></svg>;

export default function InputScreen({ form: f, touched, submitted, formError, onChange, onTouch, onInvalid, onSubmit, reuse, onReuse, onDismissReuse }: Props) {
  const errors = validate(f);
  const dateDone = !errors.year && !errors.month && !errors.day;
  const timeDone = f.timeUnknown || (!errors.hour && !errors.minute && !errors.dstChoice);
  // 성별은 선택 항목이라 기본값(선택 안 함)도 유효하다. 앞 단계가 끝나면 함께 완료로 본다.
  const genderDone = f.gender !== null || (dateDone && timeDone);
  const doneList = [dateDone, timeDone, genderDone];
  const current = doneList.findIndex(d => !d);
  const stepState = (i: number) => (doneList[i] ? 'done' : i === current ? 'current' : 'todo');
  const startForm = () => {
    document.getElementById('birth-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => document.getElementById('f-name')?.focus({ preventScroll: true }), 450);
  };
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
    <main className="home">
      <section className="hero" aria-labelledby="hero-title">
        <figure className="hero__art" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/art/moon-panorama.webp" alt="" width={1600} height={760} />
        </figure>
        <p className="kicker" style={{ margin: 0 }}>나의 운을 읽고, 좋은 인연을 연결하다</p>
        <h1 id="hero-title" className="hero__title">당신의 사주에 담긴<br />이야기를 만나보세요.</h1>
        <p className="hero__lead">타고난 기질부터 관계, 재물, 공부와 일의 흐름까지.</p>
        <nav className="services" aria-label="서비스 선택">
          <button type="button" className="service" onClick={startForm}>
            <b aria-hidden="true">一</b><strong>나의 사주팔자</strong><span>타고난 사주와 전반적인 인생의 흐름</span><Arrow />
          </button>
          <Link href="/today" className="service service--today">
            <b aria-hidden="true">二</b><strong>오늘의 운세</strong><span>생년월일로 보는 오늘 하루 · 매일 자정에 새로</span><Arrow />
          </Link>
        </nav>
        <div className="toc-intro">
          <p className="toc-intro__title">결과에서 살펴볼 여덟 가지 이야기</p>
          <ol>
            {TOPICS.map((t, i) => <li key={t}><b aria-hidden="true">{NUM[i]}</b>{t}</li>)}
          </ol>
        </div>
      </section>

      <form id="birth-form" onSubmit={submit} noValidate className="sheet form-sheet" aria-labelledby="form-title">
        <Corners />
        <div className="form-head">
          <h2 id="form-title">출생 정보 입력</h2>
          <p>정확할수록 해석이 구체적이에요. 모르는 항목은 비워 두셔도 괜찮아요.</p>
          <RuleOrn />
        </div>

        {reuse && (
          <div className="reuse" role="region" aria-label="입력한 정보 다시 쓰기">
            <p>{reuse.source === 'today' ? '‘오늘의 운세’에서 입력한 출생 정보가 있어요.' : '이 기기에 저장해 둔 출생 정보가 있어요.'}<br /><strong>{birthLine({ ...EMPTY_FORM, ...reuse.profile })}</strong></p>
            <p style={{ fontSize: 14 }}>이 정보를 입력란에 채워 둘까요?</p>
            <div className="reuse__actions">
              <button type="button" className="btn btn--primary btn--sm" onClick={onReuse}>채워 두기</button>
              <button type="button" className="btn btn--secondary btn--sm" onClick={onDismissReuse}>새로 입력하기</button>
            </div>
          </div>
        )}

        <ol className="steps" aria-label="입력 진행 상황">
          {['생년월일', '태어난 시간', '성별 (선택)'].map((label, i) => (
            <li key={label} data-state={stepState(i)}>
              <span className="steps__mark" aria-hidden="true">{NUM[i]}</span>
              <span>{label}<span className="sr-only">{doneList[i] ? ' 입력 완료' : ' 입력 전'}</span></span>
            </li>
          ))}
        </ol>

        <div className="field">
          <label htmlFor="f-name" className="legend" style={{ border: 0, padding: 0, margin: 0 }}>이름 또는 별명 <span className="legend__opt">선택</span></label>
          <input id="f-name" className="input" value={f.name} onChange={e => onChange({ name: e.target.value })} maxLength={12} placeholder="예: 하늘" autoComplete="nickname" />
          <p className="note">결과 제목에 “○○님의 사주 이야기”로 표시돼요.</p>
        </div>

        <BirthFields form={f} touched={touched} submitted={submitted} onChange={onChange} onTouch={onTouch} />

        <div className="form-submit">
          {formError && <p role="alert" className="callout callout--seal">{formError}</p>}
          <button type="submit" className="btn btn--primary btn--lg btn--block">내 사주 살펴보기</button>
        </div>
      </form>
    </main>
  );
}
