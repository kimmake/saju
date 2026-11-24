import { Solar } from 'lunar-javascript';
import KoreanLunarCalendar from 'korean-lunar-calendar';
import { STEM, BRANCH, EL_KO, EL_HAN, GEN, ORDER, ZODIAC, animal, rel, sanheOf, tenGod, type Rel } from './constants';
import { computeChart, type Chart } from './chart';
import { analyzeGods } from './ruleInterpret';
import type { Element, SajuInput } from './types';

/**
 * 오늘의 운세 (규칙 기반, 참고용)
 * - 오늘 = 한국 시간(Asia/Seoul) 달력 날짜. 그 날짜의 일주(日柱)를 일진으로 본다(자시 23시 기준은 적용하지 않음).
 * - 명식은 '나의 사주팔자'와 같은 computeChart()로 계산한다.
 * - 일간 기준 오늘 천간·지지(본기)의 십성, 명식 지지와의 합·충, 일간과의 천간합·충,
 *   analyzeGods()의 단순 강약(억부), 오행 분포에 대한 보완·과다를 규칙으로 더해 등급과 문장을 만든다.
 * - 같은 명식과 같은 날짜에는 항상 같은 결과가 나온다(난수 없음, 문장 변형은 명식+날짜 해시로 고른다).
 */

type Group = '비겁' | '식상' | '재성' | '관성' | '인성';
const GROUP: Record<string, Group> = { 비견: '비겁', 겁재: '비겁', 식신: '식상', 상관: '식상', 편재: '재성', 정재: '재성', 편관: '관성', 정관: '관성', 편인: '인성', 정인: '인성' };
const GROUP_LABEL: Record<Group, string> = { 비겁: '비겁(나와 같은 기운)', 식상: '식상(표현하는 기운)', 재성: '재성(재물·현실의 기운)', 관성: '관성(규율·책임의 기운)', 인성: '인성(배움·보호의 기운)' };
const STEM_HE: Record<string, string> = { 甲: '己', 己: '甲', 乙: '庚', 庚: '乙', 丙: '辛', 辛: '丙', 丁: '壬', 壬: '丁', 戊: '癸', 癸: '戊' };
const STEM_CHONG: Record<string, string> = { 甲: '庚', 庚: '甲', 乙: '辛', 辛: '乙', 丙: '壬', 壬: '丙', 丁: '癸', 癸: '丁' };
const CTRL: Record<Element, Element> = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };
const PARENT = (e: Element) => (Object.keys(GEN) as Element[]).find(k => GEN[k] === e)!;
const CTRLED_BY = (e: Element) => (Object.keys(CTRL) as Element[]).find(k => CTRL[k] === e)!;
const WEEK = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const POS = ['시지', '일지', '월지', '년지'];
const POS_MEAN = ['미래·자녀의 자리', '나와 가까운 관계의 자리', '일과 사회의 자리', '바깥 환경의 자리'];

export type CategoryId = 'love' | 'money' | 'work' | 'study' | 'health' | 'people';
export interface TodayCategory { id: CategoryId; title: string; han: string; score: number; grade: string; keyword: string; text: string; tip: string }
export interface TodayMatch { rank: number; animal: string; hanja: string; name: string; reason: string; advice: string }
export interface TodayResult {
  date: { ymd: string; label: string; weekday: string; lunar: string; ganzhi: string; ganzhiKo: string; stemEl: Element; branchEl: Element; animal: string; nextRefreshAt: string };
  basis: { dayPillar: string; dayPillarKo: string; strength: string; stemGod: string; branchGod: string; relations: string[]; luckyElement: string };
  total: { score: number; grade: string; headline: string; summary: string; flow: string[]; keywords: string[]; chance: string; caution: string; action: string; advice: string };
  categories: TodayCategory[];
  lucky: { element: Element; elementLabel: string; colors: { name: string; hex: string }[]; numbers: number[]; direction: string; time: { name: string; range: string }; item: string; action: string; note: string };
  matches: TodayMatch[];
  word: string;
  /** 입력 정보가 부족해 해석 범위가 줄어든 부분 */
  scope: string[];
  notes: string[];
}

// ── 날짜 ──
/** 한국 시간 기준 오늘(YYYY-MM-DD)과 다음 자정(UTC ISO) */
export function kstToday(now = new Date()): { ymd: string; nextRefreshAt: string } {
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const [y, m, d] = ymd.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1, 0, 0) - 9 * 3600000); // KST 자정 = UTC 15:00 전날
  return { ymd, nextRefreshAt: next.toISOString() };
}

