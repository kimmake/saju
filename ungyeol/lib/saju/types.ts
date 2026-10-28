export type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
export type DstChoice = 'dst' | 'std';

/** toInput() 결과 — analyze API 요청 계약 */
export interface SajuInput {
  name: string | null;
  calendar: 'solar' | 'lunar';
  isLeapMonth: boolean;
  birth: { year: number; month: number; day: number };
  time: { hour: number; minute: number } | null; // null = 시간 모름
  region: string;
  gender: 'female' | 'male' | null;
  dstChoice: DstChoice | null;
}

export interface Pillar {
  label: string;
  note: string;
  stem: string;
  stemKo: string;
  stemEl: Element | 'none';
  branch: string;
  branchKo: string;
  branchEl: Element | 'none';
  stemGod?: string;
  branchGod?: string;
  isDay?: boolean;
  unknown?: boolean;
}

export interface FortuneSection {
  id: string;
  type: 'fortune';
  title: string;
  icon: string;
  summary: string;
  body: string[];
  tips: string[];
  details: { label: string; text: string }[];
}
export interface MatchRank { rank: number; animal: string; keywords: string[]; relation: string; reason: string }
export interface MatchSection { id: 'match'; type: 'match'; title: string; icon: string; summary: string; ranks: MatchRank[]; notice: string; boundary: string }
export interface YearRank { rank: number; animal: string; activity: string; expect: string; caution: string }
export interface YearSection { id: 'year'; type: 'year'; title: string; icon: string; summary: string; criteria: string; ranks: YearRank[] }
export type Section = FortuneSection | MatchSection | YearSection;

export interface AnalyzeResult {
  meta: { isDemo: boolean; label: string; chartTag: string; note: string; interpFailed: boolean };
  identity: string;
  summary: string;
  keywords: string[];
  pillars: Pillar[];
  elements: Record<Element, number>;
  elementNote: string;
  chartNote: string;
  daeun: string | null;
  sections: Section[];
}
