import { STEM, BRANCH, EL_KO, EL_HAN, SANHE, rel, tenGod } from './constants';
import type { Chart } from './chart';
import { pickPeople, pickStudy, type Pick } from './picks';
import type { Element, FortuneSection } from './types';

/**
 * 2027년 세운(歲運) 풀이: 2027년은 정미년(丁未). 일간 기준 올해 천간·지지의 십신, 명식 지지와의 충·합,
 * 오행 보완 여부를 규칙으로 읽는다. 사건이나 시기를 단정하지 않고 "흐름의 성향"으로만 쓴다.
 */
export const SEWOON_YEAR = 2027;
const YS = '丁', YB = '未';
type Group = '비겁' | '식상' | '재성' | '관성' | '인성';
const GROUP: Record<string, Group> = { 비견: '비겁', 겁재: '비겁', 식신: '식상', 상관: '식상', 편재: '재성', 정재: '재성', 편관: '관성', 정관: '관성', 편인: '인성', 정인: '인성' };
const iga = (w: string) => { const c = w.charCodeAt(w.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 === 0 ? '가' : '이'; };

const GOD_YEAR: Record<string, string> = {
  비견: '나의 방식과 독립심이 또렷해지고 동료와 대등하게 힘을 겨루거나 나누는 흐름',
  겁재: '경쟁과 나눔이 커져 지출이나 동업·공동 일의 기준을 분명히 할수록 좋은 흐름',
  식신: '여유 있게 표현하고 만들어 내는 힘이 살아나는 흐름',
  상관: '개성과 표현이 강해져 기존 규칙과 부딪히기 쉬우니 말의 온도를 살피면 좋은 흐름',
  편재: '활동 반경이 넓어지고 기회와 사람이 늘어 바쁘게 움직이는 흐름',
  정재: '꾸준한 수입과 살림을 안정적으로 다지는 흐름',
  편관: '책임과 압박이 커지면서 도전적인 역할을 맡기 쉬운 흐름',
  정관: '질서 안에서 역할과 평가가 분명해지고 성실함이 인정받기 쉬운 흐름',
  편인: '새로운 관심사와 독특한 아이디어가 늘고 생각이 깊어지는 흐름',
  정인: '도움과 배움, 안정이 따르며 기반을 다지기 좋은 흐름',
};
const THEME: Record<Group, { rel: string; work: string; study: string }> = {
  비겁: { rel: '친구·동료와 함께하는 일이 늘고 서로 자극을 주고받아요. 다만 비교하는 마음이 생기기 쉬우니 각자의 속도를 인정해 주세요.', work: '독립적으로 일하는 힘이 커지는 대신 경쟁이 늘 수 있어요. 협업할 때는 역할과 몫을 처음에 분명히 해 두세요.', study: '스터디나 모임처럼 함께 배울 때 동력이 생겨요.' },
  식상: { rel: '표현이 풍부해져 새로운 사람과도 어울리기 쉬워요. 농담이나 직설이 오해가 되지 않게 한 번 더 다듬어 보세요.', work: '아이디어를 내고 결과물을 드러내는 일에 기회가 있어요. 만든 것을 공개하는 데 용기를 내 보세요.', study: '배운 것을 글이나 발표로 내놓을 때 실력이 붙어요.' },
  재성: { rel: '활동 반경이 넓어져 사람과 기회가 함께 늘어요. 약속이 많아지니 체력과 일정을 관리해 주세요.', work: '수입과 성과를 챙기는 일이 부각돼요. 벌이가 늘 때 지출도 함께 늘기 쉬우니 한도를 정해 두세요.', study: '실제로 쓰임이 있는 공부나 자격을 쌓는 데 도움이 돼요.' },
  관성: { rel: '맡은 역할과 책임이 늘어 사람 사이의 예의와 거리감이 중요해요. 혼자 떠안지 말고 도움을 청해 보세요.', work: '평가와 역할이 분명해져 성실함이 인정받기 쉬워요. 부담이 클 땐 우선순위를 정리해 보세요.', study: '체계가 있는 과정이나 시험 준비에 규칙적인 일정이 힘이 돼요.' },
  인성: { rel: '조언해 주는 사람이나 멘토와 인연이 닿기 쉬워요. 도움을 받는 만큼 나도 나눌 거리를 찾아보세요.', work: '서둘러 성과를 내기보다 준비하고 기반을 다지기 좋은 해예요.', study: '공부·자격·독서에 힘이 실리는 해예요. 시작을 미루지 않는 것이 핵심이에요.' },
};
const POS = ['시지', '일지', '월지', '년지'];
const CHONG_TXT = [
  '자녀나 미래 계획에서 방향을 다시 잡게 될 수 있어요.',
  '나의 생활 리듬이나 가까운 관계에서 조율이 필요한 해예요.',
  '일터와 역할에 변화나 이동이 생길 수 있으니 큰 결정은 한 번 더 점검해 보세요.',
  '바깥 환경이나 집안일에서 변화가 생기기 쉬워요.',
];
const HE_TXT = [
  '자녀나 후배와의 관계가 가까워질 수 있어요.',
  '가까운 관계가 부드러워지고 인연의 문이 열리기 쉬워요.',
  '일터에서 사람들과 호흡이 맞기 쉬워요.',
  '주변 환경과 조화를 이루기 쉬워요.',
];
const STEM_HE: Record<string, string> = { 甲: '己', 己: '甲', 乙: '庚', 庚: '乙', 丙: '辛', 辛: '丙', 丁: '壬', 壬: '丁', 戊: '癸', 癸: '戊' };
const STEM_CHONG: Record<string, string> = { 甲: '庚', 庚: '甲', 乙: '辛', 辛: '乙', 丙: '壬', 壬: '丙', 丁: '癸', 癸: '丁' };

export function sewoon(chart: Chart): FortuneSection {
  const day = chart.dayStem, ds = STEM[day];
  const gS = tenGod(day, YS), gB = tenGod(day, BRANCH[YB][3]);
  const grp = GROUP[gS], grpB = GROUP[gB];
  const th = THEME[grp];

  // 명식 지지와의 충·합
  const bs = chart.pillars.map(p => (p.unknown ? null : p.branch));
  const rels: string[] = [];
  bs.forEach((b, i) => {
    if (!b) return;
    const r = rel(YB, b);
    if (r === 'chong') rels.push(`올해 지지 未가 ${POS[i]}(${b})와 충(沖)을 이뤄 ${CHONG_TXT[i]}`);
    else if (r === 'liuhe') rels.push(`올해 지지 未가 ${POS[i]}(${b})와 육합(合)을 이뤄 ${HE_TXT[i]}`);
  });
  const sh = SANHE.find(([c]) => c.includes(YB))!; // 亥卯未
  const have = [...sh[0]].filter(c => c !== YB && bs.includes(c));
  if (have.length === 2) rels.push(`올해 未가 명식의 ${have.join('·')}와 ${sh[0]} 삼합을 이뤄 ${EL_KO[sh[1]]}(${EL_HAN[sh[1]]}) 기운이 크게 힘을 얻는 해예요.`);
  else if (have.length === 1) rels.push(`올해 未가 명식의 ${have[0]}와 반합을 이뤄 ${EL_KO[sh[1]]}(${EL_HAN[sh[1]]}) 기운이 살아나기 쉬워요.`);
  let stemRel = '';
  if (STEM_HE[day] === YS) stemRel = `일간 ${day}(${ds[0]}${EL_KO[ds[1]]})과 올해 천간 ${YS}이 합(合)을 이뤄 사람·환경과 어우러지려는 힘이 커져요.`;
  else if (STEM_CHONG[day] === YS) stemRel = `일간 ${day}(${ds[0]}${EL_KO[ds[1]]})과 올해 천간 ${YS}이 충(沖)을 이뤄 생각과 환경이 부딪히기 쉬우니 서두르지 않는 것이 좋아요.`;

  // 올해 들어오는 오행(丁 화, 未 토)이 명식에서 부족한지
  const incoming: Element[] = ['fire', 'earth'];
  const lacking = incoming.filter(e => chart.elements[e] === 0);
  const fewer = incoming.filter(e => chart.elements[e] === 1);
  const elemSent = lacking.length
    ? `명식에 ${lacking.map(e => `${EL_KO[e]}(${EL_HAN[e]})`).join('·')} 기운이 없는데 올해 정미년이 ${lacking.length === 2 ? '화(火)·토(土)' : EL_KO[lacking[0]] + '(' + EL_HAN[lacking[0]] + ')'} 기운을 채워 주어 평소 약하던 면이 보완되기 쉬운 해예요.`
    : fewer.length
      ? `올해 정미년이 화(火)·토(土) 기운을 더해 명식에서 적었던 ${fewer.map(e => EL_KO[e]).join('·')} 기운에 힘이 실려요.`
      : chart.elements.fire + chart.elements.earth >= 5
        ? '명식에 화(火)·토(土) 기운이 이미 많은데 올해 정미년이 더 얹히니 한쪽으로 쏠리지 않게 쉬어 가는 시간도 챙기세요.'
        : '올해 정미년은 화(火)·토(土) 기운의 해로, 명식의 균형 위에 무리 없이 얹히는 편이에요.';

  const body = [
    `2027년은 정미년(丁未年)이에요. 일간 ${day}(${ds[0]}${EL_KO[ds[1]]}) 기준으로 올해의 천간 ${YS}은 ${gS}, 지지 未의 속 기운은 ${gB}이에요.`,
    `${gS}${iga(gS)} 드러나는 올해는 ${GOD_YEAR[gS]}이에요. ${th.rel}`,
    `지지의 ${gB}${grpB === grp ? '도 같은 방향이라 이 기운이 더 뚜렷해져요.' : `은 ${GOD_YEAR[gB]}을 더해 줘요.`}`,
    ...rels.slice(0, 2),
    ...(stemRel ? [stemRel] : []),
    elemSent,
    '운의 해는 양력 1월 1일이 아니라 입춘(2월 4일 전후)부터 바뀌어요. 이 풀이는 사건이나 시기를 맞히는 것이 아니라 올해의 흐름 성향을 참고하는 용도예요.',
  ];

  const people = pickPeople(chart)[0], study = pickStudy(chart)[0];
  const tips = [
    `${people.title}: ${people.text}`,
    `${study.title}: ${study.text}`,
    `올해 흐름(${gS})에 맞춰 ${grp === '비겁' ? '협업 규칙을 먼저 정해 보세요' : grp === '식상' ? '만든 것을 한 번 공개해 보세요' : grp === '재성' ? '지출 한도를 먼저 정해 보세요' : grp === '관성' ? '떠안은 일을 나눠 보세요' : '배움의 시작일을 달력에 적어 보세요'}.`,
  ];
  if (rels.some(r => r.includes('충'))) tips.push('충이 있는 영역은 변화를 두려워하기보다 큰 결정 전에 한 번 더 점검하는 습관으로 대비해 보세요.');

  return {
    id: 'sewoon', type: 'fortune', title: '2027년 나의 운세', icon: '歲',
    summary: `올해는 ${GOD_YEAR[gS]}이에요.`,
    body, tips,
    details: [
      { label: '올해의 인간관계', text: th.rel },
      { label: '일과 재물', text: th.work },
      { label: '공부와 배움', text: th.study },
      { label: '올해 마음가짐', text: rels.length ? '충이나 합이 있는 영역은 변화의 신호로 읽고, 서두르지 않고 한 걸음씩 확인하며 가면 좋아요.' : '큰 부딪힘 없이 흐르는 해라 계획해 둔 일을 꾸준히 이어 가기 좋아요.' },
    ],
  };
}

const EL_ACT: Record<Element, string> = {
  wood: '산책하거나 식물을 가꾸고, 새로운 일을 하나 시작해 보기',
  fire: '햇볕을 쬐며 몸을 움직이고, 마음을 표현하는 활동 해 보기',
  earth: '규칙적인 생활 리듬을 만들고 주변을 정리정돈하기',
  metal: '미루던 일을 정리하고 결정을 내려 마무리하는 연습하기',
  water: '충분히 쉬고 물을 자주 마시며, 독서와 사색 시간 갖기',
};
export function supplement(chart: Chart): { lead: string; items: Pick[] } {
  const els = chart.elements, ks = Object.keys(els) as Element[], min = Math.min(...ks.map(k => els[k]));
  const low = ks.filter(k => els[k] === min && min <= 1);
  const lead = low.length
    ? `${low.map(k => `${EL_KO[k]}(${EL_HAN[k]})`).join('·')} 기운이 ${min === 0 ? '비어 있어요' : '적어요'}. 부족한 부분을 보완하려면 아래를 추가로 해 보면 도움이 돼요.`
    : '오행이 고르게 갖춰져 있어요. 균형을 유지하고 시야를 넓히려면 아래를 해 보면 도움이 돼요.';
  return { lead, items: [...low.map(k => ({ title: `${EL_KO[k]}(${EL_HAN[k]}) 기운 채우기`, text: EL_ACT[k] })), ...pickPeople(chart), ...pickStudy(chart)] };
}
