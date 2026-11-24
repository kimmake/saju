/**
 * 결과 이미지 저장용 글꼴 CSS.
 * 한글 웹폰트는 유니코드 범위별로 수십~수백 개 파일로 나뉘어 있어, html-to-image 기본 동작(쓰인 글꼴의 모든 조각 포함)은 매우 느리다.
 * 카드에 실제로 쓰인 글자가 속한 조각만 골라 data URL로 넣는다.
 */
function parseRanges(range: string): [number, number][] {
  if (!range) return [[0, 0x10ffff]];
  return range.split(',').map(r => {
    const t = r.trim().replace(/^U\+/i, '');
    if (t.includes('?')) return [parseInt(t.replace(/\?/g, '0'), 16), parseInt(t.replace(/\?/g, 'F'), 16)];
    const [a, b] = t.split('-');
    return [parseInt(a, 16), parseInt(b ?? a, 16)];
  });
}

const toDataURL = (blob: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(blob); });

export async function buildFontEmbedCSS(node: HTMLElement): Promise<string> {
  const codes = new Set<number>();
  for (const ch of node.textContent || '') codes.add(ch.codePointAt(0)!);
  const families = new Set<string>();
  node.querySelectorAll<HTMLElement>('*').forEach(el => getComputedStyle(el).fontFamily.split(',').forEach(f => families.add(f.trim().replace(/["']/g, ''))));
  getComputedStyle(node).fontFamily.split(',').forEach(f => families.add(f.trim().replace(/["']/g, '')));

  const picked: { css: string; url: string; base: string }[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      const fam = rule.style.getPropertyValue('font-family').trim().replace(/["']/g, '');
      if (!families.has(fam)) continue;
      const ranges = parseRanges(rule.style.getPropertyValue('unicode-range'));
      let hit = false;
      for (const c of codes) { if (ranges.some(([a, b]) => c >= a && c <= b)) { hit = true; break; } }
      if (!hit) continue;
      const m = /url\((['"]?)([^'")]+\.woff2[^'")]*)\1\)/.exec(rule.style.getPropertyValue('src'));
      if (!m) continue;
      picked.push({ css: rule.cssText, url: m[2], base: sheet.href || location.href });
    }
  }
  const parts = await Promise.all(picked.map(async p => {
    try {
      const abs = new URL(p.url, p.base).href;
      const data = await toDataURL(await (await fetch(abs)).blob());
      return p.css.replace(/src:[^;]+;/, `src: url(${data}) format("woff2");`);
    } catch { return ''; }
  }));
  return parts.join('\n');
}
