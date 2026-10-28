import { BRANCH, EL_KO, EL_HAN, ORDER, ZODIAC, animal, rel, sanheOf } from './constants';
import type { MatchRank, YearRank } from './types';

/** 띠 궁합(규칙 기반): 년지 기준 육합 1위, 삼합 2·3위 */
export function baseMatches(my: string): { ranks: MatchRank[]; summary: string } {
  const liu = ORDER.find(b => rel(my, b) === 'liuhe')!;
  const g = sanheOf(my), sanhe = g[0].split('').filter(b => b !== my);
  const myA = animal(my), elKo = EL_KO[g[1]];
  const ranks: MatchRank[] = [
    { rank: 1, animal: BRANCH[liu][2], keywords: ['편안함', '보완'], relation: '연애 · 친구', reason: `${myA}띠(${my})와 ${animal(liu)}띠(${liu})는 서로 끌어당기는 육합(六合) 관계예요. 성향이 달라도 부족한 부분을 자연스럽게 채워 주어, 가까운 사이일수록 편안함을 느끼기 쉬워요.` },
    { rank: 2, animal: BRANCH[sanhe[0]][2], keywords: ['추진력', '신뢰'], relation: '협업 · 친구', reason: `${g[0]} 삼합(三合)으로 같은 ${elKo}(${EL_HAN[g[1]]}) 기운 아래 모이는 관계예요. 목표가 같을 때 손발이 잘 맞아, 함께 일을 시작하고 밀고 나가기 좋아요.` },
    { rank: 3, animal: BRANCH[sanhe[1]][2], keywords: ['공감', '꾸준함'], relation: '협업 · 연애', reason: `같은 ${g[0]} 삼합 안에서 서로의 속도를 맞춰 주는 짝이에요. 큰 목표를 오래 함께 끌고 갈 때 든든한 힘이 되어 줄 수 있어요.` },
  ];
  return { ranks, summary: `${myA}띠에게는 ${ranks.map(r => ZODIAC[r.animal].name + '띠').join('·')}가 잘 어울려요.` };
}

/** 2027 정미년(未)과의 합충 점수 + 내 띠와의 합충 점수로 정렬 */
export function yearMatches(my: string): { ranks: YearRank[]; summary: string; criteria: string } {
  const Y = '未';
  const ACT = { wood: '함께 공부하기', fire: '프로젝트 진행하기', earth: '서로의 생활 습관 돕기', metal: '계획 세우고 정리하기', water: '대화하며 아이디어 나누기' } as const;
  const CAU = { wood: '계획만 세우고 끝나지 않도록 주 1회 진도를 함께 확인해 보세요.', fire: '둘 다 속도가 빨라질 수 있으니 역할과 마감을 처음에 분명히 나눠 주세요.', earth: '도움이 간섭처럼 느껴지지 않도록 서로 원하는 범위를 먼저 정해 두세요.', metal: '기준이 엄격해지지 않도록 칭찬과 피드백을 함께 건네 주세요.', water: '이야기가 길어지면 실행이 늦어질 수 있으니 하나씩 정해서 움직여 보세요.' } as const;
  const sY = { liuhe: 3, sanhe: 2, same: 1, chong: -5, none: 0 }, sM = { liuhe: 2, sanhe: 2, same: 0, chong: -4, none: 0 };
  const scored = ORDER.map((b, i) => ({ b, i, ry: rel(b, Y), rm: rel(b, my), s: sY[rel(b, Y)] + sM[rel(b, my)] })).sort((a, c) => c.s - a.s || a.i - c.i).slice(0, 3);
  const ranks = scored.map((x, k): YearRank => {
    const el = BRANCH[x.b][1], parts: string[] = [];
    if (x.ry === 'liuhe') parts.push('2027년의 未와 육합을 이루어 한 해의 기운을 부드럽게 받쳐 줘요.');
    else if (x.ry === 'sanhe') parts.push('2027년의 未와 亥卯未 삼합으로 이어져 한 해 동안 함께 쌓아 가기 좋아요.');
    else if (x.ry === 'same') parts.push('2027년과 같은 未 기운이라 한 해의 흐름에 자연스럽게 올라타요.');
    if (x.rm === 'liuhe' || x.rm === 'sanhe') parts.push('내 띠와도 합을 이뤄 호흡이 잘 맞아요.');
    if (!parts.length) parts.push('2027년과 내 띠 모두와 부딪힘이 없어 무난하게 힘을 모을 수 있어요.');
    return { rank: k + 1, animal: BRANCH[x.b][2], activity: ACT[el], expect: parts.join(' '), caution: CAU[el] };
  });
  const chongMine = ORDER.find(b => rel(b, my) === 'chong')!;
  return {
    ranks,
    summary: `2027년 정미년(丁未年)에는 ${ranks.map(r => ZODIAC[r.animal].name + '띠').join('·')}와 함께할 때 흐름이 순해져요.`,
    criteria: `2027년 정미년의 지지 未와 각 띠가 이루는 합(合)·충(沖)을 먼저 보고, 내 띠(${animal(my)}띠)와의 관계를 더해 순위를 정했어요. 未와 충이 되는 소띠(丑)와 내 띠와 충이 되는 ${animal(chongMine)}띠(${chongMine})는 순위에서 뒤로 밀려요. 기본 궁합(⑤)과 달리 2027년 한 해의 흐름만을 기준으로 한 해석이에요.`,
  };
}
