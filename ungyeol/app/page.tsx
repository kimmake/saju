'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import HomeCover from '@/components/HomeCover';
import InputScreen from '@/components/InputScreen';
import LoadingScreen from '@/components/LoadingScreen';
import ResultScreen from '@/components/ResultScreen';
import DailySection from '@/components/DailySection';
import TodayPoster from '@/components/TodayPoster';
import { RuleOrn } from '@/components/Ornaments';
import { Knot, PageFrame, SideArt, TopBar } from '@/components/Frame';
import { EMPTY_FORM, birthLine, toInput, type FormState } from '@/lib/form';
import { clearSaved, loadSaved, saveProfile } from '@/lib/profile';
import { saveNodeImage } from '@/lib/saveNodeImage';
import type { AnalyzeResult } from '@/lib/saju/types';
import type { TodayResult } from '@/lib/saju/today';

type Screen = 'home' | 'input' | 'loading' | 'result';
type Outcome<T> = { ok: true; r: T } | { ok: false; e: Error };
const MIN_LOADING_MS = 1200;

async function post<T>(url: string, f: FormState): Promise<T> {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toInput(f)) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || '풀이를 불러오지 못했어요. 다시 시도해 주세요.');
  return j as T;
}
const settle = <T,>(p: Promise<T>): Promise<Outcome<T>> => p.then(r => ({ ok: true as const, r }), e => ({ ok: false as const, e: e as Error }));

/**
 * 운결 흐름: 표지 → 출생 정보 한 번 입력 → 결과 (맨 위 오늘의 운세, 이어서 전체 사주).
 * 오늘의 운세는 /api/today, 사주는 기존 /api/analyze를 그대로 쓰며 둘을 동시에 요청한다.
 */
