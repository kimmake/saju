import Anthropic from '@anthropic-ai/sdk';
import { STEM, EL_KO, animal } from './constants';
import type { Chart } from './chart';

export interface FortuneSpec { id: string; title: string; icon: string; labels: [string, string]; tips: number; rule: string }

export const FORTUNE: FortuneSpec[] = [
  { id: 'children', title: '자녀운', icon: '子', labels: ['소통에서의 강점', '신경 쓰면 좋은 점'], tips: 2, rule: '자녀 유무·자녀 수·성별·임신 가능성을 단정하지 말고, 자녀나 가까운 어린 세대와의 관계·양육·소통 성향으로 쓴다.' },
  { id: 'spouse', title: '배우자운', icon: '緣', labels: ['잘 맞을 수 있는 상대', '관계에서 주의할 점'], tips: 2, rule: '연애·결혼 성향, 잘 맞는 상대의 특징, 강점과 주의점, 대화 팁. 결혼 시기·이혼 여부를 예언하지 않는다.' },
  { id: 'money', title: '금전운', icon: '財', labels: ['재정 관리에서의 강점', '소비할 때 주의할 습관'], tips: 2, rule: '돈을 벌고 관리하는 성향과 일상 관리 팁. 특정 투자 상품 추천이나 수익 보장 표현 금지.' },
  { id: 'work', title: '직장운', icon: '官', labels: ['직무를 탐색할 때 참고할 성향', '이직이나 새로운 도전 전 점검할 것'], tips: 2, rule: '잘 맞는 업무 환경·협업 강점. 특정 직업이나 취업 성공을 단정하지 않는다.' },
  { id: 'study', title: '공부운', icon: '學', labels: ['집중에 도움이 되는 환경', '주의할 습관'], tips: 3, rule: '학습 방식, 집중 환경, 장기 공부와 시험 준비의 강점, 미루기·과몰입 같은 주의 습관. 성적·합격을 예측하지 않는다. 전반적으로(summary·body·tips에 고르게) 고전을 읽거나 지금까지 해보지 않은 새로운 학문·분야에 도전하면 좋겠다는 취지를 명식 근거와 함께 자연스럽게 담는다(특정 책·강좌·자격증을 추천하거나 성과를 보장하지 않는다). 팁은 바로 실천할 수 있는 것 3개이며, 그중 하나는 고전 읽기나 새 학문 맛보기에 관한 것으로 한다.' },
];

export type AiJson = Record<string, any>;

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';

export async function interpret(chart: Chart): Promise<AiJson> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('no-api-key');
  const p = chart.pillars, el = chart.elements, ds = STEM[chart.dayStem];
  const pillarText = p.map(x => x.unknown ? `${x.label}: 시간 모름` : `${x.label}: ${x.stem}${x.branch} (천간 ${x.stemKo}·${EL_KO[x.stemEl as keyof typeof EL_KO]} ${x.stemGod}, 지지 ${x.branchKo}·${EL_KO[x.branchEl as keyof typeof EL_KO]} ${x.branchGod})`).join('\n');
  const sys = '당신은 전통 명리학에 밝은 한국어 사주 해설가입니다. 주어진 명식만 근거로, 따뜻하고 구체적인 해요체 문장을 씁니다. 점수·확률·퍼센트는 절대 쓰지 않고, 불안을 유도하거나 미래를 단정·예언하지 않습니다. 결제나 추가 상담을 권하지 않습니다. 반드시 JSON만 출력합니다.';
  const spec = FORTUNE.map(f => `"${f.id}": {"summary": 한 줄 요약(35자 내외), "body": [해석 4문장], "tips": [실천 팁 ${f.tips}개, 각 한 문장], "details": [{"label":"${f.labels[0]}","text":2문장},{"label":"${f.labels[1]}","text":2문장}]}  // ${f.rule}`).join(',\n');
  const prompt = `[명식]\n${pillarText}\n일간: ${chart.dayStem}(${ds[0]}${EL_KO[ds[1]]}, ${ds[2] ? '양' : '음'})\n오행 개수: 목${el.wood} 화${el.fire} 토${el.earth} 금${el.metal} 수${el.water}\n띠: ${animal(chart.yearBranch)}띠\n${chart.daeun || ''}\n\n[작성 규칙]\n- 각 항목 body의 1~2문장에는 일간·오행·십신 중 실제 근거를 자연스럽게 언급(예: "일간이 丙화라…", "재성이 드러나 있어…").\n- 쉬운 일상어, 문장당 60자 안팎. 한자는 괄호 없이 최소한으로.\n- 시간을 모르는 경우 시주 관련 해석은 하지 않는다.\n\n다음 형식의 JSON 하나만 출력:\n{\n"summary": 전체 흐름을 요약한 한 문장(45자 내외),\n"keywords": [핵심 키워드 3개, 각 2~7자 명사구],\n${spec}\n}`;
  const client = new Anthropic();
  const msg = await client.messages.create({ model: MODEL, max_tokens: 6000, system: sys, messages: [{ role: 'user', content: prompt }] });
  const text = msg.content.map(b => (b.type === 'text' ? b.text : '')).join('');
  const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
  FORTUNE.forEach(f => { const s = json[f.id]; if (!s || !Array.isArray(s.body) || !s.summary) throw new Error('bad-shape'); });
  return json;
}
