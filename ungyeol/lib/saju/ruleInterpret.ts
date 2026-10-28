import { STEM, EL_KO, EL_HAN, SANHE, rel, tenGod } from './constants';
import type { Chart } from './chart';
import type { AiJson } from './interpret';

/**
 * 규칙 기반 해석: 일간·십신 분포·월지·일지·시지를 근거로 전통 명리 입문 해석(자평명리의 십신론)을 문장으로 옮긴 것.
 * 같은 명식에는 항상 같은 문장이 나온다. 점수·확률·시기 단정은 쓰지 않는다.
 */
type Group = '비겁' | '식상' | '재성' | '관성' | '인성';
type Lv = 'low' | 'mid' | 'high';
const GROUP: Record<string, Group> = { 비견: '비겁', 겁재: '비겁', 식신: '식상', 상관: '식상', 편재: '재성', 정재: '재성', 편관: '관성', 정관: '관성', 편인: '인성', 정인: '인성' };
const GROUP_LABEL: Record<Group, string> = { 비겁: '비겁(나와 같은 기운)', 식상: '식상(표현하는 기운)', 재성: '재성(재물·현실의 기운)', 관성: '관성(규율·책임의 기운)', 인성: '인성(배움·보호의 기운)' };
const GROUP_WORD: Record<Group, string> = { 비겁: '자립심', 식상: '표현력', 재성: '현실 감각', 관성: '책임감', 인성: '배움과 사색' };
const GOD_TRAIT: Record<string, string> = {
  비견: '독립심과 자존심', 겁재: '승부욕과 경쟁심', 식신: '여유로운 표현과 돌봄', 상관: '날카로운 표현력과 개성', 편재: '활동적이고 유동적인 재물 감각',
  정재: '성실하고 안정적인 관리 습관', 편관: '책임감과 긴장감 있는 추진력', 정관: '원칙과 질서를 지키려는 태도', 편인: '독특한 사고와 직관', 정인: '배우고 보살피려는 마음',
};
const STEM_INFO: Record<string, { image: string; trait: string; env: string }> = {
  甲: { image: '곧게 뻗는 큰 나무', trait: '곧고 추진력이 있으며 앞장서려는', env: '탁 트이고 햇빛이 드는 곳' },
  乙: { image: '유연한 풀과 덩굴', trait: '부드럽고 적응력이 좋으며 끈기 있는', env: '사람 소리가 적당히 있는 아늑한 곳' },
  丙: { image: '밝은 태양', trait: '밝고 열정적이며 숨김이 적은', env: '환하고 활기찬 공간' },
  丁: { image: '은은한 촛불', trait: '섬세하고 따뜻하며 집중이 깊은', env: '조용하고 조명이 안정된 공간' },
  戊: { image: '듬직한 큰 산', trait: '묵직하고 믿음직하며 중심이 단단한', env: '자리가 안정되고 정돈된 공간' },
  己: { image: '곡식을 기르는 논밭', trait: '세심하고 포용력이 있으며 현실적인', env: '정리가 잘 된 편안한 공간' },
  庚: { image: '단단한 바위와 쇠', trait: '결단력 있고 의리가 강하며 원칙을 중시하는', env: '군더더기 없이 깔끔한 공간' },
  辛: { image: '잘 다듬어진 보석', trait: '섬세하고 예민하며 완성도를 중시하는', env: '깨끗하고 차분한 공간' },
  壬: { image: '넓게 흐르는 큰 강', trait: '스케일이 크고 지혜로우며 흐름을 읽는', env: '생각이 막히지 않게 트인 공간' },
  癸: { image: '촉촉한 비와 이슬', trait: '차분하고 감수성이 풍부하며 통찰이 깊은', env: '조용하고 아늑한 공간' },
};
const tr = (g: string) => `${GOD_TRAIT[g]}${iga(GOD_TRAIT[g])}`;
// 지장간(地藏干): 지지 속에 숨은 천간. 마지막 글자가 정기(본기)다.
const HIDDEN: Record<string, string> = { 子: '壬癸', 丑: '癸辛己', 寅: '戊丙甲', 卯: '甲乙', 辰: '乙癸戊', 巳: '戊庚丙', 午: '丙己丁', 未: '丁乙己', 申: '戊壬庚', 酉: '庚辛', 戌: '辛丁戊', 亥: '戊甲壬' };
const lv = (n: number): Lv => (n >= 3 ? 'high' : n === 2 ? 'mid' : 'low');
const iga = (w: string) => { const c = w.charCodeAt(w.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 === 0 ? '가' : '이'; };
const topic = (w: string) => { const c = w.charCodeAt(w.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 === 0 ? '는' : '은'; };

interface Entry { summary: string; s2: string; d: [string, string]; tips: string[] }
type Table = Record<Lv, Entry>;

// ── 자녀운: 전통적으로 여성은 식상, 남성은 관성을 자녀성으로 본다. 성별 미선택이면 식상(표현·돌봄)으로 본다. ──
const CHILDREN: Table = {
  low: { summary: '말보다 행동으로 곁을 지켜 주는 스타일이에요.', s2: '아이나 어린 세대에게 감정을 길게 표현하기보다 필요한 순간에 조용히 챙겨 주는 편이에요.',
    d: ['말수가 적어도 묵묵히 곁에 있어 주는 모습이 아이에게 큰 안정감이 될 수 있어요.', '마음속 생각이 잘 안 드러나 아이가 속마음을 모를 수 있으니, 짧은 말이라도 표현해 주면 좋아요.'],
    tips: ['하루 한 번, 아이의 이야기를 끝까지 듣는 시간을 만들어 보세요.', '고마운 일이나 대견한 일은 짧게라도 말로 전해 보세요.'] },
  mid: { summary: '다정함과 절제가 균형을 이루는 소통 스타일이에요.', s2: '필요할 때는 따뜻하게 표현하고, 선을 지켜야 할 때는 차분히 지켜 주는 균형이 보여요.',
    d: ['아이의 이야기를 듣고 조언하는 균형 감각이 소통의 강점이에요.', '바쁠 때는 대화가 짧아질 수 있으니 시간을 정해 두면 관계가 더 단단해져요.'],
    tips: ['규칙은 이유와 함께 설명해 주세요.', '아이와 함께하는 정기적인 활동을 하나 정해 보세요.'] },
  high: { summary: '표현이 풍부하고 정이 많은 소통 스타일이에요.', s2: '마음을 말과 행동으로 아낌없이 표현하는 편이라 아이나 어린 세대가 곁에서 따뜻함을 느끼기 쉬워요.',
    d: ['풍부한 표현과 관심이 아이에게 사랑받는다는 느낌을 주는 강점이에요.', '마음이 앞서면 간섭이나 잔소리로 느껴질 수 있으니, 도움을 주기 전에 아이의 의견을 먼저 물어보세요.'],
    tips: ['조언하기 전에 “도움이 필요하니?”라고 먼저 물어보세요.', '아이가 스스로 해 볼 시간을 기다려 주세요.'] },
};
// ── 배우자운: 배우자성(여성 관성, 남성 재성)의 많고 적음 + 배우자궁(일지) 십신 ──
const SPOUSE: Table = {
  low: { summary: '천천히 알아 가며 깊어지는 관계를 선호해요.', s2: '관계에서 서두르기보다 충분히 알고 신뢰가 쌓인 뒤에 마음을 여는 편이에요.',
    d: ['취향과 속도를 존중해 주고 편안하게 시간을 함께 쓸 수 있는 상대와 잘 맞을 수 있어요.', '마음을 표현하는 데 시간이 걸려 상대가 거리감을 느낄 수 있으니, 관심을 말로 전해 보세요.'],
    tips: ['좋아하는 마음은 짧게라도 말로 전해 보세요.', '관계의 속도에 대해 서로 편하게 이야기해 보세요.'] },
  mid: { summary: '안정과 설렘을 함께 바라는 균형 잡힌 관계관이에요.', s2: '관계에서 책임감과 애정 표현을 모두 중요하게 여기는 균형 잡힌 모습이 보여요.',
    d: ['대화가 잘 통하고 생활의 기준이 비슷한 상대와 편안한 관계를 만들 수 있어요.', '기대가 서로 다를 때 속으로 참기보다 일찍 이야기를 나누는 습관이 도움이 돼요.'],
    tips: ['서운한 일은 그날 안에 부드럽게 말해 보세요.', '함께 하는 일상의 루틴을 하나 만들어 보세요.'] },
  high: { summary: '관계에 깊이 마음을 쏟는 열정적인 타입이에요.', s2: '관계에 대한 관심과 기대가 커서 애정을 깊게 쏟고 관계를 소중히 지키려는 모습이 보여요.',
    d: ['헌신적이고 관계를 챙기는 힘이 커서 가까운 사람에게 든든한 사람이 될 수 있어요.', '기대가 커지면 상대에게 부담이 될 수 있으니 각자의 시간과 공간도 존중해 주세요.'],
    tips: ['기대하는 바를 먼저 솔직히 말하고 상대의 기대도 물어보세요.', '각자의 시간을 갖는 날을 정해 두세요.'] },
};
// ── 금전운: 재성의 많고 적음 ──
const MONEY: Table = {
  low: { summary: '큰 욕심보다 필요한 만큼 꾸준히 관리하는 스타일이에요.', s2: '재물 자체보다 일의 의미나 배움에 마음이 가서 돈 관리를 뒤로 미루기 쉬운 면이 있어요.',
    d: ['욕심을 부리지 않아 무리한 소비나 과한 지출이 적은 편이에요.', '수입과 지출 파악이 느슨해지기 쉬우니 자동이체나 가계부 같은 시스템이 도움이 돼요.'],
    tips: ['월 고정 지출을 한 번에 정리해 보세요.', '저축은 자동이체로 먼저 빼 두세요.'] },
  mid: { summary: '벌고 쓰는 균형을 잡아 가는 안정형이에요.', s2: '필요한 곳에는 쓰고 모으는 것도 놓치지 않는 균형 잡힌 재물 감각이 보여요.',
    d: ['계획한 만큼 꾸준히 관리하는 힘이 강점이에요.', '기분이나 분위기로 인한 즉흥 소비가 늘 수 있으니 구매 전 하루 기다려 보세요.'],
    tips: ['큰 지출은 하루 뒤에 결정해 보세요.', '월말에 지출을 10분만 돌아보세요.'] },
  high: { summary: '재물 감각이 살아 있는 현실적인 스타일이에요.', s2: '돈의 흐름과 기회를 보는 현실 감각이 좋아서 수입을 늘리고 관리하는 데 관심이 많아요.',
    d: ['현실 감각이 좋고 기회를 알아보는 눈이 강점이에요.', '벌이에 집중하다 쓰는 데에 무심해지거나 욕심이 앞서기 쉬우니 지출 기준을 정해 두세요.'],
    tips: ['수입의 일정 비율을 먼저 저축으로 정해 두세요.', '큰 결정 전에는 근거와 위험을 적어서 확인하세요.'] },
};
const MONEY_STRENGTH = {
  strong: '일간의 힘이 든든한 편이라 재물의 기회가 와도 감당할 체력이 있어요.',
  weak: '일간의 힘이 다소 약한 편이라 무리한 확장보다 기반을 먼저 다지는 편이 안정적이에요.',
  balanced: '일간의 힘과 주변 기운이 비교적 균형을 이뤄 한 걸음씩 쌓아 가기 좋아요.',
};
// ── 직장운: 가장 두드러진 십신 그룹으로 업무 스타일을 본다 ──
const WORK: Record<Group, { summary: string; s2: string; d: [string, string]; tips: string[] }> = {
  식상: { summary: '아이디어와 표현으로 존재감을 드러내는 스타일이에요.', s2: '기획·표현·소통처럼 생각을 밖으로 풀어내는 일에서 강점이 드러나는 편이에요.',
    d: ['새로운 아이디어를 내거나 설명하고 가르치는 환경에서 힘을 발휘할 수 있어요.', '자유로운 만큼 규칙이나 마감을 느슨하게 볼 수 있으니 점검할 기준을 미리 정해 두세요.'],
    tips: ['아이디어는 메모해 두고 실행 순서를 정해 보세요.', '새로운 일을 맡기 전 마감과 역할을 먼저 확인하세요.'] },
  재성: { summary: '결과와 실속을 챙기는 실무형 스타일이에요.', s2: '성과·수치·고객처럼 눈에 보이는 결과를 다루는 일에서 현실 감각이 잘 드러나요.',
    d: ['목표와 성과가 분명하고 실무 감각이 필요한 환경이 잘 맞을 수 있어요.', '결과에 집중하다 과정이나 사람 관계를 놓칠 수 있으니 주변과의 협력도 신경 써 주세요.'],
    tips: ['새로운 도전 전에 필요한 자원과 기간을 적어 보세요.', '성과뿐 아니라 과정도 동료와 나누세요.'] },
  관성: { summary: '책임감 있게 조직의 중심을 잡는 스타일이에요.', s2: '맡은 역할과 질서를 중요하게 여기고 책임을 끝까지 지려는 모습이 눈에 띄어요.',
    d: ['체계와 역할이 분명한 조직에서 신뢰를 쌓기 쉬운 성향이에요.', '책임을 혼자 지려다 부담이 커질 수 있으니 도움을 요청하는 연습이 필요해요.'],
    tips: ['역할과 권한의 범위를 먼저 확인하세요.', '혼자 안고 있는 일을 하나 골라 나눠 보세요.'] },
  인성: { summary: '배우고 준비하며 깊이를 쌓는 스타일이에요.', s2: '전문성과 지식을 쌓고 안정적으로 지원받는 환경에서 실력이 잘 자라는 편이에요.',
    d: ['연구·기획·교육처럼 준비와 이해가 중요한 일에서 강점이 있어요.', '준비가 길어지면 시작이 늦어질 수 있으니 작은 실행부터 해 보세요.'],
    tips: ['배운 내용을 작은 결과물로 정리해 공유해 보세요.', '준비 기간에 마감일을 정해 두세요.'] },
  비겁: { summary: '자기 주도로 일하며 동료와 호흡을 맞추는 스타일이에요.', s2: '스스로 판단하고 움직이는 힘이 있어 독립적인 역할이나 팀 안의 동료 관계에서 힘을 얻어요.',
    d: ['자율성이 주어지고 비슷한 목표를 가진 동료와 함께하는 환경에서 힘이 나요.', '내 방식이 강해질 때는 의견 충돌이 생길 수 있으니 상대의 의견을 먼저 요약해 되묻는 습관이 도움이 돼요.'],
    tips: ['의견이 다를 때는 상대 말을 먼저 한 번 정리해 주세요.', '독립적으로 맡을 수 있는 일의 범위를 상사와 합의하세요.'] },
};
// ── 공부운: 인성(배움)의 많고 적음 ──
const STUDY: Table = {
  low: { summary: '직접 해 보며 몸으로 익힐 때 실력이 붙는 스타일이에요.', s2: '앉아서 오래 외우기보다 문제를 풀고 직접 해 보는 방식에서 이해가 빨라지는 편이에요.',
    d: ['짧게 나눠 집중하고 바로 적용해 보는 환경에서 효율이 높아질 수 있어요.', '기초를 건너뛰고 응용부터 하기 쉬우니 핵심 개념을 한 번씩 정리해 두세요.'],
    tips: ['25분 집중 후 5분 쉬는 방식으로 공부해 보세요.', '배운 것은 그날 문제로 바로 확인하세요.'] },
  mid: { summary: '이해하고 정리하며 차근차근 쌓는 스타일이에요.', s2: '개념을 이해하고 자기 말로 정리할 때 꾸준히 실력이 쌓이는 균형 잡힌 학습 성향이에요.',
    d: ['요약 노트나 설명하기 같은 정리 방식이 잘 맞아요.', '마음이 급하면 진도에 쫓기기 쉬우니 주간 복습 시간을 정해 두세요.'],
    tips: ['주 1회 한 주 분량을 한 장으로 요약해 보세요.', '모르는 부분은 표시해 두고 주말에 모아서 해결하세요.'] },
  high: { summary: '깊이 파고들며 이해하는 학자형 스타일이에요.', s2: '원리를 이해하고 깊이 생각하는 힘이 커서 긴 호흡의 공부와 독서에서 강점이 드러나요.',
    d: ['조용히 몰입할 수 있는 환경에서 장기 공부와 시험 준비의 힘이 커질 수 있어요.', '준비만 길어지거나 완벽을 바라다 시작이 늦어질 수 있으니 작은 목표와 마감을 정해 두세요.'],
    tips: ['공부 계획에 시작일과 마감일을 함께 적어 두세요.', '배운 것을 다른 사람에게 설명해 보며 실행으로 연결하세요.'] },
};
// 공부운 전반: 고전·새로운 학문에 도전하면 좋다는 취지 (그룹별 근거)
const STUDY_CHALLENGE: Record<Group, { s: string; tip: string }> = {
  인성: { s: '인성이 두드러져 오래 읽히는 고전을 곱씹고, 지금까지 접해 보지 않은 새로운 학문에 도전하면 깊이와 시야가 함께 넓어지기 좋아요.', tip: '이번 달에는 고전 한 권을 골라 매일 몇 쪽씩 읽고, 낯선 분야 입문서도 한 권 곁들여 보세요.' },
  식상: { s: '식상이 강해 호기심과 표현이 풍부하니, 해 보지 않은 새로운 학문을 맛보고 고전을 내 말로 풀어 써 보면 공부가 즐거워져요.', tip: '관심이 가는 새 분야를 한 달만 가볍게 시작하고, 고전 구절 하나를 내 말로 써 보세요.' },
  재성: { s: '재성이 강해 실용 쪽으로 기울기 쉬우니, 고전을 읽어 사고의 뿌리를 다지고 새로운 학문에 도전하면 현실 감각이 더 단단해져요.', tip: '실용서 사이에 고전 한 권을 끼워 읽고, 낯선 학문의 기초 개념을 한 번 훑어보세요.' },
  관성: { s: '관성이 강해 체계를 갖춘 공부에 강하니, 고전으로 기본기를 쌓고 정해진 틀 밖의 새로운 학문에 도전하면 관점이 넓어져요.', tip: '고전 읽기를 주간 일정에 넣고, 평소 공부와 다른 분야 강의를 하나 들어 보세요.' },
  비겁: { s: '비겁이 강해 함께 배울 때 힘이 나니, 고전 읽기 모임이나 새로운 학문을 함께 배울 사람을 찾으면 꾸준히 이어 가기 좋아요.', tip: '고전을 같이 읽거나 새 분야를 같이 배울 사람과 주 1회 이야기 나눠 보세요.' },
};

export interface Analysis { hidden: Set<Group>; counts: Record<Group, number>; dominant: Group; strength: 'strong' | 'weak' | 'balanced'; monthGod?: string; dayBranchGod?: string; timeBranchGod?: string }

export function analyzeGods(chart: Chart): Analysis {
  const counts: Record<Group, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  chart.pillars.forEach(p => {
    if (p.unknown) return;
    if (p.stemGod && GROUP[p.stemGod]) counts[GROUP[p.stemGod]]++;
    if (p.branchGod && GROUP[p.branchGod]) counts[GROUP[p.branchGod]]++;
  });
  const [time, day, month] = chart.pillars;
  const monthGod = month.branchGod, monthGroup = monthGod ? GROUP[monthGod] : undefined;
  const order: Group[] = [...(monthGroup ? [monthGroup] : []), '식상', '재성', '관성', '인성', '비겁'];
  const dominant = order.reduce((best, g) => (counts[g] > counts[best] ? g : best), order[0]);
  // 지장간: 정기를 뺀 숨은 천간(중기·여기)은 0.5로 세어 강약 판단에 더하고, 어떤 십신이 숨어 있는지도 기록한다.
  const hidden = new Set<Group>(), extra: Record<Group, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  chart.pillars.forEach(p => {
    if (p.unknown) return;
    const hs = HIDDEN[p.branch];
    [...hs].forEach((h, i) => { const g = GROUP[tenGod(chart.dayStem, h)]; hidden.add(g); if (i < hs.length - 1) extra[g] += 0.5; });
  });
  const self = counts.비겁 + counts.인성 + extra.비겁 + extra.인성 + (monthGroup === '비겁' || monthGroup === '인성' ? 1 : 0);
  const other = counts.식상 + counts.재성 + counts.관성 + extra.식상 + extra.재성 + extra.관성 + (monthGroup && monthGroup !== '비겁' && monthGroup !== '인성' ? 1 : 0);
  return { hidden, counts, dominant, strength: self > other ? 'strong' : self < other ? 'weak' : 'balanced', monthGod, dayBranchGod: day.branchGod, timeBranchGod: time.unknown ? undefined : time.branchGod };
}

const cntText = (g: Group, n: number, hid: boolean) => (n === 0 ? `${GROUP_LABEL[g]}${iga(GROUP_LABEL[g])} 겉으로 드러난 글자에는 없${hid ? '지만 지지 속에 숨어 있고' : '고'}` : `${GROUP_LABEL[g]}${iga(GROUP_LABEL[g])} ${n}개로 ${n >= 3 ? '많고' : n === 2 ? '적당하고' : '적고'}`);

const POS = ['시지', '일지', '월지', '년지'];
/** 대상 지지(인덱스 t)와 다른 지지의 관계: 충(沖)을 먼저, 없으면 합(合)을 찾는다. */
function branchRelation(chart: Chart, t: number): { kind: 'chong' | 'he'; other: string } | null {
  const bs = chart.pillars.map(p => (p.unknown ? null : p.branch));
  if (!bs[t]) return null;
  const others = [1, 2, 3, 0].filter(i => i !== t && bs[i]);
  const c = others.find(i => rel(bs[t]!, bs[i]!) === 'chong'); if (c !== undefined) return { kind: 'chong', other: POS[c] };
  const h = others.find(i => rel(bs[t]!, bs[i]!) === 'liuhe'); if (h !== undefined) return { kind: 'he', other: POS[h] };
  return null;
}
function sanheSentence(chart: Chart): string {
  const bs = chart.pillars.filter(p => !p.unknown).map(p => p.branch);
  const g = SANHE.find(([chars]) => [...chars].every(c => bs.includes(c)));
  return g ? ` ${g[0]} 삼합이 갖춰져 ${EL_KO[g[1]]}(${EL_HAN[g[1]]}) 기운이 힘을 얻는 구조예요.` : '';
}

export function ruleInterpret(chart: Chart, gender: 'female' | 'male' | null): AiJson {
  const a = analyzeGods(chart), info = STEM_INFO[chart.dayStem], ds = STEM[chart.dayStem];
  const dayLabel = `일간 ${chart.dayStem}(${ds[0]}${EL_KO[ds[1]]}) 기준으로`;
  const img = `${info.image}처럼 ${info.trait} 기질`;
  const zero = (Object.keys(chart.elements) as (keyof typeof chart.elements)[]).filter(k => chart.elements[k] === 0);

  const childG: Group = gender === 'male' ? '관성' : '식상';
  const spouseG: Group = gender === 'female' ? '관성' : gender === 'male' ? '재성' : GROUP[a.dayBranchGod ?? ''] ?? '재성';

  const children = CHILDREN[lv(a.counts[childG])];
  const childEv = gender === 'male' ? '전통 해석에서 남성의 자녀성으로 보는 ' : gender === 'female' ? '전통 해석에서 여성의 자녀성으로 보는 ' : '표현과 돌봄을 나타내는 ';
  const spouse = SPOUSE[lv(a.counts[spouseG])];
  const money = MONEY[lv(a.counts.재성)];
  const work = WORK[a.dominant];
  const study = STUDY[lv(a.counts.인성)], ch = STUDY_CHALLENGE[a.dominant];

  const rChild = branchRelation(chart, 0), rSpouse = branchRelation(chart, 1), rWork = branchRelation(chart, 2);
  const childRel = rChild ? (rChild.kind === 'chong' ? ` 시지가 ${rChild.other}와 충(沖)을 이루어 자녀나 어린 세대와의 관계에서 거리 조절이나 변화가 필요한 때가 있을 수 있어요.` : ` 시지가 ${rChild.other}와 합(合)을 이루어 자녀나 어린 세대와 가까이 이어지려는 힘이 있어요.`) : '';
  const spouseRel = rSpouse ? (rSpouse.kind === 'chong' ? `배우자궁인 일지가 ${rSpouse.other}와 충(沖)을 이루어 관계에서 의견이 부딪히거나 변화가 생기기 쉬운 면이 있어요. 서로 다름을 조율하는 대화가 도움이 돼요.` : `배우자궁인 일지가 ${rSpouse.other}와 합(合)을 이루어 가까운 사이에서 서로 끌리고 맞춰 가려는 힘이 있어요.`) : '';
  const workRel = (rWork ? (rWork.kind === 'chong' ? `월지가 ${rWork.other}와 충(沖)을 이루어 환경 변화나 이동이 잦거나 마음이 흔들릴 때가 있을 수 있어요. 큰 결정 전에는 한 번 더 점검해 보세요.` : `월지가 ${rWork.other}와 합(合)을 이루어 조직이나 사람들과 조화를 이루려는 힘이 있어요.`) : '') + sanheSentence(chart);
  const timeSentence = a.timeBranchGod ? `자녀·말년을 보는 시주 지지에는 ${a.timeBranchGod}${iga(a.timeBranchGod)} 있어 ${tr(a.timeBranchGod)} 드러나는 편이에요.` : '태어난 시간을 몰라 시주가 보여 주는 자녀·말년의 흐름은 풀이에서 뺐어요.';
  const spouseSentence = a.dayBranchGod ? `배우자궁인 일지에 ${a.dayBranchGod}${iga(a.dayBranchGod)} 있어 가까운 사이에서는 ${tr(a.dayBranchGod)} 드러나기 쉬워요.` : '';
  const monthSentence = a.monthGod ? `월지에 ${a.monthGod}${iga(a.monthGod)} 있어 사회생활에서 ${tr(a.monthGod)} 자주 쓰이는 편이에요.` : '';
  const strengthSent = MONEY_STRENGTH[a.strength];
  const bigeopNote = a.counts.비겁 >= 3 ? '비겁이 많아 나눠 쓰거나 동료·지인에게 쓰는 일이 생기기 쉬우니 공동 지출의 기준을 미리 정해 두면 좋아요.' : a.counts.식상 >= 2 && a.counts.재성 >= 1 ? '표현하고 만들어 내는 힘이 재물로 이어지기 쉬운 구조라, 재능을 꾸준히 쓰는 것이 도움이 돼요.' : '수입이 쌓이는 속도보다 새는 곳을 먼저 살피는 것이 안정에 도움이 돼요.';
  const elemSentence = zero.length ? `${zero.map(k => `${EL_KO[k]}(${EL_HAN[k]})`).join('·')} 기운이 비어 있어, 그 기운과 관련된 활동을 일상에 조금 더해 보는 것도 좋아요.` : '오행이 두루 갖춰져 있어 한쪽으로 치우치지 않고 상황에 맞게 대응하는 힘이 있어요.';

  const keywords = [GROUP_WORD[a.dominant], `${info.image} 기질`, zero.length ? `${EL_KO[zero[0]]}(${EL_HAN[zero[0]]}) 보완` : '균형 잡힌 오행'];
  const ev = (g: Group) => `${dayLabel} ${cntText(g, a.counts[g], a.hidden.has(g))},`;

  return {
    summary: `${info.image} 같은 일간에 ${GROUP_WORD[a.dominant]}${iga(GROUP_WORD[a.dominant])} 돋보이는 사주예요.`,
    keywords,
    children: { summary: children.summary, body: [`${ev(childG)} 이 기운은 ${childEv}기운이에요.`, children.s2, timeSentence + childRel, `${img}이 아이와의 관계에서도 은연중에 드러나요.`], tips: children.tips, details: [{ label: '소통에서의 강점', text: children.d[0] }, { label: '신경 쓰면 좋은 점', text: children.d[1] }] },
    spouse: { summary: spouse.summary, body: [`${ev(spouseG)} 관계를 대하는 태도는 아래와 같이 읽을 수 있어요.`, spouse.s2, [spouseSentence, spouseRel].filter(Boolean).join(' '), '결혼이나 인연의 시기는 사주만으로 정할 수 없고, 이 풀이는 관계를 대하는 성향을 참고하는 용도예요.'].filter(Boolean), tips: spouse.tips, details: [{ label: '잘 맞을 수 있는 상대', text: spouse.d[0] }, { label: '관계에서 주의할 점', text: spouse.d[1] }] },
    money: { summary: money.summary, body: [`${ev('재성')} 돈을 대하는 성향은 아래와 같아요.`, money.s2, strengthSent, bigeopNote], tips: money.tips, details: [{ label: '재정 관리에서의 강점', text: money.d[0] }, { label: '소비할 때 주의할 습관', text: money.d[1] }] },
    work: { summary: work.summary, body: [`${img}에, 십신 중 ${GROUP_LABEL[a.dominant]}${iga(GROUP_LABEL[a.dominant])} 가장 두드러져요.`, work.s2, [monthSentence, workRel].filter(Boolean).join(' '), elemSentence].filter(Boolean), tips: work.tips, details: [{ label: '직무를 탐색할 때 참고할 성향', text: work.d[0] }, { label: '이직이나 새로운 도전 전 점검할 것', text: work.d[1] }] },
    study: {
      summary: `${study.summary.replace(/요\.$/, '요.')} 고전과 새로운 학문에 도전하면 좋아요.`,
      body: [`${ev('인성')} 학습 성향을 이렇게 볼 수 있어요.`, study.s2, ch.s, `${a.monthGod ? `월지에 ${a.monthGod}${iga(a.monthGod)} 있어 공부에서도 ${tr(a.monthGod)} 힘이 돼요.` : ''}`].filter(Boolean),
      tips: [...study.tips.slice(0, 2), ch.tip],
      details: [{ label: '집중에 도움이 되는 환경', text: `${info.env}에서 집중이 잘 되는 기질이에요. ${study.d[0]}` }, { label: '주의할 습관', text: study.d[1] }],
    },
  };
}
