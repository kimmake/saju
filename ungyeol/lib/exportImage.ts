import { buildFontEmbedCSS } from './fontEmbed';

/**
 * 결과 내보내기 (모두 브라우저 안에서 처리)
 * 1) 글꼴·그림이 모두 준비될 때까지 기다린다.
 * 2) 노드를 고해상도 캔버스로 그린다. 기기의 캔버스 한도를 넘으면 섹션 경계에서 나눠 여러 장으로 그린다.
 * 3) PNG 파일(1장 또는 여러 장) 또는 A4 PDF로 내보낸다.
 */
const PAPER = '#F5EFE2';
const BREAK_SEL = '[data-brk], .daily > *, .twin > section, .frow, .lrow, .zwhy li, .medals, .report > *, .part > *, .pillars, .elements, .supplement dl > div, .chapter, .chapter__head, .chapter__summary, .chapter__body p, .tips li, .details > div, .rank, .yrank, .criteria, .colophon, .export-head, .export-foot, .part-divider, .total__more > div, p, li';

const isWebKitOnly = () => /AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium|Edg/.test(navigator.userAgent);
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** 그리기 한도: html-to-image는 한 변이 16,384px를 넘으면 몰래 축소하므로 조각은 그 안쪽으로 그린다. */
const RENDER_SIDE = 16_000;
/** 저장 파일 한도: iOS Safari는 캔버스 약 1,670만 화소, 그 밖은 한 변 32,000px · 1.2억 화소 안쪽 */
function outputLimit() {
  const forced = (window as unknown as { __ungyeolMaxPixels?: number }).__ungyeolMaxPixels;
  return { area: forced ?? (isIOS() ? 16_000_000 : 120_000_000), side: isIOS() ? 16_000 : 32_700 };
}
const debug = (...a: unknown[]) => { if ((window as unknown as { __ungyeolDebug?: boolean }).__ungyeolDebug) console.log('[export]', ...a); };

async function waitAssets(node: HTMLElement) {
  if (document.fonts?.ready) await document.fonts.ready;
  const imgs = Array.from(node.querySelectorAll('img'));
  const one = (img: HTMLImageElement) => (img.complete && img.naturalWidth ? (img.decode?.() ?? Promise.resolve()).catch(() => {}) : new Promise<void>(res => { img.addEventListener('load', () => res(), { once: true }); img.addEventListener('error', () => res(), { once: true }); }));
  await Promise.race([Promise.all(imgs.map(one)), new Promise(r => setTimeout(r, 6000))]);
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
}

/** 노드 안에서 자를 수 있는 위치(요소 위쪽 경계, CSS px) */
function breakPoints(node: HTMLElement): number[] {
  const top = node.getBoundingClientRect().top;
  const pts = new Set<number>();
  node.querySelectorAll<HTMLElement>(BREAK_SEL).forEach(el => { const y = Math.round(el.getBoundingClientRect().top - top); if (y > 0) pts.add(y); });
  return [...pts].sort((a, b) => a - b);
}

/** 전체 높이를 maxH 이하의 고른 구간들로 나눈다. 각 구간 끝은 목표 지점에 가장 가까운 자를 위치(섹션 경계)로 잡아, 아주 짧은 꼬리 구간이 생기지 않게 한다. */
function plan(total: number, maxH: number, pts: number[], from = 0): [number, number][] {
  const out: [number, number][] = []; let y = from; const end = from + total;
  while (end - y > maxH) {
    const left = Math.ceil((end - y) / maxH);            // 남은 구간 수
    const target = y + (end - y) / left, limit = y + maxH;
    const cand = pts.filter(p => p > y + maxH * 0.3 && p <= limit);
    const cut = cand.length ? cand.reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a)) : Math.min(limit, Math.round(target));
    out.push([y, cut]); y = cut;
  }
  out.push([y, end]);
  return out;
}

export interface Rendered { canvases: HTMLCanvasElement[]; ratio: number; width: number; ranges: [number, number][]; points: number[] }

/** 노드를 캔버스(들)로 그린다. */
export async function renderNode(node: HTMLElement, ratio = 2): Promise<Rendered> {
  await waitAssets(node);
  const lib = await import('html-to-image');
  let fontEmbedCSS: string | undefined;
  const tf = performance.now();
  try { fontEmbedCSS = await buildFontEmbedCSS(node); } catch { fontEmbedCSS = undefined; }
  debug('fonts', Math.round(performance.now() - tf) + 'ms', fontEmbedCSS?.length);
  const width = Math.ceil(node.offsetWidth), total = Math.ceil(node.scrollHeight);
  if (!width || !total) throw new Error('empty');
  debug('ready', width, total);
  const lim = outputLimit();
  const outMaxH = Math.floor(Math.min(lim.side, lim.area / (width * ratio)) / ratio);   // 파일 한 장의 최대 높이(CSS px)
  const points = breakPoints(node);
  const ranges = plan(total, outMaxH, points);
  const canvases: HTMLCanvasElement[] = [];
  const draw = async (y0: number, y1: number) => {
    const opts = {
      pixelRatio: ratio, backgroundColor: PAPER, fontEmbedCSS, cacheBust: false,
      width, height: y1 - y0, canvasWidth: width, canvasHeight: y1 - y0,
      style: { transform: `translateY(${-y0}px)`, transformOrigin: 'top left', margin: '0' },
    };
    if (isWebKitOnly() && !canvases.length) { try { await lib.toCanvas(node, opts); } catch { /* Safari 첫 렌더 예열 */ } }
    const t = performance.now(); const c = await lib.toCanvas(node, opts); debug('chunk', y0, y1, Math.round(performance.now() - t) + 'ms');
    return c;
  };
  for (const [a, b] of ranges) {
    const parts = plan(b - a, Math.floor(RENDER_SIDE / ratio), points.filter(p => p > a && p < b), a);
    const cs: HTMLCanvasElement[] = [];
    for (const [y0, y1] of parts) cs.push(await draw(y0, y1));
    if (cs.length === 1) { canvases.push(cs[0]); continue; }
    const out = document.createElement('canvas'); out.width = cs[0].width; out.height = cs.reduce((h, c) => h + c.height, 0);
    const ctx = out.getContext('2d')!; let y = 0;
    for (const c of cs) { ctx.drawImage(c, 0, y); y += c.height; }
    canvases.push(out);
  }
  if (!canvases.length || canvases.some(c => !c.width || !c.height)) throw new Error('empty');
  return { canvases, ratio, width, ranges, points };
}

