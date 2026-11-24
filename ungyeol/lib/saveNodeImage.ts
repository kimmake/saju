import { buildFontEmbedCSS } from './fontEmbed';

/** 화면 밖 노드를 PNG로 만들어 모바일은 공유 시트, 데스크톱은 내려받기로 넘긴다. 반환값은 안내 문구. */
export async function saveNodeImage(node: HTMLElement, fileName: string, shareTitle: string): Promise<string> {
  const lib = await import('html-to-image');
  const opts = { pixelRatio: 2, cacheBust: true, backgroundColor: '#F5EFE2' };
  if (document.fonts?.ready) await document.fonts.ready;
  let fontEmbedCSS: string | undefined;
  try { fontEmbedCSS = await buildFontEmbedCSS(node); } catch { fontEmbedCSS = undefined; }
  let blob: Blob | null;
  try { blob = await lib.toBlob(node, { ...opts, fontEmbedCSS }); } catch { blob = await lib.toBlob(node, { ...opts, skipFonts: true }); }
  if (!blob) throw new Error('empty');
  const file = new File([blob], fileName, { type: 'image/png' });
  const touch = window.matchMedia?.('(pointer: coarse)').matches;
  if (touch && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: shareTitle });
    return '공유 메뉴에서 ‘이미지 저장’을 선택하면 사진첩에 저장돼요.';
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return `‘${fileName}’ 파일로 저장했어요.`;
}
