import type { Chart } from './chart';
import { analyzeGods } from './ruleInterpret';

export interface Pick { title: string; text: string }

/** 명식에서 결정적으로 뽑는 값: 같은 사주는 항상 같은 표현, 다른 사주는 다른 표현이 나오도록 쓴다. */
const seedOf = (chart: Chart) => [...(chart.gz.year + chart.gz.month + chart.gz.day + (chart.gz.time ?? ''))].reduce((a, c) => a + c.charCodeAt(0), 0);

const STUDY: Record<string, [string, string]> = {
  long: ['1년 이상 공부하기', '짧게 끝내지 말고 1년 이상 붙들 공부 주제를 하나 정해 보세요. 길게 가는 힘이 쌓일수록 실력이 눈에 띄게 달라져요.'],
  daily: ['삶에 공부를 꾸준히 하기', '하루 20분이라도 공부 시간을 생활 속에 고정해 보세요. 공부가 특별한 일이 아니라 일상의 습관이 되면 흔들림이 줄어요.'],
  together: ['함께 공부하기', '스터디나 독서 모임처럼 함께 배우면 포기하기 어려워지고, 서로의 질문에서 배우는 것도 많아져요.'],
  deep: ['새 학문 깊게 파보기', '평소 접하지 않던 학문 하나를 골라 입문서에서 멈추지 말고 한 권, 한 과정을 끝까지 파고들어 보세요. 시야가 크게 넓어져요.'],
};
const STUDY_ALT: Record<string, string> = {
  long: '한두 달로 끝내지 않고 1년 이상 이어 갈 공부를 정해 두면, 중간에 지치는 시기를 지나고 나서 눈에 띄는 변화가 와요.',
  daily: '출퇴근길이나 잠들기 전처럼 정해진 자리에 공부를 끼워 넣어 보세요. 공부가 삶의 리듬이 되면 오래 갈 수 있어요.',
  together: '배운 것을 나누고 질문을 주고받을 공부 친구를 찾아보세요. 설명해 보는 과정에서 이해가 더 깊어져요.',
  deep: '낯선 분야를 맛만 보지 말고 깊이 들어가 보세요. 한 분야를 깊게 파 본 경험이 다른 공부의 바탕이 돼요.',
};
const PEOPLE: Record<string, [string, string]> = {
  meet: ['새로운 사람 만나기', '모임·동호회·소개 자리 등 새로운 사람을 만날 기회를 한 달에 한 번이라도 만들어 보세요. 익숙한 테두리 밖에서 새 기운이 들어와요.'],
  open: ['사람들에게 마음을 더 열기', '먼저 안부를 묻고 속마음을 조금 더 나눠 보세요. 마음을 열수록 관계가 깊어지고 도움도 받기 쉬워져요.'],
};
const PEOPLE_ALT: Record<string, string> = {
  meet: '평소 가지 않던 곳에서 새로운 사람과 이야기해 보세요. 뜻밖의 대화가 인연이나 도움으로 이어질 수 있어요.',
  open: '내 이야기를 먼저 꺼내고 상대의 이야기를 끝까지 들어 보세요. 열린 태도가 관계의 문을 넓혀 줘요.',
};

/** 공부: 인성이 많으면 깊이·함께, 적으면 꾸준함·긴 호흡, 보통이면 사주마다 돌려 가며 2개를 고른다. */
export function pickStudy(chart: Chart): Pick[] {
  const a = analyzeGods(chart), seed = seedOf(chart), alt = seed % 2 === 1;
  const keys = a.counts.인성 >= 3 ? ['deep', 'together'] : a.counts.인성 <= 1 ? ['daily', 'long'] : [['long', 'together'], ['daily', 'deep'], ['together', 'daily'], ['deep', 'long']][seed % 4];
  return keys.map(k => ({ title: STUDY[k][0], text: alt ? STUDY_ALT[k] : STUDY[k][1] }));
}

/** 사람: 일간이 강하면 마음 열기, 약하면 새로운 사람 만나기(도움 받을 인연), 균형이면 둘 다. */
export function pickPeople(chart: Chart): Pick[] {
  const a = analyzeGods(chart), alt = (seedOf(chart) >> 1) % 2 === 1;
  const keys = a.strength === 'strong' ? ['open'] : a.strength === 'weak' ? ['meet'] : ['meet', 'open'];
  return keys.map(k => ({ title: PEOPLE[k][0], text: alt ? PEOPLE_ALT[k] : PEOPLE[k][1] }));
}