export default function Page() {
  const [screen, setScreen] = useState<Screen>('home');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [remember, setRemember] = useState(false);
  const [saved, setSaved] = useState<FormState | null>(null);
  const [loadStep, setLoadStep] = useState(0);
  const [today, setToday] = useState<TodayResult | null>(null);
  const [todayErr, setTodayErr] = useState('');
  const [saju, setSaju] = useState<AnalyzeResult | null>(null);
  const [sajuErr, setSajuErr] = useState('');
  const [sajuLoading, setSajuLoading] = useState(false);
  const [active, setActive] = useState<'today' | 'saju'>('today');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(''); const [msgErr, setMsgErr] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [host, setHost] = useState('');
  const run = useRef(0);
  const activeForm = useRef<FormState>(EMPTY_FORM);   // 결과를 만든 입력 (자정 갱신에 쓴다)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const posterRef = useRef<HTMLDivElement>(null);
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const scrollToPart = (id: 'today' | 'saju', smooth = true) => {
    const el = document.getElementById(id === 'today' ? 'today' : 'saju'); if (!el) return;
    window.scrollTo({ top: id === 'today' ? 0 : el.getBoundingClientRect().top + window.scrollY - 56, behavior: smooth ? 'smooth' : 'auto' });
    setActive(id);
  };

  const fetchSaju = useCallback(async (f: FormState, token: number) => {
    setSajuLoading(true); setSajuErr('');
    const s = await settle(post<AnalyzeResult>('/api/analyze', f));
    if (token !== run.current) return s;
    setSajuLoading(false);
    if (s.ok) setSaju(s.r); else setSajuErr(s.e.message);
    return s;
  }, []);

  /** 두 풀이를 함께 시작한다. 오늘의 운세가 오면 결과 화면을 열고, 사주는 이어서 채운다. */
  const start = useCallback(async (f: FormState, focus: 'today' | 'saju' = 'today') => {
    clearTimers();
    const token = ++run.current;
    activeForm.current = f;
    setScreen('loading'); setLoadStep(0); setFormError(''); setToday(null); setTodayErr(''); setSaju(null); setMsg(''); window.scrollTo(0, 0);
    timers.current = [setTimeout(() => setLoadStep(1), 450), setTimeout(() => setLoadStep(2), 900)];
    const min = new Promise(r => timers.current.push(setTimeout(r, MIN_LOADING_MS)));
    const sP = fetchSaju(f, token);
    const [t] = await Promise.all([settle(post<TodayResult>('/api/today', f)), min]);
    if (token !== run.current) return;
    if (!t.ok) {
      const s = await sP;
      if (token !== run.current) return;
      if (!s.ok) { setScreen('input'); setFormError(t.e.message); window.scrollTo(0, 0); return; }
      setTodayErr(t.e.message);
    } else setToday(t.r);
    setScreen('result');
    requestAnimationFrame(() => (focus === 'saju' ? setTimeout(() => scrollToPart('saju', false), 60) : window.scrollTo(0, 0)));
  }, [fetchSaju]);

  // 첫 진입: 저장(동의)된 정보가 있으면 표지에서 바로 이어 보기. /today 링크로 오면 오늘의 운세부터.
  useEffect(() => {
    setHost(location.host);
    const s = loadSaved();
    if (s) { setSaved(s); setForm(s); setRemember(true); }
    const go = new URLSearchParams(location.search).get('go');
    if (go === 'today') {
      history.replaceState(null, '', '/');
      if (s) start(s, 'today'); else setScreen('input');
    }
    return clearTimers;
  }, [start]);

  // 한국 시간 자정이 지나면 오늘의 운세만 다시 받는다 (사주 결과는 그대로 둔다).
  // 기기 시계와 서버 시계가 어긋나도 반복 요청하지 않도록, 1분에 한 번만 시도하고 날짜가 실제로 바뀐 경우에만 갱신한다.
  const lastTry = useRef(0);
  useEffect(() => {
    if (screen !== 'result' || !today?.date.nextRefreshAt) return;
    const due = new Date(today.date.nextRefreshAt).getTime(), shown = today.date.ymd;
    const refresh = async () => {
      if (Date.now() < due || Date.now() - lastTry.current < 60000) return;
      lastTry.current = Date.now();
      const t = await settle(post<TodayResult>('/api/today', activeForm.current));
      if (t.ok && t.r.date.ymd !== shown) setToday(t.r);
    };
    const id = setTimeout(refresh, Math.min(Math.max(due - Date.now() + 1500, 1500), 2 ** 31 - 1));
    document.addEventListener('visibilitychange', refresh);
    return () => { clearTimeout(id); document.removeEventListener('visibilitychange', refresh); };
  }, [screen, today]);

  // 결과 화면 위 바로가기: 지금 보고 있는 부분 표시
  useEffect(() => {
    if (screen !== 'result') return;
    const onScroll = () => { const el = document.getElementById('saju'); setActive(el && el.getBoundingClientRect().top < 140 ? 'saju' : 'today'); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [screen]);

  const goHome = () => { if (screen === 'loading') return; run.current++; setScreen('home'); window.scrollTo(0, 0); };
  const goInput = (f: FormState = form) => { setForm(f); setSubmitted(false); setTouched({}); setScreen('input'); window.scrollTo(0, 0); };
  const forget = () => { clearSaved(); setSaved(null); setRemember(false); setProfileMsg('이 기기에 저장된 출생 정보를 지웠어요.'); };
  const submit = () => {
    if (remember) { saveProfile(form); setSaved(form); } else if (saved) { clearSaved(); setSaved(null); }
    start(form);
  };

  const saveToday = async () => {
    if (busy || !posterRef.current || !today) return;
    setBusy(true); setMsg(''); setMsgErr(false);
    try { setMsg(await saveNodeImage(posterRef.current, `운결_오늘의운세_${today.date.ymd}.png`, '운결 · 오늘의 운세')); }
    catch (e) { if ((e as Error)?.name !== 'AbortError') { setMsg('이미지를 만들지 못했어요. 잠시 후 다시 시도해 주세요.'); setMsgErr(true); } }
    finally { setBusy(false); }
  };
  // 공유 링크에는 출생 정보를 넣지 않는다. 받는 사람은 자신의 정보로 보게 된다.
  const shareLink = async () => {
    const url = `${location.origin}/today`;
    setMsgErr(false);
    try {
      if (navigator.share) { await navigator.share({ title: '운결 · 오늘의 운세', text: '하루 한 장, 오늘의 운세를 펼쳐 보세요.', url }); return; }
      await navigator.clipboard.writeText(url);
      setMsg('링크를 복사했어요. 링크에는 이름·생년월일·출생 시간이 들어가지 않아요.');
    } catch (e) { if ((e as Error)?.name !== 'AbortError') setMsg(`링크: ${url}`); }
  };

  const nm = activeForm.current.name.trim();
  const title = nm ? `${nm}님의 사주 이야기` : '당신의 사주 이야기';

  return (
    <div className="shell">
      <PageFrame />
      <SideArt />

      {screen === 'home' && (
        <HomeCover savedLine={saved ? birthLine(saved) : null}
          onStart={() => goInput(saved ?? form)}
          onToday={() => saved && start(saved, 'today')}
          onSaju={() => saved && start(saved, 'saju')}
          onEdit={() => goInput(saved ?? form)}
          onForget={forget} />
      )}

      {screen === 'input' && (
        <>
          <TopBar onBack={goHome} onBrand={goHome} />
          <InputScreen form={form} touched={touched} submitted={submitted} formError={formError} remember={remember} hasSaved={!!saved}
            onChange={patch => setForm(f => ({ ...f, ...patch }))}
            onTouch={k => setTouched(t => ({ ...t, [k]: true }))}
            onInvalid={() => setSubmitted(true)}
            onSubmit={submit} onRemember={setRemember} onForget={forget} />
        </>
      )}

      {screen === 'loading' && (<><TopBar onBrand={goHome} /><LoadingScreen name={form.name.trim()} step={loadStep} /></>)}

      {screen === 'result' && (
        <>
          <TopBar onBack={goHome} onBrand={goHome} backLabel="처음 화면으로" />
          <nav className="jump" aria-label="결과 바로가기">
            <div className="jump__row">
              <button aria-current={active === 'today' ? 'true' : undefined} onClick={() => scrollToPart('today')}><b aria-hidden="true">一</b>오늘의 운세</button>
              <button aria-current={active === 'saju' ? 'true' : undefined} onClick={() => scrollToPart('saju')}><b aria-hidden="true">二</b>나의 사주팔자</button>
            </div>
          </nav>
          <main className="unified">
            {today ? <DailySection r={today} busy={busy} msg={msg} msgErr={msgErr} onSave={saveToday} onShare={shareLink} />
              : <section id="today" className="pending"><p>오늘의 운세를 불러오지 못했어요. {todayErr}</p><button className="btn btn--secondary" onClick={() => start(activeForm.current)}>다시 불러오기</button></section>}

            <div id="saju" className="part-divider">
              <Knot />
              <small>第二部</small>
              <h2 className="brush">나의 사주팔자</h2>
              <p>타고난 사주로 읽는 평생의 흐름 · 한 권의 해석서</p>
            </div>

            {saju ? (
              <ResultScreen result={saju} title={title} birthLine={birthLine(activeForm.current)} fileName={nm}
                onEdit={() => goInput(activeForm.current)}
                onRestart={() => goInput(EMPTY_FORM)}
                onRetry={() => fetchSaju(activeForm.current, run.current)} />
            ) : sajuLoading ? (
              <div className="pending" role="status">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/art/enso.webp" alt="" aria-hidden="true" width={640} height={640} />
                <p>사주 해석서를 차분히 엮고 있어요.<br />오늘의 운세를 먼저 읽어 보세요. (최대 20초쯤 걸려요)</p>
              </div>
            ) : (
              <div className="pending"><p>사주 풀이를 불러오지 못했어요. {sajuErr}</p><button className="btn btn--secondary" onClick={() => fetchSaju(activeForm.current, run.current)}>다시 불러오기</button></div>
            )}

            <section className="profile-box" aria-labelledby="h-profile">
              <h3 id="h-profile">출생 정보 관리</h3>
              <p>{saved ? `이 기기에 저장된 정보로 다음 방문 때 바로 볼 수 있어요: ${birthLine(saved)}` : '출생 정보는 저장하지 않았어요. 입력 화면에서 ‘이 기기에 저장’에 동의하면 다음 방문 때 바로 볼 수 있어요.'}</p>
              <div className="actions">
                <button className="btn btn--secondary btn--sm" onClick={() => goInput(activeForm.current)}>출생 정보 변경</button>
                {saved
                  ? <button className="btn btn--secondary btn--sm" onClick={forget}>저장 정보 삭제</button>
                  : <button className="btn btn--secondary btn--sm" onClick={() => { saveProfile(activeForm.current); setSaved(activeForm.current); setRemember(true); setProfileMsg('이 기기에 출생 정보를 저장했어요.'); }}>이 기기에 저장</button>}
              </div>
              {profileMsg && <p role="status" style={{ color: 'var(--navy)' }}>{profileMsg}</p>}
            </section>
          </main>
          {today && <TodayPoster ref={posterRef} r={today} host={host} />}
        </>
      )}

      <footer className="site-footer">
        <RuleOrn />
        <p>운결 · 나의 운을 읽고, 좋은 인연을 연결하다</p>
        <p style={{ marginTop: 6, fontSize: 12 }}>사주와 오늘의 운세는 전통 명리학에 기반한 참고용·오락용 콘텐츠예요.</p>
      </footer>
    </div>
  );
}