const toBlob = (c: HTMLCanvasElement, type = 'image/png', q?: number) => new Promise<Blob>((res, rej) => c.toBlob(b => (b && b.size > 2000 ? res(b) : rej(new Error('empty'))), type, q));

/** 파일들을 모바일은 공유 시트(사진첩 저장), 데스크톱은 내려받기로 넘긴다. */
export async function deliver(files: File[], title: string): Promise<string> {
  const touch = window.matchMedia?.('(pointer: coarse)').matches;
  if (touch && navigator.canShare?.({ files })) {
    await navigator.share({ files, title });
    return files.length > 1 ? `${files.length}장의 이미지를 공유 메뉴로 보냈어요. ‘이미지 저장’을 고르면 사진첩에 저장돼요.` : '공유 메뉴에서 ‘이미지 저장’을 선택하면 사진첩에 저장돼요.';
  }
  for (const f of files) {
    const url = URL.createObjectURL(f);
    const a = document.createElement('a'); a.href = url; a.download = f.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 8000);
    if (files.length > 1) await new Promise(r => setTimeout(r, 350));
  }
  return files.length > 1 ? `결과가 길어 ${files.length}장의 이미지로 나눠 저장했어요. (${files[0].name} 외)` : `‘${files[0].name}’ 파일로 저장했어요.`;
}

/** PNG로 저장: 한 장에 담기면 한 장, 기기 한도를 넘으면 섹션 경계에서 나눈 여러 장 */
export async function exportPng(node: HTMLElement, base: string, title: string): Promise<string> {
  const outs = (await renderNode(node)).canvases;
  const n = outs.length;
  const files = await Promise.all(outs.map(async (c, i) => new File([await toBlob(c)], n > 1 ? `${base}_${i + 1}of${n}.png` : `${base}.png`, { type: 'image/png' })));
  return deliver(files, title);
}

/** PDF 쪽 나누기: 쪽마다 최대한 채우되(60% 이상) 섹션 경계에서 자른다. */
function planPages(total: number, maxH: number, pts: number[]): [number, number][] {
  const out: [number, number][] = []; let y = 0;
  while (total - y > maxH) {
    const cand = pts.filter(p => p > y + maxH * 0.6 && p <= y + maxH);
    const cut = cand.length ? cand[cand.length - 1] : y + maxH;
    out.push([y, cut]); y = cut;
  }
  out.push([y, total]);
  return out;
}

/** A4 PDF로 저장: 그린 캔버스를 섹션 경계에서 A4 비율로 다시 잘라 쪽마다 넣는다. */
export async function exportPdf(node: HTMLElement, base: string, title: string): Promise<string> {
  const r = await renderNode(node);
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const W = 210, H = 297, M = 8, cw = W - 2 * M, ch = H - 2 * M;
  const pageCss = Math.floor(r.width * ch / cw);
  let first = true;
  r.canvases.forEach((canvas, ci) => {
    const [y0, y1] = r.ranges[ci];
    const pts = r.points.filter(p => p > y0 && p < y1).map(p => p - y0);
    for (const [a, b] of planPages(y1 - y0, pageCss, pts)) {
      const slice = document.createElement('canvas');
      slice.width = canvas.width; slice.height = Math.round((b - a) * r.ratio);
      const ctx = slice.getContext('2d')!;
      ctx.fillStyle = PAPER; ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, Math.round(a * r.ratio), canvas.width, slice.height, 0, 0, slice.width, slice.height);
      if (!first) pdf.addPage('a4');
      first = false;
      pdf.setFillColor(245, 239, 226); pdf.rect(0, 0, W, H, 'F');
      pdf.addImage(slice.toDataURL('image/jpeg', 0.9), 'JPEG', M, M, cw, (b - a) * cw / r.width, undefined, 'FAST');
    }
  });
  const pages = pdf.getNumberOfPages();
  pdf.setProperties({ title, creator: '운결 運結' });
  const file = new File([pdf.output('blob')], `${base}.pdf`, { type: 'application/pdf' });
  const msg = await deliver([file], title);
  return `${msg.replace(/\.$/, '')} (A4 ${pages}쪽)`;
}
