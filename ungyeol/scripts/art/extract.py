"""퍼블릭 도메인 수묵화에서 먹만 뽑아 투명 배경 에셋으로 만든다.
오래된 종이의 색·얼룩을 국소적으로 추정해 나눈 뒤(종이=1), 어두운 정도를 알파로 쓴다.
사용: python3 extract.py 원본.jpg 출력.webp x0 y0 x1 y1 [--t0 0.1] [--width 1200] [--fade l,r,t,b] [--keep-color 0.3]"""
import argparse
import numpy as np
from PIL import Image, ImageFilter
from inklib import blur

INK = np.array([37, 35, 31], np.float32)

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('box', nargs=4, type=int)
ap.add_argument('--t0', type=float, default=0.10)
ap.add_argument('--t1', type=float, default=0.70)
ap.add_argument('--gamma', type=float, default=1.0)
ap.add_argument('--width', type=int, default=1200)
ap.add_argument('--fade', default='0,0,0,0')
ap.add_argument('--keep-color', type=float, default=0.25)
ap.add_argument('--flip', action='store_true')
ap.add_argument('--q', type=int, default=80)
ap.add_argument('--despeckle', type=int, default=0, help='이 크기 이하의 고립된 점을 지운다 (열림 연산 커널)')
a = ap.parse_args()

im = Image.open(a.src).convert('RGB').crop(tuple(a.box))
if a.flip: im = im.transpose(Image.FLIP_LEFT_RIGHT)
if im.width > a.width: im = im.resize((a.width, round(im.height * a.width / im.width)), Image.LANCZOS)
rgb = np.asarray(im, np.float32)
# 종이 추정: 작게 줄여 밝은 값 위주(최댓값 필터)로 획을 지운 뒤 부드럽게 펴서 원래 크기로
small = im.resize((max(8, im.width // 8), max(8, im.height // 8)), Image.BOX).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(3))
paper = np.asarray(small.resize(im.size, Image.BICUBIC), np.float32)
ratio = np.clip(rgb / np.maximum(paper, 1), 0, 1)
dark = 1 - ratio.mean(axis=2)
alpha = np.clip((dark - a.t0) / (a.t1 - a.t0), 0, 1) ** a.gamma
if a.despeckle:
    k = a.despeckle | 1
    m8 = Image.fromarray((alpha * 255).astype(np.uint8))
    opened = np.asarray(m8.filter(ImageFilter.MinFilter(k)).filter(ImageFilter.MaxFilter(k)), np.float32) / 255
    # 획 근처(열림 후에도 남은 곳 주변)만 원래 세부를 살리고, 고립된 점은 지운다
    near = np.clip(blur(opened, k * 1.5) * 6, 0, 1)
    alpha = alpha * near
alpha = 0.85 * alpha + 0.15 * blur(alpha, 0.8)
# 색: 먹색을 기본으로, 원래 색(채도)을 조금 남긴다
orig = np.clip(ratio * 255 * 0.55, 0, 255)
col = INK[None, None, :] * (1 - a.keep_color) + orig * a.keep_color
# 가장자리 페이드
l, r, t, b = [int(v) for v in a.fade.split(',')]
H, W = alpha.shape
x = np.arange(W)[None, :]; y = np.arange(H)[:, None]
m = np.ones((H, W), np.float32)
if l: m *= np.clip(x / l, 0, 1)
if r: m *= np.clip((W - 1 - x) / r, 0, 1)
if t: m *= np.clip(y / t, 0, 1)
if b: m *= np.clip((H - 1 - y) / b, 0, 1)
alpha *= m ** 1.3
out = Image.fromarray(np.dstack([col, alpha * 255]).clip(0, 255).astype(np.uint8), 'RGBA')
out.save(a.out, 'WEBP', quality=a.q, method=6)
print(a.out, out.size)
