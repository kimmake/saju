'use client';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Background from '@/components/Background';
import BirthFields from '@/components/BirthFields';
import SiteHeader from '@/components/SiteHeader';
import TodaySheet, { Iljin } from '@/components/TodaySheet';
import TodayShareCard from '@/components/TodayShareCard';
import { Corners, RuleOrn } from '@/components/Ornaments';
import { EMPTY_FORM, birthLine, toInput, validate, type FormState } from '@/lib/form';
import { clearSaved, loadSaved, saveProfile, setHandoff, takeHandoff, type BirthProfile } from '@/lib/profile';
import { saveNodeImage } from '@/lib/saveNodeImage';
import type { TodayResult } from '@/lib/saju/today';

type Screen = 'boot' | 'input' | 'loading' | 'result';
const MIN_LOADING_MS = 500;

export default function TodayPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>('boot');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [dateInfo, setDateInfo] = useState<TodayResult['date'] | null>(null);
  const [result, setResult] = useState<TodayResult | null>(null);
  const [offer, setOffer] = useState<BirthProfile | null>(null);
  const [remember, setRemember] = useState(false);
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState(''); const [msgErr, setMsgErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<FormState>(EMPTY_FORM);
  const rememberRef = useRef(false);
  formRef.current = form; rememberRef.current = remember;

  const fetchFortune = useCallback(async (f: FormState, opts: { quiet?: boolean } = {}) => {
    if (!opts.quiet) { setScreen('loading'); window.scrollTo(0, 0); }
    setError(''); setMsg('');
    const min = new Promise(r => setTimeout(r, opts.quiet ? 0 : MIN_LOADING_MS));
    try {
      const [res] = await Promise.all([
        fetch('/api/today', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toInput(f)) })
          .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error); return j as TodayResult; }),
        min,
      ]);
      if (rememberRef.current) { saveProfile(f); setSaved(true); }
      setResult(res); setDateInfo(res.date); setScreen('result');
    } catch (e) {
      setScreen('input'); setError((e as Error).message || '운세를 불러오지 못했어요. 다시 시도해 주세요.');
    }
  }, []);

  // 첫 진입: 저장(동의)된 정보가 있으면 바로 오늘의 운세, 없으면 다른 서비스에서 넘어온 정보가 있는지 묻는다.
  useEffect(() => {
    fetch('/api/today').then(r => r.json()).then(j => setDateInfo(d => d ?? j.date)).catch(() => {});
    const s = loadSaved();
    if (s) { const f = { ...EMPTY_FORM, ...s }; setForm(f); setRemember(true); rememberRef.current = true; setSaved(true); fetchFortune(f); return; }
    const h = takeHandoff();
    if (h) setOffer(h);
    setScreen('input');
  }, [fetchFortune]);

  // 한국 시간 자정이 지나면 새 운세로 바꾼다 (열어 둔 화면, 다시 돌아온 화면 모두)
  useEffect(() => {
    if (!result?.date.nextRefreshAt) return;
    const due = new Date(result.date.nextRefreshAt).getTime();
    const refresh = () => { if (Date.now() >= due) fetchFortune(formRef.current, { quiet: true }); };
    const t = setTimeout(refresh, Math.min(Math.max(due - Date.now() + 1500, 0), 2 ** 31 - 1));
    document.addEventListener('visibilitychange', refresh);
    return () => { clearTimeout(t); document.removeEventListener('visibilitychange', refresh); };
  }, [result, fetchFortune]);

  const errors = validate(form);
  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    const first = (['year', 'month', 'day', 'hour', 'minute', 'dstChoice'] as const).find(k => errors[k]);
    if (first) {
      setSubmitted(true);
      setTimeout(() => { const el = first === 'dstChoice' ? document.querySelector<HTMLElement>('[aria-labelledby="dst-q"] button') : document.getElementById('f-' + first); el?.focus(); }, 0);
      return;
    }
    if (!remember) { clearSaved(); setSaved(false); }
    fetchFortune(form);
  };
  const useOffer = () => { if (!offer) return; const f = { ...EMPTY_FORM, ...offer }; setForm(f); setOffer(null); fetchFortune(f); };
  const forget = () => { clearSaved(); setSaved(false); setRemember(false); setMsgErr(false); setMsg('이 기기에 저장된 출생 정보를 지웠어요.'); };

  const saveImage = async () => {
    if (busy || !cardRef.current || !result) return;
    setBusy(true); setMsg(''); setMsgErr(false);
    try { setMsg(await saveNodeImage(cardRef.current, `운결_오늘의운세_${result.date.ymd}.png`, '운결 · 오늘의 운세')); }
    catch (e) { if ((e as Error)?.name !== 'AbortError') { setMsg('이미지를 만들지 못했어요. 잠시 후 다시 시도해 주세요.'); setMsgErr(true); } }
    finally { setBusy(false); }
  };
  // 공유 링크에는 출생 정보를 넣지 않는다: 받는 사람은 자신의 생년월일로 오늘의 운세를 보게 된다.
  const shareLink = async () => {
    const url = `${location.origin}/today`;
    setMsgErr(false);
    try {
      if (navigator.share) { await navigator.share({ title: '운결 · 오늘의 운세', text: '하루 한 장, 오늘의 운세를 받아 보세요.', url }); return; }
      await navigator.clipboard.writeText(url);
      setMsg('오늘의 운세 링크를 복사했어요. 링크에는 출생 정보가 들어가지 않아요.');
    } catch (e) { if ((e as Error)?.name !== 'AbortError') { setMsg(`링크: ${url}`); } }
  };
  const toSaju = () => { setHandoff(form); router.push('/'); };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', isolation: 'isolate' }}>
      <Background variant="result" />
      <SiteHeader current="today" />

      <main className="today-wrap">
        {(screen === 'boot' || screen === 'loading') && (
          <div className="loading" aria-live="polite" style={{ padding: '48px 0 90px' }}>
            <div aria-hidden="true" className="loading__mark" style={{ width: 132, height: 132 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/art/enso.webp" alt="" width={640} height={640} />
              <span style={{ fontSize: 36 }}>日</span>
            </div>
            <div><h2>오늘의 운세첩을 펼치고 있어요</h2><p>오늘의 일진과 나의 사주를 맞춰 보는 중이에요.</p></div>
          </div>
        )}

        {screen === 'input' && (
          <form onSubmit={submit} noValidate className="sheet today-form" aria-labelledby="tf-title">
            <Corners />
            <div className="today-form__head">
              {dateInfo && <p className="almanac__date">{dateInfo.label} {dateInfo.weekday} <span>· {dateInfo.lunar}</span></p>}
              <h1 id="tf-title">오늘의 운세</h1>
              <p>생년월일로 오늘의 일진과 나의 사주를 맞춰 봐요.<br />사주 풀이를 먼저 하지 않아도 바로 볼 수 있어요.</p>
              {dateInfo && <Iljin date={dateInfo} />}
              <RuleOrn className="" />
            </div>

            {offer && (
              <div className="reuse" role="region" aria-label="입력한 정보 다시 쓰기">
                <p>‘나의 사주팔자’에서 입력한 출생 정보가 있어요.<br /><strong>{birthLine({ ...EMPTY_FORM, ...offer })}</strong></p>
                <p style={{ fontSize: 14 }}>이 정보로 오늘의 운세를 볼까요?</p>
                <div className="reuse__actions">
                  <button type="button" className="btn btn--primary btn--sm" onClick={useOffer}>이 정보로 보기</button>
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => setOffer(null)}>새로 입력하기</button>
                </div>
              </div>
            )}

            <BirthFields form={form} touched={touched} submitted={submitted} showRegion={false}
              onChange={patch => setForm(f => ({ ...f, ...patch }))} onTouch={k => setTouched(t => ({ ...t, [k]: true }))}
              genderLabel="성별"
              genderNote="애정운에서 전통 해석의 배우자 별(남성은 재성, 여성은 관성)을 볼 때만 쓰여요. 선택하지 않으면 두 기운을 함께 참고해요." />

            <div className="fieldset" style={{ gap: 8 }}>
              <label className="check"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />다음에도 바로 볼 수 있게 이 기기에 저장</label>
              <p className="note">동의한 경우에만 이 브라우저에 저장하고, 서버에는 저장하지 않아요. 이름은 받지 않으며 언제든 지울 수 있어요.</p>
              {saved && <button type="button" className="link-btn" style={{ alignSelf: 'flex-start' }} onClick={forget}>저장된 출생 정보 지우기</button>}
            </div>

            <div className="form-submit">
              {error && <p role="alert" className="callout callout--seal">{error}</p>}
              {msg && <p className="note" role="status">{msg}</p>}
              <button type="submit" className="btn btn--primary btn--lg btn--block">오늘의 운세 보기</button>
            </div>
          </form>
        )}

        {screen === 'result' && result && (
          <>
            {saved && (
              <div className="saved-note">
                <span>이 기기에 저장된 출생 정보로 본 운세예요.</span>
                <button className="link-btn" style={{ minHeight: 36 }} onClick={forget}>저장 정보 지우기</button>
              </div>
            )}
            <TodaySheet r={result} />
            <div className="today-actions">
              <button className="btn btn--primary btn--wide" onClick={saveImage} aria-busy={busy}>{busy ? '이미지 만드는 중…' : '오늘의 운세 이미지로 저장'}</button>
              <button className="btn btn--ghost btn--wide" onClick={shareLink}>링크 공유하기</button>
              <button className="btn btn--secondary" onClick={() => { fetchFortune(form); }}>다시 확인하기</button>
              <button className="btn btn--secondary" onClick={() => { setScreen('input'); setSubmitted(false); window.scrollTo(0, 0); }}>생년월일 변경</button>
              <button className="btn btn--secondary btn--wide" onClick={toSaju}>나의 전체 사주 확인하기</button>
            </div>
            <p aria-live="polite" className="save-msg" data-error={msgErr} style={{ textAlign: 'center' }}>{msg}</p>
            <p className="refresh-note">운세는 한국 시간 매일 자정에 새로 바뀌어요. 저장 이미지와 공유 링크에는 생년월일·출생 시간이 들어가지 않아요.</p>
            <TodayShareCard ref={cardRef} r={result} />
          </>
        )}
      </main>

      <footer className="site-footer">
        <RuleOrn />
        <p>운결 · 나의 운을 읽고, 좋은 인연을 연결하다</p>
      </footer>
    </div>
  );
}
