"""수묵·한지 에셋 생성용 공용 함수 (numpy + Pillow)."""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

INK = np.array([37, 35, 31], np.float32)       # 먹색 #25231F


def grid_noise(h, w, scale, rng, wrap=False):
    """값 노이즈 한 옥타브. wrap=True면 (h, w)가 scale의 배수일 때 이음새 없이 반복된다."""
    gh, gw = int(np.ceil(h / scale)), int(np.ceil(w / scale))
    g = rng.random((gh, gw)).astype(np.float32)
    pad = 2
    g = np.pad(g, pad, mode='wrap' if wrap else 'reflect')
    s = int(scale)
    im = Image.fromarray(g, 'F').resize(((gw + 2 * pad) * s, (gh + 2 * pad) * s), Image.BICUBIC)
    a = np.asarray(im)[pad * s: pad * s + h, pad * s: pad * s + w]
    return a


def fbm(h, w, scales, rng, wrap=False, gain=0.55):
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for s in scales:
        out += amp * grid_noise(h, w, s, rng, wrap)
        tot += amp
        amp *= gain
    return out / tot


def fbm1d(n, scales, rng, gain=0.55):
    x = np.arange(n, dtype=np.float32)
    out = np.zeros(n, np.float32)
    amp, tot = 1.0, 0.0
    for s in scales:
        k = int(n / s) + 3
        pts = rng.random(k).astype(np.float32) * 2 - 1
        xp = np.arange(k) * s - s
        # 코사인 보간
        idx = np.clip(((x + s) // s).astype(int), 0, k - 2)
        t = ((x + s) - idx * s) / s
        t = (1 - np.cos(t * np.pi)) / 2
        out += amp * (pts[idx] * (1 - t) + pts[idx + 1] * t)
        tot += amp
        amp *= gain
    return out / tot


def _box(a, k, axis):
    """반경 k 박스 블러 (가장자리 복제)."""
    pad = [(0, 0)] * a.ndim
    pad[axis] = (k + 1, k)
    p = np.pad(a, pad, mode='edge')
    c = np.cumsum(p, axis=axis, dtype=np.float64)
    hi = np.take(c, np.arange(2 * k + 1, c.shape[axis]), axis=axis)
    lo = np.take(c, np.arange(0, c.shape[axis] - 2 * k - 1), axis=axis)
    return ((hi - lo) / (2 * k + 1)).astype(np.float32)


def blur(a, r):
    """가우시안 근사(박스 블러 3회)."""
    if r <= 0:
        return a.astype(np.float32)
    k = max(1, int(round(np.sqrt(12 * r * r / 3 + 1) - 1) // 2))
    out = a.astype(np.float32)
    for _ in range(3):
        out = _box(_box(out, k, 0), k, 1)
    return out


def over(layers, h, w):
    """(색 RGB, 알파 HxW) 레이어를 뒤에서 앞으로 합성해 RGBA uint8을 만든다."""
    C = np.zeros((h, w, 3), np.float32)
    A = np.zeros((h, w), np.float32)
    for col, a in layers:
        a = np.clip(a, 0, 1)
        C = np.asarray(col, np.float32)[None, None, :] * a[..., None] + C * (1 - a[..., None])
        A = a + A * (1 - a)
    rgb = np.where(A[..., None] > 1e-4, C / np.maximum(A[..., None], 1e-4), 0)
    out = np.dstack([rgb, A * 255]).clip(0, 255).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


def save_webp(img, path, q=82):
    img.save(path, 'WEBP', quality=q, method=6)
