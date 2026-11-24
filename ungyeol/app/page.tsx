'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Background from '@/components/Background';
import InputScreen from '@/components/InputScreen';
import LoadingScreen from '@/components/LoadingScreen';
import ResultScreen from '@/components/ResultScreen';
import { RuleOrn } from '@/components/Ornaments';
import SiteHeader from '@/components/SiteHeader';
import { useRouter } from 'next/navigation';
import { loadSaved, setHandoff, takeHandoff, type BirthProfile } from '@/lib/profile';
import { EMPTY_FORM, birthLine, toInput, type FormState } from '@/lib/form';
import type { AnalyzeResult } from '@/lib/saju/types';

type Screen = 'input' | 'loading' | 'result';
const MIN_LOADING_MS = 2700;

export default function Page() {
  const [screen, setScreen] = useState<Screen>('input');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [formError, setFormError] = useState('');
  const run = useRef(0);
  const router = useRouter();
  // 다른 서비스에서 넘어온 정보(또는 저장에 동의한 정보)가 있으면 바로 채우지 않고 먼저 묻는다.
  const [reuse, setReuse] = useState<{ profile: BirthProfile; source: 'today' | 'saved' } | null>(null);
  useEffect(() => {
    const h = takeHandoff();
    if (h) { setReuse({ profile: h, source: 'today' }); return; }
    const s = loadSaved();
    if (s) setReuse({ profile: s, source: 'saved' });
  }, []);
  const goToday = () => { setHandoff(form); router.push('/today'); };
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => clearTimers, []);

  const startAnalysis = useCallback(async (f: FormState) => {
    clearTimers();
    const token = ++run.current;
    setScreen('loading'); setLoadStep(0); setFormError(''); window.scrollTo(0, 0);
    timers.current = [setTimeout(() => setLoadStep(1), 900), setTimeout(() => setLoadStep(2), 1800)];
    const min = new Promise(r => timers.current.push(setTimeout(r, MIN_LOADING_MS)));
    try {
      const [res] = await Promise.all([
        fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toInput(f)) })
          .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error); return j as AnalyzeResult; }),
        min,
      ]);
      if (token !== run.current) return;
      setResult(res); setScreen('result'); window.scrollTo(0, 0);
    } catch (err) {
      if (token !== run.current) return;
      setScreen('input'); setFormError((err as Error).message || '분석 중 문제가 생겼어요. 다시 시도해 주세요.'); window.scrollTo(0, 0);
    }
  }, []);

  const nm = form.name.trim();
  const title = nm ? `${nm}님의 사주 이야기` : '당신의 사주 이야기';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', isolation: 'isolate' }}>
      <Background variant={screen === 'result' ? 'result' : 'home'} />
      <SiteHeader current="saju" onBrand={() => { if (screen !== 'loading') { setScreen('input'); window.scrollTo(0, 0); } }} />

      {screen === 'input' && (
        <InputScreen form={form} touched={touched} submitted={submitted} formError={formError}
          reuse={reuse} onReuse={() => { if (reuse) setForm(f => ({ ...f, ...reuse.profile })); setReuse(null); }} onDismissReuse={() => setReuse(null)}
          onChange={patch => setForm(f => ({ ...f, ...patch }))}
          onTouch={k => setTouched(t => ({ ...t, [k]: true }))}
          onInvalid={() => setSubmitted(true)}
          onSubmit={() => startAnalysis(form)} />
      )}
      {screen === 'loading' && <LoadingScreen name={nm} step={loadStep} />}
      {screen === 'result' && result && (
        <ResultScreen result={result} title={title} birthLine={birthLine(form)} fileName={nm}
          onEdit={() => { setScreen('input'); setSubmitted(false); setTouched({}); window.scrollTo(0, 0); }}
          onRestart={() => { setScreen('input'); setForm(EMPTY_FORM); setSubmitted(false); setTouched({}); setResult(null); window.scrollTo(0, 0); }}
          onRetry={() => startAnalysis(form)} onToday={goToday} />
      )}

      <footer className="site-footer">
        <RuleOrn />
        <p>운결 · 나의 운을 읽고, 좋은 인연을 연결하다</p>
      </footer>
    </div>
  );
}
