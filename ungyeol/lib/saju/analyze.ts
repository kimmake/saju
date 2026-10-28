import { createHash } from 'node:crypto';
import { STEM, EL_KO, EL_HAN, animal } from './constants';
import { computeChart, elementNote } from './chart';
import { baseMatches, yearMatches } from './matches';
import { sewoon, supplement } from './sewoon';
import { ruleInterpret } from './ruleInterpret';
import { FORTUNE, interpret, type AiJson, type FortuneSpec } from './interpret';
import type { AnalyzeResult, FortuneSection, SajuInput, Section } from './types';

function fortuneSection(f: FortuneSpec, ai: AiJson | null): FortuneSection {
  const s = ai && ai[f.id];
  return s
    ? { id: f.id, type: 'fortune', title: f.title, icon: f.icon, summary: s.summary, body: s.body.slice(0, 7), tips: (s.tips || []).slice(0, f.tips), details: (s.details || []).slice(0, 4) }
    : { id: f.id, type: 'fortune', title: f.title, icon: f.icon, summary: '해석 문장을 불러오지 못했어요.', body: ['명식 계산은 끝났지만 해석 문장을 만드는 중에 문제가 생겼어요. 위쪽의 ‘해석 다시 불러오기’를 눌러 주세요.'], tips: [], details: [] };
}

// 성공한 해석만 입력 해시로 캐시해 같은 입력에는 같은 결과를 보여 준다. (프로세스 메모리 — 운영에서는 외부 캐시로 교체)
const cache = new Map<string, AiJson>();

export async function analyze(input: SajuInput): Promise<AnalyzeResult> {
  const key = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  const chart = computeChart(input);
  const my = chart.yearBranch, base = baseMatches(my), yr = yearMatches(my);
  let ai: AiJson | null = cache.get(key) ?? null;
  let source: 'ai' | 'rule' = 'ai';
  if (!ai) {
    try { ai = await interpret(chart); cache.set(key, ai); } catch (e) {
      // 키가 없거나 호출이 실패하면 규칙 기반 풀이로 대체한다.
      if ((e as Error).message !== 'no-api-key') console.error('interpret failed:', (e as Error).message);
      ai = ruleInterpret(chart, input.gender); source = 'rule';
    }
  }
  const total = Object.values(chart.elements).reduce((a, b) => a + b, 0);
  const ds = STEM[chart.dayStem];
  const sections: Section[] = [];
  FORTUNE.slice(0, 4).forEach(f => sections.push(fortuneSection(f, ai)));
  sections.push({ id: 'match', type: 'match', title: '나와 어울리는 띠 TOP 3', icon: '合', summary: base.summary, ranks: base.ranks,
    notice: `띠 궁합은 전체 사주 중 일부를 바탕으로 한 참고 해석이에요. 이 순위는 태어난 해의 지지(${my})를 기준으로 합(合) 관계를 따져 정했어요.`,
    boundary: `띠는 양력 1월 1일이 아니라 입춘(대개 2월 4일 전후)을 기준으로 바뀌어요. 운결은 만세력의 절기 시각을 기준으로 출생 띠를 정하고, 음력 설날과도 구분해요. 입력한 정보로 계산한 띠는 ${animal(my)}띠(${chart.gz.year}년)예요.` });
  sections.push({ id: 'year', type: 'year', title: '2027년 함께하면 좋은 띠 TOP 3', icon: '未', summary: yr.summary, criteria: yr.criteria, ranks: yr.ranks });
  sections.push(sewoon(chart));
  sections.push(fortuneSection(FORTUNE[4], ai));
  const note = elementNote(chart.elements);
  return {
    meta: { isDemo: false, label: '만세력 계산 결과', chartTag: '만세력 계산', interpFailed: false, source,
      note: source === 'ai' ? '사주팔자와 띠 궁합은 만세력으로 계산했고, 해석 문장은 AI가 명식을 바탕으로 작성했어요.' : '사주팔자와 띠 궁합은 만세력으로 계산했고, 해석 문장은 일간과 십신 분포를 전통 해석 규칙에 따라 풀이한 거예요.' },
    identity: `${animal(my)}띠 · 일간 ${chart.dayStem}(${ds[0]}${EL_KO[ds[1]]})`,
    summary: ai ? ai.summary : `일간 ${chart.dayStem}(${ds[0]}${EL_KO[ds[1]]})를 중심으로 ${note.replace(' 구성이에요.', ' 사주예요.')}`,
    keywords: ai && Array.isArray(ai.keywords) ? ai.keywords.slice(0, 3) : [`${EL_KO[ds[1]]}(${EL_HAN[ds[1]]})의 일간`, `${animal(my)}띠`, '만세력 명식'],
    pillars: chart.pillars, elements: chart.elements, elementNote: note + ` ${total}글자 중 각 오행이 나타난 개수예요.`,
    supplement: supplement(chart),
    chartNote: ['가운데 강조된 일주의 천간(일간)이 ‘나’를 나타내요.'].concat(chart.notes).join(' '),
    daeun: chart.daeun,
    sections,
  };
}
