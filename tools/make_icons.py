# Draws the home-screen icon (Adélka's head with helmet and bow) into docs/.
# Everything is drawn on a 100-unit square at 8x and scaled down for smooth edges.
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs')
os.makedirs(OUT, exist_ok=True)
SS = 8
U = 100 * SS


def u(v):
    return v * SS


def ell(d, cx, cy, rx, ry, fill):
    d.ellipse([u(cx - rx), u(cy - ry), u(cx + rx), u(cy + ry)], fill=fill)


def line(d, pts, fill, w):
    d.line([(u(x), u(y)) for x, y in pts], fill=fill, width=max(1, int(u(w))), joint='curve')


img = Image.new('RGBA', (U, U))
d = ImageDraw.Draw(img)
top, bot = (0x3b, 0x5a, 0x77), (0x2b, 0x45, 0x60)
for y in range(U):
    t = y / (U - 1)
    d.line([(0, y), (U, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bot)) + (255,))
for row in range(9):
    for col in range(9):
        ell(d, 6 + col * 11 + (5.5 if row % 2 else 0), 6 + row * 11, 0.8, 0.8, (12, 22, 34, 60))

# shoulders and head
ell(d, 50, 104, 34, 22, (0x8f, 0x9c, 0xa8, 255))
ell(d, 50, 60, 30, 29, (0x9a, 0xa7, 0xb3, 255))
ell(d, 31, 71, 5, 4, (0xff, 0x9f, 0xb8, 170))
ell(d, 69, 71, 5, 4, (0xff, 0x9f, 0xb8, 170))
ell(d, 50, 73, 15, 11, (0xc8, 0xd0, 0xd7, 255))
for s in (-1, 1):
    for dy in (-5, 0, 5):
        line(d, [(50 + s * 11, 73 + dy * 0.3), (50 + s * 33, 70 + dy)], (246, 248, 250, 230), 0.9)
ell(d, 50, 67, 6, 4.3, (0x2a, 0x2f, 0x36, 255))
d.arc([u(43.5), u(69), u(50), u(75.5)], 10, 170, fill=(0x2a, 0x2f, 0x36, 255), width=int(u(1.6)))
d.arc([u(50), u(69), u(56.5), u(75.5)], 10, 170, fill=(0x2a, 0x2f, 0x36, 255), width=int(u(1.6)))

# eyes with lashes
for s in (-1, 1):
    ex, ey = 50 + s * 12, 56
    ell(d, ex, ey, 5.6, 5.6, (0x1b, 0x1f, 0x24, 255))
    ell(d, ex + 1.8, ey - 2, 1.9, 1.9, (255, 255, 255, 255))
    line(d, [(ex + s * 4.8, ey - 3.6), (ex + s * 9, ey - 7.8)], (0x1b, 0x1f, 0x24, 255), 1.6)
    line(d, [(ex + s * 6, ey - 0.8), (ex + s * 10.5, ey - 3)], (0x1b, 0x1f, 0x24, 255), 1.6)

# helmet with strap, brim and highlight
for s in (-1, 1):
    line(d, [(50 + s * 24, 46), (50 + s * 19, 79)], (0x2a, 0x2f, 0x36, 255), 1.5)
d.pieslice([u(20), u(20), u(80), u(70)], 180, 360, fill=(0xe6, 0x39, 0x46, 255))
d.rounded_rectangle([u(18), u(42), u(82), u(49)], radius=u(3.4), fill=(0xc2, 0x2d, 0x38, 255))
ell(d, 38, 31, 7, 3.2, (255, 255, 255, 75))

# bow
pink, knot = (0xff, 0x5f, 0xa2, 255), (0xd9, 0x45, 0x85, 255)
d.polygon([(u(70), u(27)), (u(58), u(17)), (u(60), u(35))], fill=pink)
d.polygon([(u(70), u(27)), (u(82), u(17)), (u(80), u(35))], fill=pink)
ell(d, 70, 27, 3.8, 3.8, knot)

for size, name in ((180, 'apple-touch-icon.png'), (192, 'icon-192.png'), (512, 'icon-512.png')):
    img.resize((size, size), Image.LANCZOS).convert('RGB').save(os.path.join(OUT, name), optimize=True)
print('icons written')