// ── 결정적 해시 ──
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const pick = <T>(arr: T[], seed: number, salt: number) => arr[(hash(`${seed}:${salt}`)) % arr.length];
const elLabel = (e: Element) => `${EL_KO[e]}(${EL_HAN[e]})`;
const batchim = (w: string) => { const c = w.charCodeAt(w.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0; };
/** 한자 뒤 조사는 한글 독음으로 정한다 (예: 子→'자'+가, 甲→'갑'+이). */
const ko = (h: string) => [...h].map(c => STEM[c]?.[0] ?? BRANCH[c]?.[0] ?? c).join('');
const P = (h: string, a: string, b: string) => (batchim(ko(h)) ? a : b);

// ── 문장 재료 ──
const GOD_DAY: Record<string, string> = {
  비견: '내 생각과 주관이 또렷해지는 날', 겁재: '경쟁심과 추진력이 함께 커지는 날', 식신: '여유 있게 표현하고 만들어 내는 힘이 살아나는 날',
  상관: '재치와 표현력이 날카로워지는 날', 편재: '활동 반경이 넓어지고 기회가 늘어나는 날', 정재: '차근차근 실속을 챙기기 좋은 날',
  편관: '긴장감 속에서 책임과 결단이 요구되는 날', 정관: '질서와 원칙 안에서 신뢰를 쌓기 좋은 날', 편인: '직관과 새로운 생각이 떠오르기 쉬운 날', 정인: '배움과 도움이 가까이 있는 날',
};
const GOD_CAUTION: Record<string, string> = {
  비견: '고집이 세지기 쉬우니 다른 의견도 끝까지 들어 보세요.',
  겁재: '경쟁심에 지출이나 무리한 약속이 늘 수 있어요. 함께 쓰는 돈은 기준을 먼저 정하세요.',
  식신: '편안함에 기대 할 일을 미루기 쉬워요. 오늘 끝낼 일 하나는 정해 두세요.',
  상관: '말이 앞서 오해를 사기 쉬워요. 비판은 부드럽게, 칭찬은 분명하게 해 보세요.',
  편재: '일을 넓게 벌이기 쉬우니 우선순위를 정해 마무리까지 챙기세요.',
  정재: '지나치게 계산하느라 기회를 놓칠 수 있어요. 작은 손해에 너무 마음 쓰지 마세요.',
  편관: '압박감에 쫓기듯 결정하기 쉬워요. 급한 일일수록 한 번 더 확인하세요.',
  정관: '체면과 규칙에 매여 마음이 경직되기 쉬워요. 완벽보다 완료를 목표로 하세요.',
  편인: '생각이 많아져 실행이 늦어지기 쉬워요. 떠오른 아이디어는 바로 적어 두세요.',
  정인: '도움에 기대다 보면 결정이 늦어질 수 있어요. 마지막 선택은 스스로 하세요.',
};
const GOD_ACTION: Record<string, string> = {
  비견: '혼자 힘으로 끝낼 수 있는 일을 하나 정해 마무리해 보세요.',
  겁재: '운동이나 목표 달성처럼 승부욕을 건강하게 쓸 곳을 찾아보세요.',
  식신: '맛있는 식사나 취미처럼 나를 즐겁게 하는 일에 시간을 내 보세요.',
  상관: '생각을 글이나 결과물로 표현해 보세요. 평소보다 반응이 좋을 수 있어요.',
  편재: '새로운 사람이나 장소를 한 곳 찾아가 보세요.',
  정재: '가계부나 업무 목록을 정리하며 실속을 챙겨 보세요.',
  편관: '미뤄 둔 어려운 일을 하나 골라 정면으로 처리해 보세요.',
  정관: '약속과 마감을 지키는 데 집중해 신뢰를 쌓아 보세요.',
  편인: '새로운 분야의 글이나 강의를 하나 찾아보세요.',
  정인: '책을 읽거나 조언을 구하며 배움의 시간을 가져 보세요.',
};
// 하루를 대표하는 한 문장 (십성 × 흐름 낮음·보통·높음)
const HEADLINE: Record<string, [string, string, string]> = {
  비견: ['한 걸음 물러서 나를 지키는 날', '내 속도로 단단히 걷는 날', '스스로 정한 길에 힘이 실리는 날'],
  겁재: ['경쟁보다 나눔이 이로운 날', '함께 달리며 힘을 얻는 날', '도전에 추진력이 붙는 날'],
  식신: ['미룬 일 하나만 끝내도 충분한 날', '즐거움 속에서 힘이 나는 날', '손끝에서 좋은 것이 피어나는 날'],
  상관: ['말의 온도를 살피는 날', '재치가 분위기를 밝히는 날', '생각을 드러내면 길이 열리는 날'],
  편재: ['넓히기보다 다지는 날', '작은 변화가 기회를 부르는 날', '움직인 만큼 기회가 오는 날'],
  정재: ['지키는 것이 버는 것인 날', '차근차근 실속을 쌓는 날', '성실함이 실속으로 돌아오는 날'],
  편관: ['서두르지 않아야 길한 날', '긴장 속에서 결단이 빛나는 날', '어려운 일을 넘어서는 날'],
  정관: ['완벽보다 완료를 택하는 날', '질서 속에서 차분히 쌓는 날', '원칙이 신뢰로 돌아오는 날'],
  편인: ['생각을 행동으로 옮겨 보는 날', '새로운 생각이 스치는 날', '직관이 길을 밝히는 날'],
  정인: ['쉬어 가며 채우는 날', '배움이 가까이 있는 날', '좋은 도움이 닿는 날'],
};
const GOD_CHANCE: Record<string, string> = {
  비견: '오랜 동료나 친구와 힘을 합치면 혼자서는 어려웠던 일이 풀릴 수 있어요.',
  겁재: '경쟁이 붙은 자리에서 평소보다 큰 힘을 낼 수 있어요. 목표를 분명히 세워 두세요.',
  식신: '취미나 손재주가 뜻밖의 칭찬이나 제안으로 이어질 수 있어요.',
  상관: '회의나 대화에서 꺼낸 아이디어가 눈에 띌 수 있어요.',
  편재: '새로운 사람이나 낯선 장소에서 생각지 못한 기회를 만날 수 있어요.',
  정재: '꼼꼼히 챙긴 일이 신뢰와 실속으로 돌아올 수 있어요.',
  편관: '부담스러웠던 역할이 오히려 실력을 보여 줄 기회가 될 수 있어요.',
  정관: '약속과 원칙을 지킨 모습이 주변의 신뢰로 이어질 수 있어요.',
  편인: '새로운 분야의 글이나 대화에서 좋은 영감을 얻을 수 있어요.',
  정인: '조언을 구하면 생각보다 좋은 도움을 받을 수 있어요.',
};
const DAILY_ADVICE: Record<Group, string> = {
  비겁: '하루 일과 중 나만을 위한 20분을 따로 떼어 두세요.',
  식상: '오늘 좋았던 일 한 가지를 짧게 적거나 누군가에게 이야기해 보세요.',
  재성: '지갑과 일정표를 한 번씩 정리하며 하루를 시작해 보세요.',
  관성: '할 일 목록에서 가장 중요한 하나에 먼저 표시해 두세요.',
  인성: '잠들기 전 10분, 책 몇 쪽을 읽거나 하루를 돌아보세요.',
};
const CAT_KEY: Record<CategoryId, Record<Group, string>> = {
  love: { 비겁: '대등한 관계', 식상: '다정한 표현', 재성: '함께하는 시간', 관성: '믿음과 예의', 인성: '경청과 배려' },
  money: { 비겁: '나눔의 기준', 식상: '재능의 실속', 재성: '정산과 기록', 관성: '정해진 지출', 인성: '배움에 쓰는 돈' },
  work: { 비겁: '주도적 추진', 식상: '아이디어', 재성: '성과 정리', 관성: '역할과 평가', 인성: '준비와 계획' },
  study: { 비겁: '혼자 몰입', 식상: '설명하며 익히기', 재성: '실전 문제', 관성: '계획과 마감', 인성: '깊은 이해' },
  health: { 비겁: '쉬는 시간', 식상: '가벼운 움직임', 재성: '끼니 챙기기', 관성: '긴장 풀기', 인성: '충분한 잠' },
  people: { 비겁: '동료와 협력', 식상: '즐거운 대화', 재성: '실속 있는 만남', 관성: '예의와 신뢰', 인성: '조언과 도움' },
};
const GROUP_KEY: Record<Group, string> = { 비겁: '주관', 식상: '표현', 재성: '실속', 관성: '책임', 인성: '배움' };
const GOD_KEY: Record<string, string> = { 비견: '자립', 겁재: '추진', 식신: '여유', 상관: '재치', 편재: '기회', 정재: '성실', 편관: '결단', 정관: '신뢰', 편인: '직관', 정인: '도움' };
const EL_KEY: Record<Element, string> = { wood: '새 출발', fire: '활기', earth: '안정', metal: '정리', water: '차분함' };

const CAT_META: Record<CategoryId, { title: string; han: string }> = {
  love: { title: '애정운', han: '愛' }, money: { title: '금전운', han: '財' }, work: { title: '직장운', han: '職' },
  study: { title: '학업운', han: '學' }, health: { title: '건강운', han: '康' }, people: { title: '대인관계운', han: '人' },
};
const CAT_BASE: Record<CategoryId, Record<Group, string>> = {
  love: {
    비겁: '나와 비슷한 결의 사람에게 마음이 가기 쉬운 날이에요. 다만 서로 고집을 세우면 대화가 평행선을 달릴 수 있어요.',
    식상: '마음을 표현하기 좋은 날이에요. 다정한 말 한마디나 작은 표현이 관계의 온도를 올려 줘요.',
    재성: '함께하는 시간과 현실적인 배려가 관계를 이어 주는 날이에요. 약속을 구체적으로 정하면 마음이 더 잘 전해져요.',
    관성: '관계에서 책임감과 예의가 돋보이는 날이에요. 진지한 태도가 신뢰를 주지만 너무 무겁지 않게 웃음도 곁들여 보세요.',
    인성: '상대의 이야기를 듣고 보살피는 마음이 커지는 날이에요. 조용한 대화가 관계를 깊게 해 줘요.',
  },
  money: {
    비겁: '주변과 나누거나 함께 쓰는 지출이 생기기 쉬운 날이에요. 기분에 따른 지출보다 미리 정한 범위 안에서 쓰는 게 좋아요.',
    식상: '아이디어나 재능이 실속으로 이어지기 쉬운 날이에요. 내가 잘하는 일에 시간을 쓰는 것이 곧 재물 관리예요.',
    재성: '돈의 흐름이 눈에 잘 들어오는 날이에요. 미뤄 둔 정산이나 가계부 정리를 하기에 좋아요.',
    관성: '정해진 지출과 의무를 챙기는 날이에요. 공과금이나 납부일 같은 기본을 먼저 확인해 두면 마음이 편해요.',
    인성: '당장의 이익보다 배움과 준비에 쓰는 돈이 가치 있는 날이에요. 큰 결정은 정보를 더 모은 뒤로 미뤄 보세요.',
  },
  work: {
    비겁: '내 방식대로 밀고 나가는 힘이 생기는 날이에요. 동료와 역할이 겹치지 않도록 먼저 선을 그어 두면 좋아요.',
    식상: '의견을 내고 결과물을 보여 주기 좋은 날이에요. 다만 윗사람이나 규칙과 부딪히지 않게 말의 온도를 살펴 보세요.',
    재성: '실무를 정리하고 성과를 챙기기 좋은 날이에요. 할 일을 숫자와 마감으로 정리하면 속도가 붙어요.',
    관성: '맡은 역할과 평가가 분명해지는 날이에요. 성실하게 처리한 일이 눈에 띄기 쉬워요.',
    인성: '배우고 준비하는 일에 힘이 실리는 날이에요. 자료를 찾고 계획을 다듬는 작업이 잘 풀려요.',
  },
  study: {
    비겁: '혼자 몰입하는 힘이 좋은 날이에요. 남과 비교하기보다 어제의 나와 비교해 보세요.',
    식상: '배운 것을 말이나 글로 풀어낼 때 이해가 깊어지는 날이에요. 요약 노트나 설명하기 공부가 잘 맞아요.',
    재성: '문제 풀이처럼 결과가 바로 보이는 실용적인 공부가 잘 맞는 날이에요. 이론을 길게 붙잡기보다 적용해 보세요.',
    관성: '계획표와 마감이 있는 공부가 힘을 받는 날이에요. 시험 준비처럼 틀이 정해진 공부에 유리해요.',
    인성: '집중과 이해가 잘 되는 날이에요. 어려워서 미뤄 둔 개념이나 고전 읽기에 도전해 보세요.',
  },
  health: {
    비겁: '활동량이 늘기 쉬운 날이에요. 무리해서 버티기보다 중간중간 쉬는 시간을 정해 두세요.',
    식상: '움직이고 표현하며 기운을 푸는 날이에요. 가벼운 산책이나 스트레칭이 기분 전환에 도움이 돼요.',
    재성: '일정이 많아져 식사와 잠을 놓치기 쉬운 날이에요. 끼니와 물 마시는 시간을 먼저 챙겨 보세요.',
    관성: '긴장과 책임감이 쌓이기 쉬운 날이에요. 어깨에 힘을 빼고 깊게 숨 쉬는 시간을 가져 보세요.',
    인성: '쉬어 가며 기운을 채우기 좋은 날이에요. 일찍 잠자리에 드는 것만으로도 컨디션이 달라져요.',
  },
  people: {
    비겁: '친구나 동료와 어울리는 일이 늘어나는 날이에요. 함께하되 비교하는 마음은 내려놓으면 좋아요.',
    식상: '대화가 즐겁게 풀리는 날이에요. 농담이 오해가 되지 않도록 상대의 반응을 살펴 주세요.',
    재성: '실속 있는 만남이 생기기 쉬운 날이에요. 필요한 부탁이나 제안은 구체적으로 건네 보세요.',
    관성: '윗사람이나 공적인 관계에서 예의가 중요한 날이에요. 약속 시간과 말의 격식을 챙기면 신뢰가 쌓여요.',
    인성: '조언을 구하거나 도움을 받기 좋은 날이에요. 고마운 사람에게 안부를 전해 보세요.',
  },
};
type Lvl = 0 | 1 | 2; // 0 낮음(1–2), 1 보통(3), 2 높음(4–5)
const CAT_LEVEL: Record<CategoryId, [string, string][]> = {
  love: [['전체적으로는 서운함이 커지기 쉬우니 결론을 서두르지 않는 것이 좋아요.', '중요한 이야기는 서로 차분할 때, 얼굴을 보고 나눠 보세요.'], ['전체적으로는 큰 굴곡 없이 편안한 흐름이에요.', '상대의 하루를 한 번 더 물어봐 주세요.'], ['전체적으로 마음을 표현하면 반가운 반응이 돌아오기 쉬운 흐름이에요.', '먼저 안부를 건네거나 작은 약속을 잡아 보세요.']],
  money: [['전체적으로는 충동적인 지출을 조심할 흐름이에요.', '사고 싶은 것은 장바구니에 하루 묵혀 두세요.'], ['전체적으로는 무난한 흐름이에요.', '오늘 쓴 돈을 한 줄로 기록해 보세요.'], ['전체적으로 작은 기회도 실속으로 이어지기 쉬운 흐름이에요.', '들어온 돈의 일부를 바로 저축 쪽으로 옮겨 두세요.']],
  work: [['전체적으로는 마찰이나 변수가 생기기 쉬우니 확인을 한 번 더 하세요.', '메일과 일정은 보내기 전에 다시 읽어 보세요.'], ['전체적으로는 평소의 리듬대로 처리하면 충분한 흐름이에요.', '오전에 가장 중요한 일 하나를 먼저 끝내 보세요.'], ['전체적으로 오늘의 노력이 좋은 평가로 이어지기 쉬운 흐름이에요.', '미뤄 둔 보고나 제안을 오늘 정리해 보세요.']],
  study: [['전체적으로는 집중이 흩어지기 쉬운 흐름이에요.', '목표를 작게 쪼개 하나씩 체크해 보세요.'], ['전체적으로는 꾸준히 이어 가기 좋은 흐름이에요.', '25분 집중하고 5분 쉬는 리듬을 만들어 보세요.'], ['전체적으로 이해와 암기가 잘 붙는 흐름이에요.', '어려운 단원을 오늘의 첫 공부로 배치해 보세요.']],
  health: [['전체적으로는 피로가 쌓이기 쉬우니 일정에 여유를 두세요.', '오늘은 잠자리에 드는 시간을 30분 앞당겨 보세요.'], ['전체적으로는 평소 생활 리듬을 지키면 충분한 흐름이에요.', '물을 자주 마시고 바른 자세를 챙겨 보세요.'], ['전체적으로는 몸과 마음의 리듬을 지키기 수월한 흐름이에요.', '가벼운 운동으로 좋은 컨디션을 이어 가 보세요.']],
  people: [['전체적으로는 말이 엇갈리기 쉬운 흐름이에요.', '단정 짓는 말 대신 질문으로 대화를 이어 보세요.'], ['전체적으로는 편안하게 어울리기 좋은 흐름이에요.', '상대의 이야기에 맞장구를 한 번 더 쳐 주세요.'], ['전체적으로 사람 사이에서 좋은 기운을 주고받는 흐름이에요.', '함께하고 싶은 사람에게 먼저 연락해 보세요.']],
};
const WORD: Record<Group, [string, string][]> = {
  비겁: [['이기려 하지 않아도 괜찮습니다. 오늘은 한 발 물러서는 여유가 나를 지켜 줍니다.', '고집을 잠시 내려놓으면 길이 보입니다. 오늘은 듣는 쪽이 이기는 날입니다.'],
    ['나다움을 지키되 문은 열어 두세요. 오늘은 단단함과 유연함이 함께 있을 때 빛납니다.', '비교하지 않아도 좋습니다. 오늘은 어제의 나보다 한 걸음이면 충분합니다.'],
    ['내 걸음에 확신을 가져도 좋은 날입니다. 오늘은 스스로 정한 길이 가장 든든한 길입니다.', '혼자서도 충분히 해낼 수 있는 날입니다. 다만 함께 걷는 사람의 속도도 한 번 돌아봐 주세요.']],
  식상: [['말이 앞서기 쉬운 날입니다. 한 번 고른 말이 하루를 편안하게 합니다.', '서두르지 않아도 좋습니다. 오늘은 생각을 다듬는 시간이 표현을 빛나게 합니다.'],
    ['즐거움이 곧 힘이 되는 날입니다. 오늘은 좋아하는 일에 조금 더 시간을 내어 주세요.', '말 한마디에 온기를 담아 보세요. 오늘은 부드러운 표현이 가장 멀리 갑니다.'],
    ['마음에 담아 둔 말을 꺼내기 좋은 날입니다. 오늘의 표현이 내일의 인연이 됩니다.', '손끝에서 좋은 것이 만들어지는 날입니다. 완벽하지 않아도 일단 내보여 보세요.']],
  재성: [['지키는 것도 버는 것입니다. 오늘은 쓰기 전에 한 번 더 생각하는 하루로 충분합니다.', '바쁘게 움직이기보다 정리할 때입니다. 오늘은 내 것을 살피는 날로 삼아 보세요.'],
    ['차근차근 챙기는 하루가 가장 큰 재산입니다. 오늘은 작은 정리부터 시작해 보세요.', '욕심보다 균형이 필요한 날입니다. 오늘은 꼭 필요한 것에 마음을 쓰세요.'],
    ['움직인 만큼 거두는 날입니다. 오늘의 작은 실속이 내일의 여유가 됩니다.', '기회는 가까이 있습니다. 오늘은 망설이던 일에 한 걸음 내디뎌 보세요.']],
  관성: [['모든 짐을 혼자 지지 않아도 됩니다. 오늘은 도움을 청하는 것도 용기입니다.', '서두르지 않아도 좋습니다. 오늘은 자신의 속도를 지키는 것이 가장 큰 행운입니다.'],
    ['원칙을 지키되 마음은 부드럽게 두세요. 오늘은 단정함이 가장 큰 힘입니다.', '해야 할 일을 하나씩 끝내 가는 날입니다. 오늘은 완벽보다 완료가 더 귀합니다.'],
    ['성실함이 빛을 보는 날입니다. 오늘 지킨 약속 하나가 큰 신뢰가 됩니다.', '책임을 피하지 않으면 길이 열립니다. 오늘은 맡은 자리에서 당당해도 좋습니다.']],
  인성: [['생각이 많을 땐 몸을 먼저 움직여 보세요. 오늘은 작은 실행이 마음을 가볍게 합니다.', '모든 답을 오늘 찾지 않아도 됩니다. 오늘은 질문을 품고 쉬어 가는 날입니다.'],
    ['천천히 채워 가는 날입니다. 오늘은 조용한 시간 속에서 생각이 깊어집니다.', '쉬어 가는 것도 준비입니다. 오늘 채운 기운이 내일의 걸음이 됩니다.'],
    ['배움이 손에 닿는 날입니다. 오늘 읽은 한 줄이 오래도록 나를 돕습니다.', '좋은 도움이 곁에 있는 날입니다. 오늘은 마음을 열고 조언에 귀 기울여 보세요.']],
};

// ── 행운 요소: 전통 오행 배속 ──
const LUCK: Record<Element, { colors: [string, string][]; numbers: number[]; direction: string; times: string[]; items: string[]; actions: string[] }> = {
  wood: { colors: [['청록', '#2F6B5E'], ['쑥색', '#6E7F4E'], ['옥색', '#8DB3A6']], numbers: [3, 8], direction: '동쪽', times: ['卯'],
    items: ['작은 화분', '나무로 된 소품', '초록색 노트', '종이책', '허브차'],
    actions: ['아침에 창문을 열고 바깥 공기를 마셔 보세요.', '새로 시작하고 싶던 일의 첫 단계를 적어 보세요.', '나무가 있는 길을 골라 걸어 보세요.', '식물에 물을 주거나 초록 잎을 가까이 두세요.'] },
  fire: { colors: [['다홍', '#B6463A'], ['주홍', '#C8643B'], ['연지', '#A8364B']], numbers: [2, 7], direction: '남쪽', times: ['巳', '午'],
    items: ['따뜻한 차 한 잔', '붉은 계열의 소품', '따뜻한 머플러', '밝은 스탠드 조명', '좋아하는 사진 한 장'],
    actions: ['햇볕을 쬐며 10분 정도 걸어 보세요.', '고마운 사람에게 칭찬이나 감사를 표현해 보세요.', '따뜻한 음료로 하루를 시작해 보세요.', '밝은 곳에서 미뤄 둔 일을 시작해 보세요.'] },
  earth: { colors: [['황토', '#B58A45'], ['치자', '#D9A93E'], ['갈색', '#8A6440']], numbers: [5, 10], direction: '중앙(머무는 자리 가까이)', times: ['辰', '未', '戌'],
    items: ['도자기 머그잔', '흙빛 가죽 소품', '정리용 파우치', '곡물로 만든 간식', '손으로 쓰는 플래너'],
    actions: ['책상이나 가방 속을 정리해 보세요.', '정해진 시간에 식사하며 하루 리듬을 지켜 보세요.', '오늘 할 일을 세 가지로 줄여 적어 보세요.', '가까운 사람과 차분히 차 한잔 나눠 보세요.'] },
  metal: { colors: [['백색', '#F2EEE4'], ['은회색', '#B9B6AE'], ['미색', '#E8DFC8']], numbers: [4, 9], direction: '서쪽', times: ['申', '酉'],
    items: ['금속 볼펜', '손목시계', '흰 손수건', '열쇠고리', '안경이나 선글라스'],
    actions: ['미뤄 둔 결정을 하나 내려 보세요.', '필요 없는 물건이나 파일을 하나 정리해 보세요.', '약속 시간보다 5분 먼저 도착해 보세요.', '오늘 지킬 기준 하나를 정하고 지켜 보세요.'] },
  water: { colors: [['먹색', '#2B2A28'], ['감색', '#1F3354'], ['쪽빛', '#2E4A7D']], numbers: [1, 6], direction: '북쪽', times: ['亥'],
    items: ['물병', '유리컵', '검은색 펜', '잔잔한 음악', '작은 일기장'],
    actions: ['물을 자주 마시며 호흡을 고르세요.', '잠들기 전 10분, 하루를 돌아보는 글을 적어 보세요.', '조용한 음악과 함께 생각을 정리해 보세요.', '큰 결정은 서두르지 말고 하루 묵혀 보세요.'] },
};
// 한국 관행(동경 127.5° 기준 30분 늦춤)의 십이시진
const SIJIN: Record<string, string> = { 子: '23:30–01:30', 丑: '01:30–03:30', 寅: '03:30–05:30', 卯: '05:30–07:30', 辰: '07:30–09:30', 巳: '09:30–11:30', 午: '11:30–13:30', 未: '13:30–15:30', 申: '15:30–17:30', 酉: '17:30–19:30', 戌: '19:30–21:30', 亥: '21:30–23:30' };
const MATCH_ADVICE: Record<Element, string> = {
  wood: '새로운 계획을 함께 세워 보면 대화가 잘 풀려요.', fire: '밝게 먼저 인사를 건네면 분위기가 금세 따뜻해져요.',
  earth: '약속을 꼼꼼히 지키는 모습이 믿음을 줘요.', metal: '용건을 분명히 하고 결론을 함께 정리해 보세요.', water: '상대의 이야기를 충분히 들어 주면 마음이 열려요.',
};
export const GRADE = ['', '쉼', '살핌', '무난', '좋음', '매우 좋음'];

const clamp = (x: number) => Math.max(1, Math.min(5, Math.round(x)));
const lvl = (s: number): Lvl => (s >= 4 ? 2 : s === 3 ? 1 : 0);

/** 날짜 표기: 양력·요일·한국 음력·일진 */
export function todayDate(ymd: string, nextRefreshAt = ''): TodayResult['date'] {
  const [Y, M, D] = ymd.split('-').map(Number);
  const gz: string = Solar.fromYmd(Y, M, D).getLunar().getDayInGanZhi();
  const kc = new KoreanLunarCalendar(); kc.setSolarDate(Y, M, D);
  const lc = kc.getLunarCalendar();
  return {
    ymd, label: `${Y}년 ${M}월 ${D}일`, weekday: WEEK[new Date(Date.UTC(Y, M - 1, D)).getUTCDay()], lunar: `음력 ${lc.intercalation ? '윤' : ''}${lc.month}월 ${lc.day}일`,
    ganzhi: gz, ganzhiKo: ko(gz), stemEl: STEM[gz[0]][1], branchEl: BRANCH[gz[1]][1], animal: ZODIAC[BRANCH[gz[1]][2]].name, nextRefreshAt,
  };
}

export function todayFortune(input: SajuInput, ymd: string, nextRefreshAt = ''): TodayResult {
  const chart: Chart = computeChart(input);
  const A = analyzeGods(chart);
  const [Y, M, D] = ymd.split('-').map(Number);
  const gz: string = Solar.fromYmd(Y, M, D).getLunar().getDayInGanZhi();
  const TS = gz[0], TB = gz[1];
  const day = chart.dayStem, dsInfo = STEM[day];
  const stemGod = tenGod(day, TS), branchGod = tenGod(day, BRANCH[TB][3]);
  const sG = GROUP[stemGod], bG = GROUP[branchGod];
  const tEls: Element[] = [STEM[TS][1], BRANCH[TB][1]];
  const seed = hash(`${chart.gz.year}${chart.gz.month}${chart.gz.day}${chart.gz.time ?? '-'}|${input.gender ?? '-'}|${ymd}`);

  // 십성 가중치: 천간 1, 지지 본기 0.6
  const g = (name: string) => (stemGod === name ? 1 : 0) + (branchGod === name ? 0.6 : 0);
  const grp = (G: Group) => (sG === G ? 1 : 0) + (bG === G ? 0.6 : 0);
  // 억부(단순화): 신강하면 식상·재성·관성, 신약하면 인성·비겁이 균형에 도움
  const favOf = (G: Group) => A.strength === 'strong' ? (G === '비겁' || G === '인성' ? -1 : 1) : A.strength === 'weak' ? (G === '비겁' || G === '인성' ? 1 : -1) : (G === '식상' || G === '재성' ? 0.5 : 0);
  const fav = favOf(sG) + 0.6 * favOf(bG);
  // 오행: 명식에 없는 오행이 들어오면 보완(+), 이미 3개 이상인 오행이 더해지면 과다(−)
  const elemBonus = tEls.reduce((a, e) => a + (chart.elements[e] === 0 ? 1 : chart.elements[e] >= 3 ? -1 : 0), 0) / 2;

  // 명식 지지와 오늘 지지의 관계
  const bs = chart.pillars.map(p => (p.unknown ? null : p.branch));
  const relAt = bs.map(b => (b ? rel(TB, b) : null)) as (Rel | null)[];
  const has = (i: number, r: Rel) => relAt[i] === r;
  const anyRel = (r: Rel) => relAt.some(x => x === r);
  const stemHe = STEM_HE[day] === TS, stemChong = STEM_CHONG[day] === TS;

  const relations: string[] = [];
  relAt.forEach((r, i) => {
    if (r === 'chong') relations.push(`오늘의 지지 ${TB}${P(TB, '이', '가')} 명식의 ${POS[i]}(${bs[i]}, ${POS_MEAN[i]})와 충(沖)을 이뤄 그 영역에서 변화나 엇갈림이 생기기 쉬워요.`);
    else if (r === 'liuhe') relations.push(`오늘의 지지 ${TB}${P(TB, '이', '가')} 명식의 ${POS[i]}(${bs[i]}, ${POS_MEAN[i]})와 육합(六合)을 이뤄 그 영역이 부드럽게 풀리기 쉬워요.`);
  });
  const sh = sanheOf(TB);
  const shHave = [...sh[0]].filter(c => c !== TB && bs.includes(c));
  if (shHave.length) relations.push(`오늘의 ${TB}${P(TB, '이', '가')} 명식의 ${shHave.join('·')}${P(shHave[shHave.length - 1], '과', '와')} ${shHave.length === 2 ? `${sh[0]} 삼합` : '반합'}을 이뤄 ${elLabel(sh[1])} 기운이 살아나요.`);
  if (stemHe) relations.push(`일간 ${day}${P(day, '과', '와')} 오늘의 천간 ${TS}${P(TS, '이', '가')} 천간합을 이뤄 사람·환경과 어우러지려는 마음이 커져요.`);
  if (stemChong) relations.push(`일간 ${day}${P(day, '과', '와')} 오늘의 천간 ${TS}${P(TS, '이', '가')} 충을 이뤄 생각과 상황이 부딪히기 쉬우니 서두르지 않는 것이 좋아요.`);

  // ── 분야별 점수 ──
  const spouse = input.gender === 'male' ? grp('재성') * 0.8 : input.gender === 'female' ? grp('관성') * 0.8 : (grp('재성') + grp('관성')) * 0.4;
  const raw: Record<CategoryId, number> = {
    love: 3 + fav * 0.4 + grp('식상') * 0.5 + spouse + (has(1, 'liuhe') ? 1 : 0) - (has(1, 'chong') ? 1 : 0) + (stemHe ? 0.5 : 0),
    money: 3 + fav * 0.4 + grp('재성') * (A.strength === 'weak' ? 0.3 : 1) + g('식신') * 0.5 - g('겁재') - g('비견') * 0.4 + elemBonus * 0.3,
    work: 3 + fav * 0.4 + g('정관') + g('편관') * (A.strength === 'weak' ? -0.3 : 0.6) - g('상관') * 0.8 + grp('인성') * 0.4 + (has(2, 'liuhe') ? 0.6 : 0) - (has(2, 'chong') ? 1 : 0),
    study: 3 + fav * 0.3 + g('정인') + g('편인') * 0.8 + g('식신') * 0.5 + g('상관') * 0.2 - grp('재성') * 0.6 - (has(0, 'chong') ? 0.5 : 0),
    health: 3 + elemBonus * 0.8 + grp('인성') * 0.4 - (has(1, 'chong') ? 0.8 : 0) - (A.strength === 'weak' ? grp('관성') * 0.6 : 0) - (A.strength === 'strong' ? grp('비겁') * 0.3 : 0) + fav * 0.3,
    people: 3 + fav * 0.3 + g('비견') * 0.8 - g('겁재') * 0.4 + grp('식상') * 0.5 + (anyRel('liuhe') ? 0.6 : 0) + (shHave.length ? 0.4 : 0) - (has(3, 'chong') ? 0.8 : 0) - (anyRel('chong') ? 0.4 : 0),
  };
  const ids: CategoryId[] = ['love', 'money', 'work', 'study', 'health', 'people'];
  const scores = Object.fromEntries(ids.map(k => [k, clamp(raw[k])])) as Record<CategoryId, number>;

  const relLine = (id: CategoryId): string => {
    const t = `오늘의 지지 ${TB}${P(TB, '이', '가')}`;
    if (id === 'love') {
      if (has(1, 'liuhe')) return `${t} 배우자 자리인 일지(${bs[1]})와 육합을 이뤄 가까운 사이가 부드러워지기 쉬워요.`;
      if (has(1, 'chong')) return `${t} 배우자 자리인 일지(${bs[1]})와 충을 이뤄 가까운 사이에서 의견이 엇갈리기 쉬워요.`;
      if (input.gender === 'male' && grp('재성')) return '전통 해석에서 남성의 배우자 별로 보는 재성이 오늘 들어와 인연과 관계에 마음이 쓰이기 쉬워요.';
      if (input.gender === 'female' && grp('관성')) return '전통 해석에서 여성의 배우자 별로 보는 관성이 오늘 들어와 인연과 관계에 마음이 쓰이기 쉬워요.';
    }
    if (id === 'work') {
      if (has(2, 'liuhe')) return `${t} 일과 사회의 자리인 월지(${bs[2]})와 육합을 이뤄 일터의 호흡이 맞기 쉬워요.`;
      if (has(2, 'chong')) return `${t} 일과 사회의 자리인 월지(${bs[2]})와 충을 이뤄 일정 변경이나 이동이 생기기 쉬워요.`;
    }
    if (id === 'study' && has(0, 'chong')) return `${t} 시지(${bs[0]})와 충을 이뤄 세워 둔 계획이 흔들리기 쉬우니 일정을 넉넉히 잡아 두세요.`;
    if (id === 'money' && A.strength === 'weak' && grp('재성')) return '명식의 힘이 약한 편에 재성이 들어오면 욕심이 부담이 되기 쉬워 무리한 지출이나 투자는 피하는 편이 좋아요.';
    if (id === 'health') {
      if (has(1, 'chong')) return '일지에 충이 있어 생활 리듬이 흔들리기 쉬우니 잠과 식사 시간을 지켜 주세요.';
      const lack = tEls.find(e => chart.elements[e] === 0), over = tEls.find(e => chart.elements[e] >= 3);
      if (lack) return `명식에 없던 ${elLabel(lack)} 기운이 오늘 들어와 생활의 균형을 채우기 좋은 날이에요.`;
      if (over) return `명식에 많은 ${elLabel(over)} 기운이 오늘 더해져 한쪽으로 쏠리기 쉬우니 무리하지 마세요.`;
    }
    if (id === 'people') {
      if (has(3, 'liuhe')) return `${t} 바깥 환경의 자리인 년지(${bs[3]})와 육합을 이뤄 새로운 사람과도 어울리기 좋아요.`;
      if (has(3, 'chong')) return `${t} 년지(${bs[3]})와 충을 이뤄 익숙한 모임에서도 거리 조절이 필요해요.`;
    }
    return '';
  };
  const categories: TodayCategory[] = ids.map(id => {
    const s = scores[id], [lead, tip] = CAT_LEVEL[id][lvl(s)];
    const parts = [CAT_BASE[id][sG], relLine(id), lead].filter(Boolean);
    return { id, ...CAT_META[id], score: s, grade: GRADE[s], keyword: CAT_KEY[id][sG], text: parts.join(' '), tip };
  });

  // ── 총운 ──
  let tRaw = 3 + fav * 0.8 + elemBonus * 0.5 + (has(1, 'liuhe') ? 0.5 : 0) + (anyRel('liuhe') ? 0.3 : 0) - (has(1, 'chong') ? 0.8 : 0) - (has(2, 'chong') ? 0.5 : 0) - (anyRel('chong') ? 0.3 : 0) + (stemHe ? 0.3 : 0) - (stemChong ? 0.5 : 0);
  tRaw = tRaw * 0.6 + (ids.reduce((a, k) => a + scores[k], 0) / ids.length) * 0.4;
  const total = clamp(tRaw);
  const strengthTxt = A.strength === 'strong' ? '명식에서 나를 돕는 기운(비겁·인성)이 강한 편' : A.strength === 'weak' ? '명식에서 나를 돕는 기운(비겁·인성)이 약한 편' : '명식의 힘이 비교적 고른 편';
  const favTxt = favOf(sG) > 0 ? `오늘 들어오는 ${GROUP_LABEL[sG]}이 균형을 잡아 주는 쪽으로 작용해요.` : favOf(sG) < 0 ? `오늘 들어오는 ${GROUP_LABEL[sG]}은 부담이 되기 쉬워 속도를 조절하면 좋아요.` : `오늘 기운은 명식 위에 무난하게 얹히는 편이에요.`;
  const flow = [
    `오늘은 ${gz}일(${ko(gz)}일)이에요. 일간 ${day}(${dsInfo[0]}${EL_KO[dsInfo[1]]}) 기준으로 오늘의 천간 ${TS}${P(TS, '은', '는')} ${stemGod}, 지지 ${TB} 속 본기는 ${branchGod}이라 ${GOD_DAY[stemGod]}이에요.`,
    `${strengthTxt}이라, ${favTxt}`,
    ...relations.slice(0, 2),
  ];
  // 주의할 점: 충이 있으면 그 자리, 없으면 가장 낮은 분야, 그래도 없으면 오늘 십성의 주의점
  const lowCat = [...categories].sort((a, b) => a.score - b.score)[0], highCat = [...categories].sort((a, b) => b.score - a.score)[0];
  const chongIdx = relAt.findIndex(r => r === 'chong');
  const caution = chongIdx >= 0
    ? `${POS_MEAN[chongIdx]}(${POS[chongIdx]})에 충이 걸리는 날이라 그 영역의 큰 결정은 하루 더 살펴보세요. ${GOD_CAUTION[stemGod]}`
    : lowCat.score <= 2 ? `${lowCat.title}이 낮게 나온 날이에요. ${CAT_LEVEL[lowCat.id][0][1]} ${GOD_CAUTION[stemGod]}` : GOD_CAUTION[stemGod];
  const action = highCat.score >= 4 ? `${GOD_ACTION[stemGod]} 특히 ${highCat.title}이 좋은 날이니 ${CAT_LEVEL[highCat.id][2][1]}` : GOD_ACTION[stemGod];

  // ── 행운 요소: 강약으로 도움이 되는 오행 후보를 정하고, 오늘 일진의 오행까지 더해 가장 부족한 것을 고른다 ──
  const dEl = dsInfo[1];
  const cand: Element[] = A.strength === 'weak' ? [PARENT(dEl), dEl] : A.strength === 'strong' ? [GEN[dEl], CTRL[dEl], CTRLED_BY(dEl)] : ['wood', 'fire', 'earth', 'metal', 'water'];
  const after = { ...chart.elements }; tEls.forEach(e => after[e]++);
  const lucky = cand.reduce((best, e) => (after[e] < after[best] ? e : best), cand[0]);
  const L = LUCK[lucky];
  const ci = hash(`${seed}:c`) % 3;
  const colors = [L.colors[ci], L.colors[(ci + 1) % 3]].map(([name, hex]) => ({ name, hex }));
  const times = L.times.filter(t => rel(t, TB) !== 'chong');
  const tPick = (times.length ? times : L.times).sort((a, b) => (rel(b, TB) === 'liuhe' || rel(b, TB) === 'sanhe' ? 1 : 0) - (rel(a, TB) === 'liuhe' || rel(a, TB) === 'sanhe' ? 1 : 0))[0];
  const luckyItem = pick(L.items, seed, 1), luckyAction = pick(L.actions, seed, 2);
  const luckyReason = A.strength === 'weak' ? `나를 돕는 ${elLabel(PARENT(dEl))}·${elLabel(dEl)}` : A.strength === 'strong' ? `기운을 덜어 주는 ${[GEN[dEl], CTRL[dEl], CTRLED_BY(dEl)].map(elLabel).join('·')}` : '다섯 오행';

  // ── 오늘 잘 맞는 띠 ──
  const my = chart.yearBranch;
  const sT: Record<Rel, number> = { liuhe: 3, sanhe: 2, same: 1, chong: -5, none: 0 }, sM: Record<Rel, number> = { liuhe: 2, sanhe: 2, same: 0, chong: -4, none: 0 };
  const ranked = ORDER.map(b => ({ b, rt: rel(b, TB), rm: rel(b, my), s: sT[rel(b, TB)] + sM[rel(b, my)], tie: hash(`${ymd}:${b}`) }))
    .sort((a, c) => c.s - a.s || a.tie - c.tie).slice(0, 3);
  const matches: TodayMatch[] = ranked.map((x, i) => {
    const parts: string[] = [];
    if (x.rt === 'liuhe') parts.push(`오늘의 지지 ${TB}${P(TB, '과', '와')} 육합을 이뤄 하루 동안 서로 부드럽게 맞춰 주는 사이예요.`);
    else if (x.rt === 'sanhe') parts.push(`오늘의 지지 ${TB}${P(TB, '과', '와')} ${sanheOf(TB)[0]} 삼합으로 이어져 함께 움직일 때 힘이 모여요.`);
    else if (x.rt === 'same') parts.push(`오늘과 같은 ${TB} 기운이라 하루의 흐름을 함께 타기 좋아요.`);
    if (x.rm === 'liuhe' || x.rm === 'sanhe') parts.push(`내 띠(${animal(my)}띠)와도 합을 이뤄 호흡이 잘 맞아요.`);
    if (!parts.length) parts.push('오늘의 지지와 내 띠 모두와 부딪힘이 없어 편안하게 어울릴 수 있어요.');
    const z = ZODIAC[BRANCH[x.b][2]];
    return { rank: i + 1, animal: BRANCH[x.b][2], hanja: x.b, name: z.name, reason: parts.join(' '), advice: MATCH_ADVICE[BRANCH[x.b][1]] };
  });

  // ── 키워드와 한마디 ──
  const k3 = anyRel('chong') || stemChong ? '조율' : anyRel('liuhe') || shHave.length || stemHe ? '어울림' : EL_KEY[lucky];
  const keywords = [...new Set([GROUP_KEY[sG], GOD_KEY[branchGod], k3, EL_KEY[lucky]])].slice(0, 3);
  const word = WORD[sG][lvl(total)][hash(`${seed}:w`) % 2];

  return {
    date: todayDate(ymd, nextRefreshAt),
    basis: { dayPillar: chart.gz.day, dayPillarKo: `${STEM[chart.gz.day[0]][0]}${BRANCH[chart.gz.day[1]][0]}`, strength: A.strength === 'strong' ? '신강(身強) 쪽' : A.strength === 'weak' ? '신약(身弱) 쪽' : '중화(中和)에 가까움', stemGod, branchGod, relations, luckyElement: elLabel(lucky) },
    total: {
      score: total, grade: GRADE[total], headline: HEADLINE[stemGod][lvl(total)], summary: `${GOD_DAY[stemGod]}이에요.${highCat.score >= 4 ? ` 분야 가운데서는 ${highCat.title}이 가장 돋보여요.` : lowCat.score <= 2 ? ` ${lowCat.title}은 한 번 더 살펴 주세요.` : ' 분야별로 큰 기복 없이 고른 하루예요.'}`,
      flow, keywords,
      chance: GOD_CHANCE[stemGod] + (anyRel('liuhe') || stemHe || shHave.length ? ' 오늘은 명식과 합(合)을 이루는 기운이 있어 주변의 도움도 기대해 볼 만해요.' : ''),
      caution, action, advice: DAILY_ADVICE[sG],
    },
    categories,
    lucky: { element: lucky, elementLabel: elLabel(lucky), colors, numbers: L.numbers, direction: L.direction, time: { name: `${tPick}時`, range: SIJIN[tPick] }, item: luckyItem, action: luckyAction,
      note: `${strengthTxt}이라 ${luckyReason} 가운데, 오늘 일진의 오행까지 더했을 때 가장 부족한 ${elLabel(lucky)}${batchim(EL_KO[lucky]) ? '을' : '를'} 오늘의 행운 오행으로 골랐어요. 색·숫자·방향·시간은 전통 오행 배속(오방색·하도의 수·방위·십이시진)에 따른 상징이에요.` },
    matches,
    word,
    scope: [
      ...(input.time ? [] : ['태어난 시간을 몰라 시주를 뺀 여섯 글자로 풀었어요. 시지(時支)와 오늘 지지의 합·충은 보지 않았고, 강약과 오행 판단도 덜 정밀할 수 있어요.']),
      ...(input.gender ? [] : ['성별을 선택하지 않아 애정운의 배우자 별은 재성과 관성을 함께 참고했어요.']),
    ],
    notes: [
      '오늘의 일진은 한국 시간(Asia/Seoul) 자정 기준 날짜의 일주(日柱)예요. 자시(밤 11시)부터 다음 날로 보는 방식은 적용하지 않았어요.',
      '명식은 ‘나의 사주팔자’와 같은 만세력 계산을 쓰고, 일간 기준 오늘 천간·지지(본기)의 십성, 명식 지지와의 합·충, 일간과의 천간합·충, 오행 분포를 규칙에 따라 더해 풀이했어요.',
      '강약은 천간·지지의 십성 개수와 지장간을 단순하게 센 값이에요. 용신(用神)을 정밀하게 정하거나 대운·세운·월운을 함께 본 풀이는 아니에요.',
      '분야별 등급은 사건을 예측하지 않는 참고 지표이고, 건강운은 질병을 예측하거나 진단하지 않는 일상 관리 조언이에요.',
      '전통 명리학의 해석 체계를 바탕으로 한 참고용·오락용 콘텐츠이며, 과학적으로 검증된 예측이나 확률이 아니에요. 중요한 결정은 현실적인 정보와 본인의 판단을 함께 고려해 주세요.',
    ],
  };
}

