"""직접 그린 담채 삽화: 붉은 해, 낙관 질감, 청사초롱, 서책과 붓.
사용: python3 illust.py <출력 폴더> [미리보기 폴더]"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from inklib import fbm, grid_noise, blur, over
from brush import Canvas, catmull, ellipse, save, INK

RED = (176, 64, 48); VERMILION = (190, 82, 52); NAVY = (32, 58, 96); BLUE = (52, 92, 140)
GOLD = (196, 150, 70); WOOD = (128, 92, 56); PAPER_LIGHT = (240, 226, 196)


def sun(out):
    """붉은 해: 종이에 스민 주색 담채. 가장자리가 고르지 않고 속이 얼룩진다."""
    S = 420; rng = np.random.default_rng(7)
    Y, X = np.mgrid[0:S, 0:S].astype(np.float32)
    r = np.hypot(X - S / 2, Y - S / 2) / (S * 0.36)
    edge = (fbm(S, S, [60, 20], rng) - 0.5) * 0.08
    disc = np.clip((1 - r + edge) / 0.04, 0, 1)
    body = disc * (0.55 + 0.35 * fbm(S, S, [90, 30, 10], rng)) + np.clip(disc - blur(disc, 6), 0, 1) * 0.4
    halo = np.clip(1.25 - r, 0, 1) ** 2 * 0.12 * (1 - disc)
    a = np.clip(body * 0.92 + halo, 0, 1)
    save(over([((178, 58, 42), a)], S, S), f'{out}/sun.webp')


def seal_texture(out):
    """낙관 인주 질감(흰 = 찍힘). CSS mask로 써서 낙관 가장자리와 속을 닳은 듯 만든다."""
    S = 240; rng = np.random.default_rng(3)
    Y, X = np.mgrid[0:S, 0:S].astype(np.float32)
    n = fbm(S, S, [30, 10, 4], rng)
    edge = np.minimum.reduce([X, Y, S - 1 - X, S - 1 - Y]) / S
    keep = np.clip((edge + (n - 0.5) * 0.06) / 0.035, 0, 1)
    speck = np.clip((grid_noise(S, S, 2, rng) - 0.86) * 8, 0, 1)
    a = np.clip(keep * (0.82 + 0.18 * n) - speck * 0.8, 0, 1)
    Image.fromarray((a * 255).astype(np.uint8), 'L').convert('RGBA').save(f'{out}/seal-texture.png')
    im = Image.fromarray(np.dstack([np.full((S, S, 3), 255, np.uint8), (a * 255).astype(np.uint8)]), 'RGBA')
    im.save(f'{out}/seal-texture.png')


def lantern(out):
    """청사초롱: 붉은 몸통, 위·아래 푸른 단, 안에서 번지는 불빛, 손잡이와 술."""
    c = Canvas(420, 640, seed=11)
    # 불빛 (몸통 안 따뜻한 노랑)
    c.wash(ellipse(210, 345, 82, 120), (236, 176, 84), alpha=0.55, bleed=6, edge=0.1)
    # 몸통 (붉은 비단)
    body = [(132, 228), (210, 214), (288, 228), (300, 345), (288, 462), (210, 476), (132, 462), (120, 345)]
    c.wash(body, RED, alpha=0.62, bleed=1.6, edge=0.45)
    c.wash(ellipse(210, 345, 60, 96), (240, 190, 110), alpha=0.45, bleed=8, edge=0.0)
    # 위·아래 푸른 단
    c.wash([(124, 188), (296, 188), (300, 232), (120, 232)], BLUE, alpha=0.72, smooth=False, bleed=1.2)
    c.wash([(120, 458), (300, 458), (294, 500), (126, 500)], BLUE, alpha=0.72, smooth=False, bleed=1.2)
    # 뼈대 (먹선)
    for x0, x1 in ((132, 120), (171, 165), (210, 210), (249, 255), (288, 300)):
        c.line([(x0, 232), (x1 if x0 != 210 else 210, 345), (x0, 458)], w0=1.6, w1=1.2, alpha=0.55, dry=0)
    c.line([(120, 188), (300, 188)], w0=2.2, w1=2.0, dry=0); c.line([(120, 232), (300, 232)], w0=1.6, w1=1.6, dry=0, alpha=0.7)
    c.line([(120, 458), (300, 458)], w0=1.6, w1=1.6, dry=0, alpha=0.7); c.line([(126, 500), (294, 500)], w0=2.2, w1=2.0, dry=0)
    # 꼭지와 손잡이
    c.wash([(186, 166), (234, 166), (240, 188), (180, 188)], GOLD, alpha=0.7, smooth=False)
    c.line([(210, 166), (210, 92)], w0=2.0, w1=1.6, dry=0)
    c.line([(60, 96), (150, 82), (250, 80), (370, 92)], w0=7, w1=4, color=WOOD, alpha=0.9, dry=0.15)
    c.line([(60, 96), (150, 82), (250, 80), (370, 92)], w0=1.4, w1=1.0, alpha=0.6, dry=0.3)
    # 술 (붉은 실)
    c.wash([(196, 500), (224, 500), (218, 516), (202, 516)], GOLD, alpha=0.8, smooth=False)
    for dx in range(-14, 16, 4):
        c.line([(210 + dx * 0.3, 516), (210 + dx * 0.8, 560), (210 + dx * 1.1, 598)], w0=2.2, w1=1.0, color=RED, alpha=0.85, dry=0.3)
    save(c.image(), f'{out}/lantern.webp')


def book(c, x, y, w, h, dx=70, dy=42, cover=NAVY, label=True):
    """사선 투상으로 그린 닫힌 책 한 권: 윗면(표지), 앞면(책장 단면), 왼쪽(책등)."""
    top = [(x, y), (x + w, y), (x + w + dx, y - dy), (x + dx, y - dy)]
    front = [(x, y), (x + w, y), (x + w, y + h), (x, y + h)]
    spine = [(x, y), (x + dx * 0, y), (x, y + h), (x, y + h)]
    c.wash(front, PAPER_LIGHT, alpha=0.9, smooth=False, bleed=0.6, edge=0.2)
    for k in range(1, 6):
        yy = y + h * k / 6; c.line([(x + 4, yy), (x + w - 4, yy)], w0=0.6, w1=0.6, alpha=0.28, dry=0, smooth=False)
    c.wash([(x, y), (x + w, y), (x + w, y + 4), (x, y + 4)], cover, alpha=0.9, smooth=False, bleed=0.4)
    c.wash([(x, y + h - 4), (x + w, y + h - 4), (x + w, y + h), (x, y + h)], cover, alpha=0.9, smooth=False, bleed=0.4)
    c.wash(top, cover, alpha=0.84, smooth=False, bleed=1.0, edge=0.45)
    if label:  # 제첨: 빈 제목 띠
        lx, ly = x + 26, y - 6
        c.wash([(lx, ly), (lx + 34, ly), (lx + 34 + dx * 0.7, ly - dy * 0.7), (lx + dx * 0.7, ly - dy * 0.7)], (238, 228, 204), alpha=0.95, smooth=False, bleed=0.5, edge=0.15)
    # 오침 제본 실: 책등(왼쪽) 가까이 다섯 땀
    for k in range(5):
        t = 0.1 + k * 0.2; px, py = x + dx * t + 10, y - dy * t
        c.line([(px - 10, py), (px + 2, py)], w0=1.5, w1=1.5, color=(222, 204, 160), alpha=0.95, dry=0, smooth=False)
    c.line([(x + dx * 0 + 12, y), (x + dx + 12, y - dy)], w0=0.8, w1=0.8, alpha=0.4, dry=0, smooth=False)
    c.line(top + [top[0]], w0=1.6, w1=1.4, smooth=False, dry=0, alpha=0.8)
    c.line([(x, y), (x, y + h), (x + w, y + h), (x + w, y), (x + w + dx, y - dy), (x + w + dx, y - dy + h), (x + w, y + h)], w0=1.5, w1=1.3, smooth=False, dry=0, alpha=0.75)
    c.wash([(x + w, y), (x + w + dx, y - dy), (x + w + dx, y - dy + h), (x + w, y + h)], PAPER_LIGHT, alpha=0.75, smooth=False, bleed=0.5, edge=0.1)


def books(out):
    """서책과 붓: 오침 제본한 남색 표지 책 두 권과 그 위에 비스듬히 놓인 붓."""
    c = Canvas(640, 440, seed=5)
    book(c, 90, 318, 380, 34, label=False)
    book(c, 112, 276, 350, 32, cover=(40, 70, 112))
    # 붓: 대나무 자루 + 먹 묻은 털, 책 윗면 위에 비스듬히
    x0, y0, x1, y1 = 196, 248, 520, 150
    nx, ny = 0.29, 0.96  # 자루 두께 방향
    c.wash([(x0, y0), (x1, y1), (x1 + nx * 12, y1 + ny * 12), (x0 + nx * 12, y0 + ny * 12)], (200, 164, 106), alpha=0.9, smooth=False, bleed=0.6)
    for t in (0.3, 0.55, 0.8):
        px, py = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        c.line([(px, py), (px + nx * 12, py + ny * 12)], w0=1.6, w1=1.6, alpha=0.55, dry=0, smooth=False)
    c.line([(x0, y0), (x1, y1)], w0=1.3, w1=1.2, dry=0, alpha=0.75, smooth=False)
    c.line([(x0 + nx * 12, y0 + ny * 12), (x1 + nx * 12, y1 + ny * 12)], w0=1.3, w1=1.2, dry=0, alpha=0.75, smooth=False)
    c.wash([(x0 + 2, y0 + 1), (x0 + nx * 12 + 2, y0 + ny * 12), (x0 - 40, y0 + 26), (x0 - 92, y0 + 44), (x0 - 46, y0 + 20)], INK, alpha=0.95, bleed=0.7)
    c.line([(x1 + 6, y1 + 4), (x1 + 26, y1 - 4)], w0=1.6, w1=1.2, color=RED, alpha=0.85, dry=0)
    save(c.image(), f'{out}/books-brush.webp')


if __name__ == '__main__':
    out = sys.argv[1]; prev = sys.argv[2] if len(sys.argv) > 2 else None
    names = sys.argv[3].split(',') if len(sys.argv) > 3 else ['sun', 'seal_texture', 'lantern', 'books']
    for n in names: globals()[n](out)
    if prev:
        ims = []
        for f in ['sun.webp', 'lantern.webp', 'books-brush.webp']:
            im = Image.open(f'{out}/{f}'); bg = Image.new('RGBA', im.size, (245, 239, 226, 255)); bg.alpha_composite(im); bg.thumbnail((420, 520)); ims.append(bg.convert('RGB'))
        sheet = Image.new('RGB', (sum(i.width for i in ims) + 20, 520), (245, 239, 226)); x = 0
        for i in ims: sheet.paste(i, (x, 0)); x += i.width + 10
        sheet.save(f'{prev}/illust_sheet.png')
