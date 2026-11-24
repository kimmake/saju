"""수묵 산수 에셋: 산 덩어리(윤곽 먹선 + 담묵 + 준법 질감 + 안개), 소나무, 미점, 홍운탁월 달.
사용: python3 landscape.py <출력 폴더>"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from inklib import grid_noise, fbm, fbm1d, blur, over, save_webp

NEAR = (37, 35, 31)      # 농묵
MID = (62, 62, 60)
FAR = (96, 101, 104)     # 담묵 (푸른 회색)


def streak_field(h, w, rng, sx=2, sy=20):
    """세로로 긴 붓 결(피마준) 노이즈 격자. sample()로 비스듬히 읽는다."""
    gh, gw = int(h / sy) + 6, int(w / sx) + 6
    g = rng.random((gh, gw)).astype(np.float32)
    big = np.asarray(Image.fromarray(g, 'F').resize((int(gw * sx), int(gh * sy)), Image.BICUBIC))
    return big


def sample(field, X, Y):
    """field를 (X, Y) 실수 좌표에서 쌍선형 보간으로 읽는다 (경계는 감싼다)."""
    H, W = field.shape
    x0 = np.floor(X).astype(int); y0 = np.floor(Y).astype(int)
    fx = X - x0; fy = Y - y0
    x0 %= W; y0 %= H; x1 = (x0 + 1) % W; y1 = (y0 + 1) % H
    return (field[y0, x0] * (1 - fx) * (1 - fy) + field[y0, x1] * fx * (1 - fy)
            + field[y1, x0] * (1 - fx) * fy + field[y1, x1] * fx * fy)


def ridge_line(W, rng, base, peaks, detail):
    """둥근 봉우리 + 오목한 비탈. peaks: (중심 x, 높이, 왼쪽 폭, 오른쪽 폭, 비탈 오목도)."""
    x = np.arange(W, dtype=np.float32)
    r = np.full(W, base, np.float32)
    for cx, h, wl, wr, p in peaks:
        d = np.clip(np.where(x < cx, (cx - x) / wl, (x - cx) / wr), 0, 1)
        shape = (1 - d ** 1.25) ** (1.3 * p)         # 정상은 살짝 둥글고 비탈은 오목
        # 비탈 중간의 작은 어깨(층)
        shape += 0.06 * np.sin(d * np.pi * rng.uniform(2, 4)) * (1 - d)
        r = np.minimum(r, base - h * np.clip(shape, 0, 1))
    hmax = max(pk[1] for pk in peaks)
    hgt = np.clip((base - r) / hmax, 0, 1)
    n = fbm1d(W, [140, 60, 26, 11, 5], rng, gain=0.6)
    r += n * detail * 1.35 * (0.55 + 0.45 * hgt)
    return r


def mass(W, H, rng, ridge, *, edge=3.5, edge_k=0.95, fade=90, wash=0.55, tex=0.6, mist_y=None, mist_len=120, field=None):
    """산 덩어리 하나의 먹 농도(alpha)와 가림 마스크."""
    Y = np.arange(H, dtype=np.float32)[:, None]
    X = np.arange(W, dtype=np.float32)[None, :]
    d = Y - ridge[None, :]
    inside = d > 0
    dd = np.maximum(d, 0)
    # 윤곽선: 굵기와 농도가 붓처럼 변하고 가끔 끊긴다
    var = fbm1d(W, [90, 30, 10], rng) * 0.5 + 0.5
    ew = edge * (0.4 + 1.2 * var)[None, :]
    press = np.clip(0.25 + 1.1 * (fbm1d(W, [120, 40], rng) * 0.5 + 0.5), 0, 1)[None, :]
    contour = np.exp(-dd / ew) * inside * edge_k * press
    # 담묵: 능선에서 아래로 옅어진다
    fw = fade * (0.5 + 1.0 * (fbm1d(W, [110, 35], rng) * 0.5 + 0.5))[None, :]
    body = np.exp(-dd / fw) * inside
    # 준법: 비탈 방향으로 비스듬히 흐르는 결
    sl = np.gradient(blur(ridge[None, :].repeat(3, 0), 6)[1])
    dirx = np.clip(sl * 0.7, -1.2, 1.2)[None, :]
    field = field if field is not None else streak_field(H + 200, W + 400, rng)
    st = sample(field, X - dd * dirx + 200, Y)
    cun = np.clip((st - 0.45) * 2.0, 0, 1) * np.clip((grid_noise(H, W, 14, rng) - 0.3) * 2.5, 0, 1)
    cloud = fbm(H, W, [80, 30, 10], rng)
    a = contour + body * wash * (1 - tex + tex * (0.75 * cloud + 0.7 * cun))
    a *= np.clip(0.7 + 0.55 * grid_noise(H, W, 4, rng), 0, 1)     # 마른 붓 끊김
    if mist_y is not None:
        mist = mist_y + fbm1d(W, [160, 60], rng) * mist_len * 0.8
        a *= np.clip((mist[None, :] - Y) / mist_len, 0, 1) ** 1.2
    a = np.clip(a, 0, 1)
    a = 0.72 * a + 0.28 * blur(a, 1.3)          # 먹 번짐
    occ = blur(inside.astype(np.float32), 1.0)
    return a, occ


def compose(W, H, masses):
    """masses: (색, alpha, occ) 를 먼 것부터. 가까운 덩어리가 먼 덩어리를 가린다."""
    layers = []
    for i, (col, a, occ) in enumerate(masses):
        for j in range(len(layers)):
            c0, a0 = layers[j]
            layers[j] = (c0, a0 * (1 - occ))
        layers.append((col, a))
    return over(layers, H, W)


def dots(draw, rng, ridge, xs, ss, n=18, spread=10, size=(1.4, 3.2), val=210):
    """능선을 따라 찍는 미점(米點) — 먼 숲."""
    for x0 in xs:
        for _ in range(n):
            x = x0 + rng.normal(0, spread)
            xi = int(np.clip(x, 0, len(ridge) - 1))
            y = ridge[xi] + rng.uniform(-1, 5)
            rw = rng.uniform(*size) * 0.55 * ss
            rh = rng.uniform(*size) * 1.15 * ss
            draw.ellipse([x * ss - rw, y * ss - rh, x * ss + rw, y * ss + rh], fill=int(val * rng.uniform(0.6, 1)))


def pine(draw, rng, x0, y0, h, ss, lean=0.0, val=235):
    """소나무: 굽은 줄기 + 옆으로 넓게 퍼진 솔잎 판."""
    pts = [(x0, y0)]
    x, y = x0, y0
    ang = -np.pi / 2 + lean
    steps = 28
    for i in range(steps):
        ang += rng.normal(0, 0.16) - (ang + np.pi / 2 - lean) * 0.12
        x += np.cos(ang) * h / steps
        y += np.sin(ang) * h / steps
        pts.append((x, y))
    k = h / 90
    for i in range(steps):
        wdt = max(1, int((4.2 - 3.0 * i / steps) * ss * k))
        (ax, ay), (bx, by) = pts[i], pts[i + 1]
        draw.line([(ax * ss, ay * ss), (bx * ss, by * ss)], fill=val, width=wdt)
    nplates = int(rng.integers(3, 5))
    for j in range(nplates):
        t = 0.45 + 0.55 * j / max(1, nplates - 1)
        px, py = pts[min(steps, int(t * steps))]
        side = (-1) ** (j + int(rng.integers(0, 2))) if j < nplates - 1 else 0
        pw = h * (0.78 - 0.4 * t) * rng.uniform(0.85, 1.2)
        cx = px + side * pw * 0.45
        cy = py - rng.uniform(0, 4) * k
        if side:
            mx = (px + cx) / 2
            draw.line([(px * ss, py * ss), (mx * ss, (py - 3 * k) * ss), (cx * ss, cy * ss)], fill=val, width=max(1, int(1.8 * ss * k)))
        # 솔잎: 판 아래쪽은 짙고 위쪽은 성글게
        for _ in range(int(pw * 11)):
            u = rng.uniform(-0.5, 0.5)
            nx = cx + u * pw
            top = (0.25 - u * u) * h * 0.16
            ny = cy - rng.uniform(0, 1) ** 1.6 * top + rng.normal(0, 0.8 * k)
            ln = rng.uniform(2.5, 5.5) * k
            a0 = -np.pi / 2 + rng.normal(0, 0.9)
            draw.line([(nx * ss, ny * ss), ((nx + np.cos(a0) * ln) * ss, (ny + np.sin(a0) * ln) * ss)],
                      fill=int(val * rng.uniform(0.7, 1)), width=max(1, int(0.9 * ss)))


def overlay_strokes(W, H, ss, fn, blur_r=0.6):
    can = Image.new('L', (W * ss, H * ss), 0)
    fn(ImageDraw.Draw(can))
    can = can.filter(ImageFilter.GaussianBlur(blur_r * ss)).resize((W, H), Image.LANCZOS)
    return np.asarray(can, np.float32) / 255


def edge_fade(W, H, left=0, right=0, top=0, bottom=0):
    x = np.arange(W, dtype=np.float32)[None, :]
    y = np.arange(H, dtype=np.float32)[:, None]
    m = np.ones((H, W), np.float32)
    def ramp(v, n):
        return np.clip(v / n, 0, 1) ** 1.4 if n else 1
    m = m * ramp(x, left) * ramp(W - 1 - x, right) * ramp(y, top) * ramp(H - 1 - y, bottom)
    return m


def apply_fade(img, m):
    a = np.asarray(img, np.float32).copy()
    a[..., 3] *= m
    return Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')


def mountains_left(out):
    """왼쪽 아래: 가까운 바위산과 소나무, 뒤로 물러나는 먼 산."""
    W, H = 1400, 900
    rng = np.random.default_rng(5)
    fld = streak_field(H + 200, W + 400, rng)
    r0 = ridge_line(W, rng, 700, [(430, 470, 300, 380, 1.0), (760, 330, 240, 330, 0.9), (1010, 200, 220, 300, 0.9)], 34)
    r1 = ridge_line(W, rng, 800, [(170, 520, 240, 250, 1.1), (330, 380, 140, 200, 1.0), (620, 250, 230, 260, 0.9)], 40)
    r2 = ridge_line(W, rng, 860, [(40, 420, 180, 240, 0.85), (470, 200, 190, 260, 0.85), (760, 120, 220, 300, 0.8)], 30)
    r3 = ridge_line(W, rng, 940, [(-30, 430, 160, 330, 0.75), (250, 260, 150, 200, 0.95), (560, 110, 200, 300, 0.8)], 26)
    m0 = mass(W, H, rng, r0, edge=2.2, edge_k=0.45, fade=55, wash=0.30, mist_y=640, mist_len=200, field=fld)
    m1 = mass(W, H, rng, r1, edge=2.8, edge_k=0.62, fade=65, wash=0.40, mist_y=740, mist_len=200, field=fld)
    m2 = mass(W, H, rng, r2, edge=3.4, edge_k=0.82, fade=80, wash=0.52, mist_y=830, mist_len=200, field=fld)
    m3 = mass(W, H, rng, r3, edge=4.4, edge_k=1.0, fade=110, wash=0.62, mist_y=960, mist_len=240, field=fld)
    ss = 3
    def trees(dw):
        dots(dw, rng, r1, [300, 345, 560, 600], ss, n=20, spread=14, val=150)
        dots(dw, rng, r0, [620, 700, 900], ss, n=12, spread=12, size=(1.0, 2.0), val=110)
        dots(dw, rng, r2, [430, 480], ss, n=16, spread=12, val=190)
        for x0, hh, ln in [(122, 104, 0.2), (176, 74, -0.25), (238, 60, 0.3)]:
            pine(dw, rng, x0, r3[x0] + 8, hh, ss, lean=ln)
    t = overlay_strokes(W, H, ss, trees)
    img = compose(W, H, [(FAR, *m0), (FAR, *m1), (MID, *m2), (NEAR, *m3), (NEAR, t * 0.92, t * 0)])
    img = apply_fade(img, edge_fade(W, H, right=560, top=60, bottom=40))
    save_webp(img, f'{out}/mountains-left.webp', q=80)
    return img


def mountains_right(out):
    """오른쪽 위: 구름 위로 솟은 먼 봉우리 (옅게)."""
    W, H = 1200, 640
    rng = np.random.default_rng(23)
    fld = streak_field(H + 200, W + 400, rng)
    r1 = ridge_line(W, rng, 520, [(990, 420, 200, 170, 1.05), (770, 300, 170, 150, 0.95), (1160, 330, 150, 160, 1.0)], 30)
    r2 = ridge_line(W, rng, 600, [(880, 250, 150, 170, 0.9), (1090, 220, 140, 160, 0.9), (640, 150, 170, 170, 0.85)], 24)
    m1 = mass(W, H, rng, r1, edge=2.4, edge_k=0.5, fade=55, wash=0.34, mist_y=460, mist_len=200, field=fld)
    m2 = mass(W, H, rng, r2, edge=3.0, edge_k=0.7, fade=65, wash=0.46, mist_y=560, mist_len=190, field=fld)
    ss = 3
    t = overlay_strokes(W, H, ss, lambda dw: dots(dw, rng, r2, [840, 900, 1060], ss, n=16, spread=12, val=150))
    img = compose(W, H, [(FAR, *m1), (MID, *m2), (MID, t * 0.8, t * 0)])
    img = apply_fade(img, edge_fade(W, H, left=480, bottom=60, top=30))
    save_webp(img, f'{out}/mountains-right.webp', q=80)
    return img


def moon_panorama(out):
    """모바일·첫 화면용 띠 그림: 홍운탁월 달 + 낮은 산맥 + 소나무."""
    W, H = 1600, 760
    rng = np.random.default_rng(41)
    fld = streak_field(H + 200, W + 400, rng)
    # 홍운탁월: 달 둘레에 가로 붓질의 옅은 먹구름을 칠해 달을 드러낸다
    Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
    cx, cy, R = 1130, 230, 92
    r = np.hypot(X - cx, (Y - cy) * 1.35)
    wash = np.asarray(Image.fromarray(rng.random((H // 6 + 4, W // 40 + 4)).astype(np.float32), 'F')
                      .resize(((W // 40 + 4) * 40, (H // 6 + 4) * 6), Image.BICUBIC))[:H, :W]
    cloud = fbm(H, W, [140, 50, 18], rng)
    halo = np.exp(-np.maximum(r - R, 0) / 190) * (0.3 + 0.7 * cloud + 0.18 * (wash - 0.5))
    halo = np.clip(halo * 0.30 - 0.03, 0, 1)
    rm = np.hypot(X - cx, Y - cy)
    halo *= np.clip((rm - R) / 2.5, 0, 1)
    halo = blur(halo, 0.8)
    halo *= edge_fade(W, H, left=520, right=160, top=30, bottom=330)
    r_far = ridge_line(W, rng, 650, [(1300, 270, 250, 260, 0.95), (980, 170, 220, 240, 0.9), (580, 220, 260, 300, 0.95), (230, 150, 220, 240, 0.85)], 30)
    r_near = ridge_line(W, rng, 770, [(70, 430, 170, 270, 0.85), (340, 250, 170, 240, 0.95), (1510, 300, 200, 220, 0.9)], 28)
    m1 = mass(W, H, rng, r_far, edge=2.4, edge_k=0.5, fade=55, wash=0.34, mist_y=640, mist_len=200, field=fld)
    m2 = mass(W, H, rng, r_near, edge=4.2, edge_k=0.95, fade=100, wash=0.58, mist_y=800, mist_len=230, field=fld)
    ss = 3
    def trees(dw):
        dots(dw, rng, r_far, [540, 620, 1250, 1340], ss, n=16, spread=13, size=(1.0, 2.4), val=120)
        for x0, hh, ln in [(66, 118, 0.25), (122, 80, -0.2), (1488, 86, -0.25)]:
            pine(dw, rng, x0, r_near[x0] + 8, hh, ss, lean=ln)
    t = overlay_strokes(W, H, ss, trees)
    img = compose(W, H, [(FAR, halo, np.zeros_like(halo)), (FAR, *m1), (NEAR, *m2), (NEAR, t * 0.92, t * 0)])
    img = apply_fade(img, edge_fade(W, H, top=10, bottom=30))
    save_webp(img, f'{out}/moon-panorama.webp', q=80)
    return img


def enso(out):
    """원상(圓相): 한 번에 그은 붓 원. 굵게 눌러 시작해 마른 붓으로 끝난다."""
    S, ss = 640, 3
    rng = np.random.default_rng(8)
    can = Image.new('L', (S * ss, S * ss), 0)
    dw = ImageDraw.Draw(can)
    cx = cy = S / 2
    R = S * 0.37
    start, sweep = np.deg2rad(-96), np.deg2rad(328)
    n = 700
    wob = fbm1d(n, [200, 70], rng) * 0.03
    for b in range(150):
        o = rng.normal(0, 0.5)                      # 붓 폭 안에서의 위치 (−1..1 근처)
        ink = fbm1d(n, [90, 25, 8], rng) * 0.5 + 0.5
        jit = fbm1d(n, [50, 15], rng) * 0.08
        dry_at = rng.uniform(0.5, 1.0)
        prev = None
        for i in range(n):
            t = i / (n - 1)
            width = (30 - 22 * t ** 1.1) * (1 + 0.18 * np.sin(t * 7 + 1))
            rr = R * (1 + wob[i] + 0.035 * t) + (o + jit[i]) * width * 0.5
            th = start + sweep * t
            p = (cx + np.cos(th) * rr, cy + np.sin(th) * rr)
            dryness = max(0.0, t - dry_at) * 2.6 + max(0.0, abs(o) - 0.75) * 0.6
            gap = rng.random() < dryness * (1.2 - ink[i])
            if prev is not None and not gap:
                v = int(255 * np.clip(0.55 + 0.5 * ink[i] - 0.2 * t, 0, 1))
                dw.line([(prev[0] * ss, prev[1] * ss), (p[0] * ss, p[1] * ss)], fill=v, width=max(1, int(1.6 * ss)))
            prev = None if gap else p
    # 시작점: 붓을 누른 자리의 먹 고임
    th = start
    for _ in range(60):
        rr = R + rng.normal(0, 4)
        x, y = cx + np.cos(th + rng.normal(0, 0.03)) * rr, cy + np.sin(th + rng.normal(0, 0.03)) * rr
        r0 = rng.uniform(3, 7)
        dw.ellipse([(x - r0) * ss, (y - r0) * ss, (x + r0) * ss, (y + r0) * ss], fill=int(rng.uniform(170, 235)))
    a = np.asarray(can.filter(ImageFilter.GaussianBlur(1.1 * ss)).resize((S, S), Image.LANCZOS), np.float32) / 255
    a = np.clip(a * 1.15, 0, 1)
    a = 0.75 * a + 0.25 * blur(a, 2.0)
    img = over([(NEAR, a)], S, S)
    save_webp(img, f'{out}/enso.webp', q=84)
    return img


if __name__ == '__main__':
    out = sys.argv[1]
    prev = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else None
    for fn in [globals()[n] for n in (sys.argv[3].split(',') if len(sys.argv) > 3 else ['mountains_left', 'mountains_right', 'moon_panorama', 'enso'])]:
        img = fn(out)
        if prev:
            bg = Image.new('RGBA', img.size, (245, 239, 226, 255))
            bg.alpha_composite(img)
            bg.convert('RGB').save(f'{prev}/{fn.__name__}.png')
