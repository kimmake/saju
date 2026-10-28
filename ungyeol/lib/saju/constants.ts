import type { Element } from './types';

export const ZODIAC: Record<string, { name: string; hanja: string; tint: string }> = {
  rat: { name: '쥐', hanja: '子', tint: '#E6E2EF' }, ox: { name: '소', hanja: '丑', tint: '#EDE4D3' },
  tiger: { name: '호랑이', hanja: '寅', tint: '#F1E2CF' }, rabbit: { name: '토끼', hanja: '卯', tint: '#E3EADB' },
  dragon: { name: '용', hanja: '辰', tint: '#DDE6E6' }, snake: { name: '뱀', hanja: '巳', tint: '#EBDDDA' },
  horse: { name: '말', hanja: '午', tint: '#EFDCD2' }, goat: { name: '양', hanja: '未', tint: '#EEE6D6' },
  monkey: { name: '원숭이', hanja: '申', tint: '#E8E4DA' }, rooster: { name: '닭', hanja: '酉', tint: '#F0E5CC' },
  dog: { name: '개', hanja: '戌', tint: '#E9DFD2' }, pig: { name: '돼지', hanja: '亥', tint: '#E0E4EE' },
};
export const STEM: Record<string, [string, Element, number]> = {
  甲: ['갑', 'wood', 1], 乙: ['을', 'wood', 0], 丙: ['병', 'fire', 1], 丁: ['정', 'fire', 0], 戊: ['무', 'earth', 1],
  己: ['기', 'earth', 0], 庚: ['경', 'metal', 1], 辛: ['신', 'metal', 0], 壬: ['임', 'water', 1], 癸: ['계', 'water', 0],
};
export const BRANCH: Record<string, [string, Element, string, string]> = {
  子: ['자', 'water', 'rat', '癸'], 丑: ['축', 'earth', 'ox', '己'], 寅: ['인', 'wood', 'tiger', '甲'], 卯: ['묘', 'wood', 'rabbit', '乙'],
  辰: ['진', 'earth', 'dragon', '戊'], 巳: ['사', 'fire', 'snake', '丙'], 午: ['오', 'fire', 'horse', '丁'], 未: ['미', 'earth', 'goat', '己'],
  申: ['신', 'metal', 'monkey', '庚'], 酉: ['유', 'metal', 'rooster', '辛'], 戌: ['술', 'earth', 'dog', '戊'], 亥: ['해', 'water', 'pig', '壬'],
};
export const ORDER = '子丑寅卯辰巳午未申酉戌亥'.split('');
export const EL_KO: Record<Element, string> = { wood: '목', fire: '화', earth: '토', metal: '금', water: '수' };
export const EL_HAN: Record<Element, string> = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
export const GEN: Record<Element, Element> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
const CTRL: Record<Element, Element> = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };
const LIUHE = ['子丑', '寅亥', '卯戌', '辰酉', '巳申', '午未'];
export const SANHE: [string, Element][] = [['申子辰', 'water'], ['亥卯未', 'wood'], ['寅午戌', 'fire'], ['巳酉丑', 'metal']];
const CHONG = ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥'];

const pairIn = (list: string[], a: string, b: string) => list.some(p => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
export const sanheOf = (b: string) => SANHE.find(g => g[0].includes(b))!;
export type Rel = 'same' | 'liuhe' | 'chong' | 'sanhe' | 'none';
export function rel(a: string, b: string): Rel {
  if (a === b) return 'same';
  if (pairIn(LIUHE, a, b)) return 'liuhe';
  if (pairIn(CHONG, a, b)) return 'chong';
  const g = sanheOf(a);
  if (g && g[0].includes(b)) return 'sanhe';
  return 'none';
}
export const animal = (b: string) => ZODIAC[BRANCH[b][2]].name;

export function tenGod(day: string, stem: string): string {
  const d = STEM[day], o = STEM[stem], same = d[2] === o[2];
  if (d[1] === o[1]) return same ? '비견' : '겁재';
  if (GEN[d[1]] === o[1]) return same ? '식신' : '상관';
  if (CTRL[d[1]] === o[1]) return same ? '편재' : '정재';
  if (CTRL[o[1]] === d[1]) return same ? '편관' : '정관';
  return same ? '편인' : '정인';
}
