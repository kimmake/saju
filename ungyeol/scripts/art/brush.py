"""담채(淡彩) 붓 그림 도구: 먹선(굵기·마른 붓 변화)과 번지는 담묵·옅은 채색 면.
같은 도구로 그린 그림(십이지, 등불, 서책, 해)은 같은 그림체를 공유한다."""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from inklib import fbm, grid_noise, blur, over

INK = (37, 35, 31)


def catmull(pts, n=12, closed=False):
    """점들을 부드러운 곡선으로 잇는다."""
    P = [np.array(p, np.float32) for p in pts]
    if closed: P = [P[-1]] + P + [P[0], P[1]]
    else: P = [P[0]] + P + [P[-1]]
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for t in np.linspace(0, 1, n, endpoint=False):
            t2, t3 = t * t, t * t * t
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    if not closed: out.append(P[-2])
    return [tuple(p) for p in out]


def resample(P, step=0.6):
    """경로를 일정 간격(px)으로 다시 찍는다."""
    P = np.array(P, np.float32)
    if len(P) < 2: return [tuple(p) for p in P]
    seg = np.hypot(*np.diff(P, axis=0).T); L = np.concatenate([[0], np.cumsum(seg)])
    if L[-1] == 0: return [tuple(P[0])]
    s = np.arange(0, L[-1], step)
    return list(zip(np.interp(s, L, P[:, 0]), np.interp(s, L, P[:, 1])))


def ellipse(cx, cy, rx, ry, rot=0.0, n=40):
    t = np.linspace(0, 2 * np.pi, n, endpoint=False); c, s = np.cos(np.deg2rad(rot)), np.sin(np.deg2rad(rot))
    return [(cx + rx * np.cos(a) * c - ry * np.sin(a) * s, cy + rx * np.cos(a) * s + ry * np.sin(a) * c) for a in t]


class Canvas:
    def __init__(self, w, h, seed=1, ss=3):
        self.w, self.h, self.ss = w, h, ss
        self.rng = np.random.default_rng(seed)
        self.layers = []  # (색, 알파)

    def _mask(self):
        return Image.new('L', (self.w * self.ss, self.h * self.ss), 0)

    def _down(self, im, r=0.6):
        return np.asarray(im.filter(ImageFilter.GaussianBlur(r * self.ss)).resize((self.w, self.h), Image.LANCZOS), np.float32) / 255

    def wash(self, poly, color, alpha=0.5, smooth=True, bleed=2.0, edge=0.35, grain=0.35):
        """번지는 면: 가장자리가 살짝 진하고(물 자국) 속은 고르지 않다."""
        pts = catmull(poly, 8, closed=True) if smooth else poly
        m = self._mask(); ImageDraw.Draw(m).polygon([(x * self.ss, y * self.ss) for x, y in pts], fill=255)
        a = self._down(m, 0.4)
        # 번짐: 경계를 노이즈로 흔든다
        n = fbm(self.h, self.w, [24, 9, 4], self.rng)
        a = np.clip(blur(a, bleed) * 1.15 + (n - 0.5) * 0.35 * (blur(a, bleed * 2) - blur(a, bleed * 2) ** 2) * 4, 0, 1)
        ring = np.clip(a - blur(a, 3.5), 0, 1) * 2.2          # 물 자국
        gran = fbm(self.h, self.w, [40, 14, 5], self.rng) * 0.7 + grid_noise(self.h, self.w, 2, self.rng) * 0.3   # 안료 입자
        body = a * (1 - grain + grain * 1.6 * (gran - 0.2))
        self.layers.append((color, np.clip((body + ring * edge) * alpha, 0, 1)))
        return self

    def line(self, pts, w0=4.0, w1=1.2, color=INK, alpha=0.92, smooth=True, dry=0.25, press=None):
        """먹선: 붓을 눌렀다 떼며 굵기가 변하고, 끝으로 갈수록 마른 붓 자국."""
        P = catmull(pts, 14) if smooth and len(pts) > 2 else pts
        P = resample(P, 0.6)
        m = self._mask(); d = ImageDraw.Draw(m); n = len(P)
        for i, (x, y) in enumerate(P):
            t = i / max(1, n - 1)
            w = (w0 + (w1 - w0) * t) if press is None else press(t)
            w *= 1 + 0.12 * np.sin(t * 11 + self.rng.random() * 6)
            r = max(0.35, w / 2) * self.ss
            if dry and t > 1 - dry and self.rng.random() < (t - (1 - dry)) / dry * 0.55: continue
            d.ellipse([x * self.ss - r, y * self.ss - r, x * self.ss + r, y * self.ss + r], fill=255)
        a = self._down(m, 0.5)
        a *= np.clip(0.75 + 0.45 * grid_noise(self.h, self.w, 3, self.rng), 0, 1)
        self.layers.append((color, np.clip(a * alpha, 0, 1)))
        return self

    def dots(self, pts, r=2.5, color=INK, alpha=0.95):
        m = self._mask(); d = ImageDraw.Draw(m)
        for x, y in pts:
            rr = r * self.ss * (0.8 + 0.4 * self.rng.random())
            d.ellipse([x * self.ss - rr, y * self.ss - rr, x * self.ss + rr, y * self.ss + rr], fill=255)
        self.layers.append((color, np.clip(self._down(m, 0.4) * alpha, 0, 1)))
        return self

    def hatch(self, poly, n=30, length=(6, 14), angle=-70, w=1.2, color=INK, alpha=0.55):
        """털·비늘 같은 짧은 결."""
        xs = [p[0] for p in poly]; ys = [p[1] for p in poly]
        m = self._mask(); ImageDraw.Draw(m).polygon([(x * self.ss, y * self.ss) for x, y in catmull(poly, 6, True)], fill=255)
        inside = np.asarray(m.resize((self.w, self.h)), np.uint8) > 128
        lm = self._mask(); d = ImageDraw.Draw(lm); k = 0; tries = 0
        while k < n and tries < n * 20:
            tries += 1
            x, y = self.rng.uniform(min(xs), max(xs)), self.rng.uniform(min(ys), max(ys))
            if not inside[int(np.clip(y, 0, self.h - 1)), int(np.clip(x, 0, self.w - 1))]: continue
            L = self.rng.uniform(*length); an = np.deg2rad(angle + self.rng.normal(0, 12))
            d.line([(x * self.ss, y * self.ss), ((x + np.cos(an) * L) * self.ss, (y + np.sin(an) * L) * self.ss)], fill=255, width=max(1, int(w * self.ss)))
            k += 1
        self.layers.append((color, np.clip(self._down(lm, 0.5) * alpha, 0, 1)))
        return self

    def image(self):
        return over(self.layers, self.h, self.w)


def save(img, path, q=86, pad=12, trim=True):
    """투명한 여백을 잘라 내고 저장한다."""
    if trim:
        bb = img.getchannel('A').point(lambda v: 255 if v > 6 else 0).getbbox()
        if bb: img = img.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(img.width, bb[2] + pad), min(img.height, bb[3] + pad)))
    img.save(path, 'WEBP', quality=q, method=6)
