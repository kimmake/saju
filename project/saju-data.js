/* 운결 — 데이터 계층
 * 1) 만세력 계산: lunar-javascript (무료 오픈소스, 브라우저에서 계산 · 입춘/절기 기준)
 * 2) 띠 궁합: 육합·삼합·충 규칙으로 결정적으로 계산
 * 3) 해석 문장: 계산된 명식을 근거로 Claude가 작성 (실패 시 계산 결과만 표시)
 * 화면(운결.dc.html)은 analyze(input)의 결과 객체만 사용합니다.
 */
(function () {
  const ZODIAC = {
    rat: { name: '쥐', hanja: '子', tint: '#E6E2EF' }, ox: { name: '소', hanja: '丑', tint: '#EDE4D3' },
    tiger: { name: '호랑이', hanja: '寅', tint: '#F1E2CF' }, rabbit: { name: '토끼', hanja: '卯', tint: '#E3EADB' },
    dragon: { name: '용', hanja: '辰', tint: '#DDE6E6' }, snake: { name: '뱀', hanja: '巳', tint: '#EBDDDA' },
    horse: { name: '말', hanja: '午', tint: '#EFDCD2' }, goat: { name: '양', hanja: '未', tint: '#EEE6D6' },
    monkey: { name: '원숭이', hanja: '申', tint: '#E8E4DA' }, rooster: { name: '닭', hanja: '酉', tint: '#F0E5CC' },
    dog: { name: '개', hanja: '戌', tint: '#E9DFD2' }, pig: { name: '돼지', hanja: '亥', tint: '#E0E4EE' },
  };
  const STEM = { 甲: ['갑', 'wood', 1], 乙: ['을', 'wood', 0], 丙: ['병', 'fire', 1], 丁: ['정', 'fire', 0], 戊: ['무', 'earth', 1], 己: ['기', 'earth', 0], 庚: ['경', 'metal', 1], 辛: ['신', 'metal', 0], 壬: ['임', 'water', 1], 癸: ['계', 'water', 0] };
  const BRANCH = { 子: ['자', 'water', 'rat', '癸'], 丑: ['축', 'earth', 'ox', '己'], 寅: ['인', 'wood', 'tiger', '甲'], 卯: ['묘', 'wood', 'rabbit', '乙'], 辰: ['진', 'earth', 'dragon', '戊'], 巳: ['사', 'fire', 'snake', '丙'], 午: ['오', 'fire', 'horse', '丁'], 未: ['미', 'earth', 'goat', '己'], 申: ['신', 'metal', 'monkey', '庚'], 酉: ['유', 'metal', 'rooster', '辛'], 戌: ['술', 'earth', 'dog', '戊'], 亥: ['해', 'water', 'pig', '壬'] };
  const ORDER = '子丑寅卯辰巳午未申酉戌亥'.split('');
  const EL_KO = { wood: '목', fire: '화', earth: '토', metal: '금', water: '수' };
  const EL_HAN = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
  const GEN = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
  const CTRL = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };
  const LIUHE = ['子丑', '寅亥', '卯戌', '辰酉', '巳申', '午未'];
  const SANHE = [['申子辰', 'water'], ['亥卯未', 'wood'], ['寅午戌', 'fire'], ['巳酉丑', 'metal']];
  const CHONG = ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥'];
  const pairIn = (list, a, b) => list.some(p => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
  const sanheOf = b => SANHE.find(g => g[0].includes(b));
  function rel(a, b) {
    if (a === b) return 'same';
    if (pairIn(LIUHE, a, b)) return 'liuhe';
    if (pairIn(CHONG, a, b)) return 'chong';
    const g = sanheOf(a); if (g && g[0].includes(b)) return 'sanhe';
    return 'none';
  }
  const animal = b => ZODIAC[BRANCH[b][2]].name;

  function tenGod(day, stem) {
    const d = STEM[day], o = STEM[stem], same = d[2] === o[2];
    if (d[1] === o[1]) return same ? '비견' : '겁재';
    if (GEN[d[1]] === o[1]) return same ? '식신' : '상관';
    if (CTRL[d[1]] === o[1]) return same ? '편재' : '정재';
    if (CTRL[o[1]] === d[1]) return same ? '편관' : '정관';
    return same ? '편인' : '정인';
  }

  function lib() {
    const S = window.Solar || (window.lunar && window.lunar.Solar), L = window.Lunar || (window.lunar && window.lunar.Lunar);
    if (!S || !L) throw new Error('만세력 계산 도구를 불러오지 못했어요. 네트워크를 확인한 뒤 다시 시도해 주세요.');
    return { Solar: S, Lunar: L };
  }

  // ── 국내 시각 보정: 표준시 변경 이력 + 서머타임 ──
  // 표준 자오선 135°(UTC+9) 시기는 동경 127.5° 기준 30분 보정, 127.5°(UTC+8:30) 시기는 0분.
  // 브라우저 현지 시간대(예: Asia/Seoul의 과거 서머타임)의 영향을 피하려고 모든 '시계 시각'을 UTC 기준 가상 시각으로 다룬다.
  const D_ = (y, m, d, h = 0, mi = 0) => new Date(Date.UTC(y, m - 1, d, h, mi));
  const TZ_8_30 = [[D_(1908, 4, 1), D_(1912, 1, 1)], [D_(1954, 3, 21), D_(1961, 8, 10)]];
  const DST = [ // [시작, 종료) 현지 시계 기준
    [D_(1948, 6, 1), D_(1948, 9, 13)], [D_(1949, 4, 3), D_(1949, 9, 11)], [D_(1950, 4, 1), D_(1950, 9, 10)], [D_(1951, 5, 6), D_(1951, 9, 9)],
    [D_(1955, 5, 5), D_(1955, 9, 9)], [D_(1956, 5, 20), D_(1956, 9, 30)], [D_(1957, 5, 5), D_(1957, 9, 22)], [D_(1958, 5, 4), D_(1958, 9, 21)],
    [D_(1959, 5, 3), D_(1959, 9, 20)], [D_(1960, 5, 1), D_(1960, 9, 18)],
    [D_(1987, 5, 10, 2), D_(1987, 10, 11, 3)], [D_(1988, 5, 8, 2), D_(1988, 10, 9, 3)],
  ];
  const inRange = (t, list) => list.some(([a, b]) => t >= a && t < b);
  const HOUR = 3600000;
  // 서머타임 경계: 시작 직후 1시간은 시계에 없던 시각(gap), 종료 직전 1시간은 두 번 있었던 시각(overlap)
  function dstBoundary(clock) {
    for (const [a, b] of DST) {
      if (clock >= a && clock < new Date(a.getTime() + HOUR)) return { type: 'gap', at: a };
      if (clock >= new Date(b.getTime() - HOUR) && clock < b) return { type: 'overlap', at: b };
    }
    return null;
  }
  function koreaCorrection(clock, choice) {
    const bd = dstBoundary(clock);
    let dst = inRange(clock, DST);
    if (bd && bd.type === 'gap') dst = false;
    if (bd && bd.type === 'overlap' && choice === 'std') dst = false;
    const lon = !inRange(clock, TZ_8_30);
    const minutes = (dst ? 60 : 0) + (lon ? 30 : 0);
    const text = dst && lon ? '서머타임 1시간과 경도 보정 30분을 빼'
      : dst ? '서머타임 1시간을 빼(당시 표준시가 동경 127.5° 기준이라 경도 보정은 없어요)'
      : lon ? '경도 보정 30분을 빼' : '당시 표준시가 동경 127.5° 기준이라 보정 없이';
    return { minutes, text, toBeijing: (dst ? 60 : 0) + (lon ? 60 : 30), boundary: bd, dst };
  }

  // ── 한국 음력 → 양력 ──
  // 라이브러리 음력은 중국(UTC+8) 기준. 한국 음력(한국천문연구원)은 UTC+9 기준이라
  // 삭(신월)·중기의 날짜를 한국 시간으로 다시 정해 달의 시작과 윤달을 새로 계산한다.
  const ZHONGQI = ['冬至', '大寒', '雨水', '春分', '谷雨', '小满', '夏至', '大暑', '处暑', '秋分', '霜降', '小雪', 'DONG_ZHI', 'DA_HAN', 'YU_SHUI'];
  function krMonthStart(jdBj) {
    const SX = window.ShouXingUtil, d0 = jdBj - 2451545;
    const t = SX.shuoHigh(Math.floor((d0 + 8) / 29.5306) * Math.PI * 2);
    if (Math.floor(t + 0.5) !== d0) return jdBj;
    return jdBj + (Math.floor(t + 1 / 24 + 0.5) - d0);
  }
  const krYearCache = {};
  function krLunarMonths(Y) {
    if (krYearCache[Y]) return krYearCache[Y];
    const starts = new Set();
    for (let y = Y - 1; y <= Y + 2; y++) window.LunarYear.fromYear(y).getMonths().forEach(m => starts.add(m.getFirstJulianDay()));
    const S = [...starts].sort((a, b) => a - b).map(krMonthStart);
    const zq = [], ws = [], seen = new Set();
    for (let y = Y - 1; y <= Y + 2; y++) {
      const t = window.Lunar.fromYmd(y, 6, 1).getJieQiTable();
      for (const k in t) {
        if (!ZHONGQI.includes(k)) continue;
        const jd = t[k].getJulianDay(), key = Math.round(jd * 100);
        if (seen.has(key)) continue; seen.add(key);
        const day = Math.floor(jd + 1 / 24 + 0.5);
        zq.push(day); if (k === '冬至' || k === 'DONG_ZHI') ws.push(day);
      }
    }
    ws.sort((a, b) => a - b);
    const idx = day => { for (let i = 0; i < S.length - 1; i++) if (day >= S[i] && day < S[i + 1]) return i; return -1; };
    const hasZq = i => zq.some(d => d >= S[i] && d < S[i + 1]);
    const out = [];
    for (let w = 0; w < ws.length - 1; w++) {
      const a = idx(ws[w]), b = idx(ws[w + 1]);
      if (a < 0 || b < 0) continue;
      const wsYear = window.Solar.fromJulianDay(ws[w]).getYear(), leapNeeded = b - a === 13;
      let leapDone = false, num = 11, yr = wsYear;
      for (let i = a; i < b; i++) {
        let leap = false;
        if (i > a && leapNeeded && !leapDone && !hasZq(i)) { leap = true; leapDone = true; }
        else if (i > a) { num++; if (num > 12) { num = 1; yr = wsYear + 1; } }
        out.push({ y: yr, m: num, leap, start: S[i], len: S[i + 1] - S[i] });
      }
    }
    return (krYearCache[Y] = out.filter(x => x.y === Y));
  }
  // 한국천문연구원(KASI) 음양력 데이터 기반 공개 라이브러리(korean-lunar-calendar, 1000–2050년)를 우선 사용.
  // 불러오지 못했거나 범위 밖이면 아래 자체 계산(krLunarMonths)으로 대체.
  let KLC = null;
  const klcReady = import('https://cdn.jsdelivr.net/npm/korean-lunar-calendar@0.4.0/dist/korean-lunar-calendar.mjs')
    .then(m => { KLC = m.default; }).catch(() => { KLC = null; });
  function koreanLunarToSolar(y, m, leap, d) {
    const { Solar } = lib();
    if (KLC && y >= 1000 && y <= 2050) {
      const c = new KLC();
      const ok = c.setLunarDate(y, m, d, !!leap);
      if (!ok) {
        const hasLeap = leap && c.setLunarDate(y, m, 1, true);
        throw new Error(leap && !hasLeap ? `${y}년에는 음력 윤${m}월이 없어요. 윤달 여부를 확인해 주세요.` : `음력 ${y}년 ${leap ? '윤' : ''}${m}월에는 ${d}일이 없어요. 날짜를 확인해 주세요.`);
      }
      const s = c.getSolarCalendar();
      return Solar.fromYmd(s.year, s.month, s.day);
    }
    return koreanLunarToSolarCalc(y, m, leap, d);
  }
  function koreanLunarToSolarCalc(y, m, leap, d) {
    const { Solar } = lib();
    const mo = krLunarMonths(y).find(x => x.m === m && x.leap === !!leap);
    if (!mo) throw new Error(leap ? `${y}년에는 음력 윤${m}월이 없어요. 윤달 여부를 확인해 주세요.` : `음력 ${y}년 ${m}월을 찾지 못했어요. 날짜를 확인해 주세요.`);
    if (d < 1 || d > mo.len) throw new Error(`음력 ${y}년 ${leap ? '윤' : ''}${m}월은 ${mo.len}일까지 있어요. 날짜를 확인해 주세요.`);
    return Solar.fromJulianDay(mo.start + d - 1);
  }

  // ── 1. 만세력 계산 ──
  function computeChart(input) {
    const { Solar, Lunar } = lib();
    const { year: y, month: m, day: d } = input.birth;
    const hasTime = !!input.time;
    const h = hasTime ? input.time.hour : 12, mi = hasTime ? input.time.minute : 0;
    let solar;
    if (input.calendar === 'lunar') {
      const s = koreanLunarToSolar(y, m, input.isLeapMonth, d);
      solar = Solar.fromYmdHms(s.getYear(), s.getMonth(), s.getDay(), h, mi, 0);
    } else {
      solar = Solar.fromYmdHms(y, m, d, h, mi, 0);
    }
    const notes = [];
    if (input.calendar === 'lunar') notes.push(`한국 음력(한국 표준시 기준) 날짜를 양력 ${solar.getYear()}년 ${solar.getMonth()}월 ${solar.getDay()}일로 바꿔 계산했어요.`);
    let cnSolar = null;
    if (hasTime) {
      const clock = D_(solar.getYear(), solar.getMonth(), solar.getDay(), solar.getHour(), solar.getMinute());
      const { minutes, text, toBeijing, boundary } = koreaCorrection(clock, input.dstChoice);
      if (boundary && boundary.type === 'gap') notes.push('입력한 시각은 서머타임이 시작되며 시계에서 건너뛴 시간이라, 표준시로 적힌 시각으로 보고 계산했어요.');
      if (boundary && boundary.type === 'overlap') notes.push(input.dstChoice === 'std' ? '서머타임이 끝난 뒤의 시각(두 번째)으로 계산했어요.' : '서머타임 중의 시각(첫 번째)으로 계산했어요.');
      const cn = new Date(clock.getTime() - toBeijing * 60000);
      cnSolar = Solar.fromYmdHms(cn.getUTCFullYear(), cn.getUTCMonth() + 1, cn.getUTCDate(), cn.getUTCHours(), cn.getUTCMinutes(), 0);
      const dt = new Date(clock.getTime() - minutes * 60000);
      solar = Solar.fromYmdHms(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate(), dt.getUTCHours(), dt.getUTCMinutes(), 0);
      notes.push(`태어난 시각에서 ${text} 실제 태양시(${String(dt.getUTCHours()).padStart(2, '0')}:${String(dt.getUTCMinutes()).padStart(2, '0')}) 기준으로 계산했어요.`);
    }
    if (!hasTime) notes.push('태어난 시간을 몰라 시주는 비워 두고, 오행은 여섯 글자로 셌어요.');

    // 년·월주와 대운: 절입 시각과 같은 순간으로 비교(라이브러리 절기표는 UTC+8 기준)
    if (!cnSolar) cnSolar = Solar.fromYmdHms(solar.getYear(), solar.getMonth(), solar.getDay(), 11, 0, 0);
    const ecInst = cnSolar.getLunar().getEightChar();
    // 일·시주: 실제 태양시 기준. 국내 만세력 일반 기준대로 자시(23시) 시작 시 일주도 다음 날로(야자시 미적용)
    const ec = solar.getLunar().getEightChar();
    ec.setSect(1);
    const gz = { year: ecInst.getYear(), month: ecInst.getMonth(), day: ec.getDay(), time: hasTime ? ec.getTime() : null };
    if (!hasTime && Solar.fromYmdHms(solar.getYear(), solar.getMonth(), solar.getDay(), 0, 0, 0).getLunar().getEightChar().getMonth() !== Solar.fromYmdHms(solar.getYear(), solar.getMonth(), solar.getDay(), 23, 0, 0).getLunar().getEightChar().getMonth())
      notes.push('태어난 날이 절기가 바뀌는 날이라, 시간을 알면 월주가 달라질 수 있어요.');
    const dayStem = gz.day[0];
    const mk = (label, note, s, key) => s ? {
      label, note, stem: s[0], stemKo: STEM[s[0]][0], stemEl: STEM[s[0]][1], branch: s[1], branchKo: BRANCH[s[1]][0], branchEl: BRANCH[s[1]][1],
      stemGod: key === 'day' ? '일간(나)' : tenGod(dayStem, s[0]), branchGod: tenGod(dayStem, BRANCH[s[1]][3]), isDay: key === 'day',
    } : { label, note, stem: '?', stemKo: '시간 모름', stemEl: 'none', branch: '?', branchKo: '', branchEl: 'none', unknown: true };
    const pillars = [mk('시주', '태어난 시', gz.time, 'time'), mk('일주', '태어난 날', gz.day, 'day'), mk('월주', '태어난 달', gz.month, 'month'), mk('년주', '태어난 해', gz.year, 'year')];
    const elements = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    pillars.forEach(p => { if (!p.unknown) { elements[p.stemEl]++; elements[p.branchEl]++; } });

    let daeun = null;
    if (input.gender) {
      try {
        const yun = ecInst.getYun(input.gender === 'male' ? 1 : 0), list = yun.getDaYun(), now = new Date().getFullYear();
        const first = list[1], cur = list.find((x, i) => i > 0 && x.getStartYear() <= now && now <= x.getEndYear());
        daeun = `대운은 ${first.getStartAge()}세 무렵 시작해요.` + (cur ? ` 지금은 ${cur.getGanZhi()} 대운(${cur.getStartYear()}–${cur.getEndYear()}년)을 지나고 있어요.` : '');
      } catch (e) { daeun = null; }
    }
    return { gz, pillars, elements, dayStem, yearBranch: gz.year[1], notes, daeun, solar: `${solar.getYear()}-${solar.getMonth()}-${solar.getDay()}` };
  }

  function elementNote(el, total) {
    const ks = Object.keys(el), max = Math.max(...ks.map(k => el[k])), min = Math.min(...ks.map(k => el[k]));
    const top = ks.filter(k => el[k] === max).map(k => `${EL_KO[k]}(${EL_HAN[k]})`).join('·');
    const low = ks.filter(k => el[k] === min).map(k => `${EL_KO[k]}(${EL_HAN[k]})`).join('·');
    return `${top} 기운이 가장 많고, ${low}${min === 0 ? '는 비어 있는' : '가 적은'} 구성이에요.`;
  }

  // ── 2. 띠 궁합 (규칙 기반) ──
  function baseMatches(my) {
    const liu = ORDER.find(b => rel(my, b) === 'liuhe');
    const g = sanheOf(my), sanhe = g[0].split('').filter(b => b !== my);
    const myA = animal(my), elKo = EL_KO[g[1]];
    const ranks = [
      { rank: 1, animal: BRANCH[liu][2], keywords: ['편안함', '보완'], relation: '연애 · 친구', reason: `${myA}띠(${my})와 ${animal(liu)}띠(${liu})는 서로 끌어당기는 육합(六合) 관계예요. 성향이 달라도 부족한 부분을 자연스럽게 채워 주어, 가까운 사이일수록 편안함을 느끼기 쉬워요.` },
      { rank: 2, animal: BRANCH[sanhe[0]][2], keywords: ['추진력', '신뢰'], relation: '협업 · 친구', reason: `${g[0]} 삼합(三合)으로 같은 ${elKo}(${EL_HAN[g[1]]}) 기운 아래 모이는 관계예요. 목표가 같을 때 손발이 잘 맞아, 함께 일을 시작하고 밀고 나가기 좋아요.` },
      { rank: 3, animal: BRANCH[sanhe[1]][2], keywords: ['공감', '꾸준함'], relation: '협업 · 연애', reason: `같은 ${g[0]} 삼합 안에서 서로의 속도를 맞춰 주는 짝이에요. 큰 목표를 오래 함께 끌고 갈 때 든든한 힘이 되어 줄 수 있어요.` },
    ];
    return { ranks, summary: `${myA}띠에게는 ${ranks.map(r => ZODIAC[r.animal].name + '띠').join('·')}가 잘 어울려요.` };
  }

  function yearMatches(my) {
    const Y = '未';
    const ACT = { wood: '함께 공부하기', fire: '프로젝트 진행하기', earth: '서로의 생활 습관 돕기', metal: '계획 세우고 정리하기', water: '대화하며 아이디어 나누기' };
    const CAU = { wood: '계획만 세우고 끝나지 않도록 주 1회 진도를 함께 확인해 보세요.', fire: '둘 다 속도가 빨라질 수 있으니 역할과 마감을 처음에 분명히 나눠 주세요.', earth: '도움이 간섭처럼 느껴지지 않도록 서로 원하는 범위를 먼저 정해 두세요.', metal: '기준이 엄격해지지 않도록 칭찬과 피드백을 함께 건네 주세요.', water: '이야기가 길어지면 실행이 늦어질 수 있으니 하나씩 정해서 움직여 보세요.' };
    const sY = { liuhe: 3, sanhe: 2, same: 1, chong: -5, none: 0 }, sM = { liuhe: 2, sanhe: 2, same: 0, chong: -4, none: 0 };
    const scored = ORDER.map((b, i) => ({ b, i, ry: rel(b, Y), rm: rel(b, my), s: sY[rel(b, Y)] + sM[rel(b, my)] })).sort((a, c) => c.s - a.s || a.i - c.i).slice(0, 3);
    const ranks = scored.map((x, k) => {
      const el = BRANCH[x.b][1], parts = [];
      if (x.ry === 'liuhe') parts.push('2027년의 未와 육합을 이루어 한 해의 기운을 부드럽게 받쳐 줘요.');
      else if (x.ry === 'sanhe') parts.push('2027년의 未와 亥卯未 삼합으로 이어져 한 해 동안 함께 쌓아 가기 좋아요.');
      else if (x.ry === 'same') parts.push('2027년과 같은 未 기운이라 한 해의 흐름에 자연스럽게 올라타요.');
      if (x.rm === 'liuhe' || x.rm === 'sanhe') parts.push('내 띠와도 합을 이뤄 호흡이 잘 맞아요.');
      if (!parts.length) parts.push('2027년과 내 띠 모두와 부딪힘이 없어 무난하게 힘을 모을 수 있어요.');
      return { rank: k + 1, animal: BRANCH[x.b][2], activity: ACT[el], expect: parts.join(' '), caution: CAU[el] };
    });
    const chongMine = ORDER.find(b => rel(b, my) === 'chong');
    return {
      ranks, summary: `2027년 정미년(丁未年)에는 ${ranks.map(r => ZODIAC[r.animal].name + '띠').join('·')}와 함께할 때 흐름이 순해져요.`,
      criteria: `2027년 정미년의 지지 未와 각 띠가 이루는 합(合)·충(沖)을 먼저 보고, 내 띠(${animal(my)}띠)와의 관계를 더해 순위를 정했어요. 未와 충이 되는 소띠(丑)와 내 띠와 충이 되는 ${animal(chongMine)}띠(${chongMine})는 순위에서 뒤로 밀려요. 기본 궁합(⑤)과 달리 2027년 한 해의 흐름만을 기준으로 한 해석이에요.`,
    };
  }

  // ── 3. 해석 문장 (Claude) ──
  const FORTUNE = [
    { id: 'children', title: '자녀운', icon: '子', labels: ['소통에서의 강점', '신경 쓰면 좋은 점'], tips: 2, rule: '자녀 유무·자녀 수·성별·임신 가능성을 단정하지 말고, 자녀나 가까운 어린 세대와의 관계·양육·소통 성향으로 쓴다.' },
    { id: 'spouse', title: '배우자운', icon: '緣', labels: ['잘 맞을 수 있는 상대', '관계에서 주의할 점'], tips: 2, rule: '연애·결혼 성향, 잘 맞는 상대의 특징, 강점과 주의점, 대화 팁. 결혼 시기·이혼 여부를 예언하지 않는다.' },
    { id: 'money', title: '금전운', icon: '財', labels: ['재정 관리에서의 강점', '소비할 때 주의할 습관'], tips: 2, rule: '돈을 벌고 관리하는 성향과 일상 관리 팁. 특정 투자 상품 추천이나 수익 보장 표현 금지.' },
    { id: 'work', title: '직장운', icon: '官', labels: ['직무를 탐색할 때 참고할 성향', '이직이나 새로운 도전 전 점검할 것'], tips: 2, rule: '잘 맞는 업무 환경·협업 강점. 특정 직업이나 취업 성공을 단정하지 않는다.' },
    { id: 'study', title: '공부운', icon: '學', labels: ['집중에 도움이 되는 환경', '주의할 습관'], tips: 3, rule: '학습 방식, 집중 환경, 장기 공부와 시험 준비의 강점, 미루기·과몰입 같은 주의 습관. 성적·합격을 예측하지 않는다. 팁은 바로 실천할 수 있는 것 3개.' },
  ];

  async function interpret(chart, input) {
    if (!window.claude || !window.claude.complete) throw new Error('no-claude');
    const p = chart.pillars;
    const pillarText = p.map(x => x.unknown ? `${x.label}: 시간 모름` : `${x.label}: ${x.stem}${x.branch} (천간 ${x.stemKo}·${EL_KO[x.stemEl]} ${x.stemGod}, 지지 ${x.branchKo}·${EL_KO[x.branchEl]} ${x.branchGod})`).join('\n');
    const el = chart.elements, ds = STEM[chart.dayStem];
    const sys = '당신은 전통 명리학에 밝은 한국어 사주 해설가입니다. 주어진 명식만 근거로, 따뜻하고 구체적인 해요체 문장을 씁니다. 점수·확률·퍼센트는 절대 쓰지 않고, 불안을 유도하거나 미래를 단정·예언하지 않습니다. 결제나 추가 상담을 권하지 않습니다. 반드시 JSON만 출력합니다.';
    const spec = FORTUNE.map(f => `"${f.id}": {"summary": 한 줄 요약(35자 내외), "body": [해석 4문장], "tips": [실천 팁 ${f.tips}개, 각 한 문장], "details": [{"label":"${f.labels[0]}","text":2문장},{"label":"${f.labels[1]}","text":2문장}]}  // ${f.rule}`).join(',\n');
    const prompt = `[명식]\n${pillarText}\n일간: ${chart.dayStem}(${ds[0]}${EL_KO[ds[1]]}, ${ds[2] ? '양' : '음'})\n오행 개수: 목${el.wood} 화${el.fire} 토${el.earth} 금${el.metal} 수${el.water}\n띠: ${animal(chart.yearBranch)}띠\n${chart.daeun || ''}\n\n[작성 규칙]\n- 각 항목 body의 1~2문장에는 일간·오행·십신 중 실제 근거를 자연스럽게 언급(예: "일간이 丙화라…", "재성이 드러나 있어…").\n- 쉬운 일상어, 문장당 60자 안팎. 한자는 괄호 없이 최소한으로.\n- 시간을 모르는 경우 시주 관련 해석은 하지 않는다.\n\n다음 형식의 JSON 하나만 출력:\n{\n"summary": 전체 흐름을 요약한 한 문장(45자 내외),\n"keywords": [핵심 키워드 3개, 각 2~7자 명사구],\n${spec}\n}`;
    const text = await window.claude.complete({ model: 'claude-haiku-4-5', max_tokens: 6000, system: sys, messages: [{ role: 'user', content: prompt }] });
    const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    FORTUNE.forEach(f => { const s = json[f.id]; if (!s || !Array.isArray(s.body) || !s.summary) throw new Error('bad-shape'); });
    return json;
  }

  const cache = new Map();
  async function analyze(input) {
    const key = JSON.stringify(input);
    if (cache.has(key)) return JSON.parse(JSON.stringify(cache.get(key)));
    if (input.calendar === 'lunar') await klcReady;
    const chart = computeChart(input);
    const my = chart.yearBranch, base = baseMatches(my), yr = yearMatches(my);
    let ai = null;
    try { ai = await interpret(chart, input); } catch (e) { ai = null; }
    const total = Object.values(chart.elements).reduce((a, b) => a + b, 0);
    const ds = STEM[chart.dayStem];
    const sections = [];
    FORTUNE.slice(0, 4).forEach(f => sections.push(fortuneSection(f, ai)));
    sections.push({ id: 'match', type: 'match', title: '나와 어울리는 띠 TOP 3', icon: '合', summary: base.summary, ranks: base.ranks,
      notice: `띠 궁합은 전체 사주 중 일부를 바탕으로 한 참고 해석이에요. 이 순위는 태어난 해의 지지(${my})를 기준으로 합(合) 관계를 따져 정했어요.`,
      boundary: `띠는 양력 1월 1일이 아니라 입춘(대개 2월 4일 전후)을 기준으로 바뀌어요. 운결은 만세력의 절기 시각을 기준으로 출생 띠를 정하고, 음력 설날과도 구분해요. 입력한 정보로 계산한 띠는 ${animal(my)}띠(${chart.gz.year}년)예요.` });
    sections.push({ id: 'year', type: 'year', title: '2027년 함께하면 좋은 띠 TOP 3', icon: '未', summary: yr.summary, criteria: yr.criteria, ranks: yr.ranks });
    sections.push(fortuneSection(FORTUNE[4], ai));
    const result = {
      meta: ai
        ? { isDemo: false, label: '만세력 계산 결과', chartTag: '만세력 계산', note: '사주팔자와 띠 궁합은 만세력으로 계산했고, 해석 문장은 AI가 명식을 바탕으로 작성했어요.', interpFailed: false }
        : { isDemo: false, label: '만세력 계산 결과', chartTag: '만세력 계산', note: '사주팔자와 띠 궁합은 계산했지만, 해석 문장을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.', interpFailed: true },
      identity: `${animal(my)}띠 · 일간 ${chart.dayStem}(${ds[0]}${EL_KO[ds[1]]})`,
      summary: ai ? ai.summary : `일간 ${chart.dayStem}(${ds[0]}${EL_KO[ds[1]]})를 중심으로 ${elementNote(chart.elements, total).replace(' 구성이에요.', ' 사주예요.')}`,
      keywords: ai && Array.isArray(ai.keywords) ? ai.keywords.slice(0, 3) : [`${EL_KO[ds[1]]}(${EL_HAN[ds[1]]})의 일간`, `${animal(my)}띠`, '만세력 명식'],
      pillars: chart.pillars, elements: chart.elements, elementNote: elementNote(chart.elements, total) + ` ${total}글자 중 각 오행이 나타난 개수예요.`,
      chartNote: ['가운데 강조된 일주의 천간(일간)이 ‘나’를 나타내요.'].concat(chart.notes).join(' '),
      daeun: chart.daeun,
      sections,
    };
    if (ai) cache.set(key, result);
    return JSON.parse(JSON.stringify(result));
  }

  function fortuneSection(f, ai) {
    const s = ai && ai[f.id];
    return s
      ? { id: f.id, type: 'fortune', title: f.title, icon: f.icon, summary: s.summary, body: s.body.slice(0, 5), tips: (s.tips || []).slice(0, f.tips), details: (s.details || []).slice(0, 2) }
      : { id: f.id, type: 'fortune', title: f.title, icon: f.icon, summary: '해석 문장을 불러오지 못했어요.', body: ['명식 계산은 끝났지만 해석 문장을 만드는 중에 문제가 생겼어요. 위쪽의 ‘해석 다시 불러오기’를 눌러 주세요.'], tips: [], details: [] };
  }

  // 화면용: 입력한 출생 시각이 서머타임 경계에 걸리는지 확인
  function dstCheck(input) {
    try {
      if (!input.time) return null;
      const { Solar } = lib();
      const { year: y, month: m, day: d } = input.birth;
      const s = input.calendar === 'lunar' ? koreanLunarToSolar(y, m, input.isLeapMonth, d) : Solar.fromYmd(y, m, d);
      const bd = dstBoundary(D_(s.getYear(), s.getMonth(), s.getDay(), input.time.hour, input.time.minute));
      return bd ? bd.type : null;
    } catch (e) { return null; }
  }

  const sampleInput = { name: '하늘', year: '1994', month: '3', day: '12', calendar: 'solar', leap: false, hour: '15', minute: '20', timeUnknown: false, region: '대한민국', regionOther: '', gender: 'female' };
  window.UngyeolData = { ZODIAC, analyze, computeChart, sampleInput, _krLunarMonths: krLunarMonths, dstCheck };
})();
