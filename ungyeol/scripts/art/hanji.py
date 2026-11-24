"""이음새 없이 반복되는 한지 섬유 텍스처 (투명 배경 위 섬유·얼룩만). background-color 위에 겹쳐 쓴다."""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from inklib import fbm, save_webp

N = 720            # 타일 크기 (px)
SS = 2             # 섬유를 그릴 때의 슈퍼샘플링 배율
rng = np.random.default_rng(11)

# 1) 낮은 주파수의 구름 얼룩 + 고운 입자 → 밝기 편차 (−1..1)
cloud = fbm(N, N, [240, 120, 60, 30], rng, wrap=True) - 0.5
grain = fbm(N, N, [4, 2], rng, wrap=True) - 0.5
lum = cloud * 0.9 + grain * 0.55          # 대략 −0.5..0.5

# 2) 섬유: 슈퍼샘플 캔버스에 짧고 휜 선을 그리고, 타일 경계는 감싸서 다시 그린다.
M = N * SS
dark = Image.new('L', (M, M), 0)
light = Image.new('L', (M, M), 0)
dd, dl = ImageDraw.Draw(dark), ImageDraw.Draw(light)

def fiber(draw, n, len_rng, w_rng, val_rng):
    for _ in range(n):
        L = rng.uniform(*len_rng) * SS
        x, y = rng.uniform(0, M), rng.uniform(0, M)
        ang = rng.uniform(0, np.pi)
        curv = rng.normal(0, 0.035)
        w = max(1, int(round(rng.uniform(*w_rng) * SS)))
        v = int(rng.uniform(*val_rng))
        pts = []
        steps = max(4, int(L / (3 * SS)))
        for i in range(steps + 1):
            pts.append((x, y))
            ang += curv + rng.normal(0, 0.05)
            x += np.cos(ang) * L / steps
            y += np.sin(ang) * L / steps
        for ox in (-M, 0, M):
            for oy in (-M, 0, M):
                draw.line([(px + ox, py + oy) for px, py in pts], fill=v, width=w, joint='curve')

fiber(dl, 1400, (10, 46), (0.6, 1.4), (60, 150))   # 밝은 닥나무 섬유
fiber(dl, 160, (50, 140), (0.5, 1.0), (40, 90))    # 길고 가는 섬유
fiber(dd, 900, (6, 30), (0.5, 1.1), (40, 120))     # 어두운 잔섬유
fiber(dd, 70, (40, 110), (0.6, 1.2), (30, 70))
# 드문 티끌
for _ in range(90):
    x, y = rng.uniform(0, M), rng.uniform(0, M)
    r = rng.uniform(0.6, 1.8) * SS
    dd.ellipse([x - r, y - r, x + r, y + r], fill=int(rng.uniform(60, 140)))

dark = np.asarray(dark.filter(ImageFilter.GaussianBlur(0.6 * SS)).resize((N, N), Image.LANCZOS), np.float32) / 255
light = np.asarray(light.filter(ImageFilter.GaussianBlur(0.7 * SS)).resize((N, N), Image.LANCZOS), np.float32) / 255

# 3) 투명 오버레이로 인코딩: 어두운 성분은 갈색, 밝은 성분은 흰색으로, 둘 다 낮은 알파.
#    알파가 0..~0.12 수준이라 어떤 미색 배경 위에서도 은은하게 보인다.
d = np.clip(np.maximum(-lum, 0) * 0.11 + dark * 0.22, 0, 1)
l = np.clip(np.maximum(lum, 0) * 0.18 + light * 0.42, 0, 1)
A = d + l * (1 - d)
col_d = np.array([120, 98, 68], np.float32)
col_l = np.array([255, 253, 246], np.float32)
rgb = (col_d * d[..., None] + col_l * (l * (1 - d))[..., None]) / np.maximum(A[..., None], 1e-4)
img = Image.fromarray(np.dstack([rgb, A * 255]).clip(0, 255).astype(np.uint8), 'RGBA')

# 배경색별 불투명 타일로 저장 (알파 노이즈보다 훨씬 가볍다)
out_dir = sys.argv[1]
for name, color in (('hanji', (245, 239, 226)), ('hanji-ivory', (251, 248, 240))):
    bg = Image.new('RGBA', (N, N), color + (255,))
    bg.alpha_composite(img)
    bg.convert('RGB').save(f'{out_dir}/{name}.webp', 'WEBP', quality=90, method=6)
    if len(sys.argv) > 2:
        prev = Image.new('RGB', (N * 2, N * 2))
        for i in range(2):
            for j in range(2):
                prev.paste(bg.convert('RGB'), (i * N, j * N))
        prev.save(f'{sys.argv[2]}/{name}_prev.png')
