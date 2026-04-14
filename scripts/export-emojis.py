#!/usr/bin/env python3
"""
Export RDNA-recolored pixel emoji SVGs with proper emoji names.

Outputs two directories:
  unicode/  — named by codepoint (e.g. 1f600.svg)
  named/    — named by CLDR short name (e.g. grinning-face.svg)
"""

import sys, os, math, shutil
from PIL import Image

# ── RDNA Palette ────────────────────────────────────────────────────────

RDNA_HEX = {
    "ink":         "#0f0e0c",
    "cream":       "#fef8e2",
    "pure-black":  "#000000",
    "sun-yellow":  "#fce184",
    "sky-blue":    "#95bad2",
    "sunset-fuzz": "#fcc383",
    "sun-red":     "#ff7f7f",
    "mint":        "#cef5ca",
    "pure-white":  "#ffffff",
}

RDNA_RGB = {
    "ink":         (15, 14, 12),
    "cream":       (254, 248, 226),
    "pure-black":  (0, 0, 0),
    "sun-yellow":  (252, 225, 132),
    "sky-blue":    (149, 186, 210),
    "sunset-fuzz": (252, 195, 131),
    "sun-red":     (255, 127, 127),
    "mint":        (206, 245, 202),
    "pure-white":  (255, 255, 255),
}


def srgb_to_lab(r, g, b):
    def linearize(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    rl, gl, bl = linearize(r), linearize(g), linearize(b)
    x = rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375
    y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750
    z = rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041
    xn, yn, zn = 0.95047, 1.00000, 1.08883
    def f(t):
        return t ** (1/3) if t > 0.008856 else 7.787 * t + 16 / 116
    fx, fy, fz = f(x / xn), f(y / yn), f(z / zn)
    return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))


RDNA_LAB = {name: srgb_to_lab(*rgb) for name, rgb in RDNA_RGB.items()}
_cache = {}

def nearest_rdna(rgb):
    if rgb in _cache:
        return _cache[rgb]
    lab = srgb_to_lab(*rgb)
    best = min(RDNA_LAB.items(), key=lambda kv: sum((a-b)**2 for a,b in zip(lab, kv[1])))
    result = RDNA_HEX[best[0]]
    _cache[rgb] = result
    return result


# ── Emoji Mapping ───────────────────────────────────────────────────────
# (unicode_codepoint, cldr_short_name)
# Sequential ordering matching the sprite sheet layout.

FACE_EMOJIS = [
    # Row 0 (16)
    ("1f600", "grinning-face"),
    ("1f603", "grinning-face-with-big-eyes"),
    ("1f604", "grinning-face-with-smiling-eyes"),
    ("1f601", "beaming-face-with-smiling-eyes"),
    ("1f606", "grinning-squinting-face"),
    ("1f923", "rolling-on-the-floor-laughing"),
    ("1f602", "face-with-tears-of-joy"),
    ("1f642", "slightly-smiling-face"),
    ("1f643", "upside-down-face"),
    ("1f609", "winking-face"),
    ("1f60a", "smiling-face-with-smiling-eyes"),
    ("1f607", "smiling-face-with-halo"),
    ("1f970", "smiling-face-with-hearts"),
    ("1f60d", "smiling-face-with-heart-eyes"),
    ("1f929", "star-struck"),
    ("1f618", "face-blowing-a-kiss"),
    # Row 1 (16)
    ("1f617", "kissing-face"),
    ("263a", "smiling-face"),
    ("1f61a", "kissing-face-with-closed-eyes"),
    ("1f60b", "face-savoring-food"),
    ("1f61b", "face-with-tongue"),
    ("1f61c", "winking-face-with-tongue"),
    ("1f92a", "zany-face"),
    ("1f61d", "squinting-face-with-tongue"),
    ("1f911", "money-mouth-face"),
    ("1f917", "hugging-face"),
    ("1f92d", "face-with-hand-over-mouth"),
    ("1f92b", "shushing-face"),
    ("1f914", "thinking-face"),
    ("1f910", "zipper-mouth-face"),
    ("1f928", "face-with-raised-eyebrow"),
    ("1f610", "neutral-face"),
    # Row 2 (16)
    ("1f611", "expressionless-face"),
    ("1f636", "face-without-mouth"),
    ("1f60f", "smirking-face"),
    ("1f612", "unamused-face"),
    ("1f644", "face-with-rolling-eyes"),
    ("1f62c", "grimacing-face"),
    ("1f925", "lying-face"),
    ("1f60c", "relieved-face"),
    ("1f614", "pensive-face"),
    ("1f62a", "sleepy-face"),
    ("1f924", "drooling-face"),
    ("1f634", "sleeping-face"),
    ("1f637", "face-with-medical-mask"),
    ("1f912", "face-with-thermometer"),
    ("1f915", "face-with-head-bandage"),
    ("1f922", "nauseated-face"),
    # Row 3 (16)
    ("1f92e", "face-vomiting"),
    ("1f927", "sneezing-face"),
    ("1f975", "hot-face"),
    ("1f976", "cold-face"),
    ("1f974", "woozy-face"),
    ("1f635", "face-with-crossed-out-eyes"),
    ("1f92f", "exploding-head"),
    ("1f920", "cowboy-hat-face"),
    ("1f973", "partying-face"),
    ("1f978", "disguised-face"),
    ("1f60e", "smiling-face-with-sunglasses"),
    ("1f913", "nerd-face"),
    ("1f9d0", "face-with-monocle"),
    ("1f615", "confused-face"),
    ("1f61f", "worried-face"),
    ("1f641", "slightly-frowning-face"),
    # Row 4 (15 — grid pos 14 is empty)
    ("2639", "frowning-face"),
    ("1f62e", "face-with-open-mouth"),
    ("1f62f", "hushed-face"),
    ("1f632", "astonished-face"),
    ("1f633", "flushed-face"),
    ("1f97a", "pleading-face"),
    ("1f626", "frowning-face-with-open-mouth"),
    ("1f627", "anguished-face"),
    ("1f628", "fearful-face"),
    ("1f630", "anxious-face-with-sweat"),
    ("1f625", "sad-but-relieved-face"),
    ("1f622", "crying-face"),
    ("1f62d", "loudly-crying-face"),
    ("1f631", "face-screaming-in-fear"),
    ("1f616", "confounded-face"),
    # Row 5 (16)
    ("1f623", "persevering-face"),
    ("1f61e", "disappointed-face"),
    ("1f613", "downcast-face-with-sweat"),
    ("1f629", "weary-face"),
    ("1f62b", "tired-face"),
    ("1f971", "yawning-face"),
    ("1f624", "face-with-steam-from-nose"),
    ("1f621", "pouting-face"),
    ("1f620", "angry-face"),
    ("1f92c", "face-with-symbols-on-mouth"),
    ("1f608", "smiling-face-with-horns"),
    ("1f47f", "angry-face-with-horns"),
    ("1f480", "skull"),
    ("2620", "skull-and-crossbones"),
    ("1f4a9", "pile-of-poo"),
    ("1f921", "clown-face"),
    # Row 6 (11)
    ("1f479", "ogre"),
    ("1f47a", "goblin"),
    ("1f47b", "ghost"),
    ("1f47d", "alien"),
    ("1f47e", "alien-monster"),
    ("1f916", "robot"),
    ("1f63a", "grinning-cat"),
    ("1f638", "grinning-cat-with-smiling-eyes"),
    ("1f639", "cat-with-tears-of-joy"),
    ("1f63b", "smiling-cat-with-heart-eyes"),
    ("1f63c", "cat-with-wry-smile"),
    # Row 7 (14)
    ("1f63d", "kissing-cat"),
    ("1f640", "weary-cat"),
    ("1f63f", "crying-cat"),
    ("1f63e", "pouting-cat"),
    ("1f648", "see-no-evil-monkey"),
    ("1f649", "hear-no-evil-monkey"),
    ("1f64a", "speak-no-evil-monkey"),
    ("1f436", "dog-face"),
    ("1f431", "cat-face"),
    ("1f42d", "mouse-face"),
    ("1f439", "hamster"),
    ("1f430", "rabbit-face"),
    ("1f98a", "fox"),
    ("1f43b", "bear"),
]

HEART_EMOJIS = [
    # Row 8 (13) — ordered by color as detected
    ("1fa77", "pink-heart"),
    ("2764", "red-heart"),
    ("1f9e1", "orange-heart"),
    ("1f49b", "yellow-heart"),
    ("1f49a", "green-heart"),
    ("1fa75", "light-blue-heart"),
    ("1f499", "blue-heart"),
    ("1f49c", "purple-heart"),
    ("1f5a4", "black-heart"),
    ("1fa76", "grey-heart"),
    ("1f90d", "white-heart"),
    ("1f90e", "brown-heart"),
    ("1f494", "broken-heart"),
]

FLAG_EMOJIS_UPPER = [
    # Row 9 upper (cols 6-15): 10 flags
    ("1f1e7-1f1f7", "flag-brazil"),
    ("1f1ef-1f1f5", "flag-japan"),
    ("1f1ee-1f1f9", "flag-italy"),
    ("1f1f0-1f1f7", "flag-south-korea"),
    ("1f1fa-1f1f8", "flag-united-states"),
    ("1f1f8-1f1ea", "flag-sweden"),
    ("1f1ff-1f1e6", "flag-south-africa"),
    ("1f1f5-1f1f9", "flag-portugal"),
    ("1f1e9-1f1ea", "flag-germany"),
    ("1f1eb-1f1f7", "flag-france"),
]

FLAG_EMOJIS_LOWER = [
    # Row 9 lower (cols 6-7): 2 more flags
    ("1f1e6-1f1eb", "flag-afghanistan"),
    ("1f1f7-1f1f4", "flag-romania"),
]

SUIT_EMOJIS = [
    # Row 9 lower (cols 12-15): 4 card suits
    ("2660", "spade-suit"),
    ("2663", "club-suit"),
    ("2665", "heart-suit"),
    ("2666", "diamond-suit"),
]


# ── Grid Definition ─────────────────────────────────────────────────────

# Row y-starts and which grid columns are filled
# (row_y, filled_columns_list)
ROW_DEFS = [
    (23,  list(range(16))),       # Row 0: all 16
    (48,  list(range(16))),       # Row 1: all 16
    (71,  list(range(16))),       # Row 2: all 16
    (94,  list(range(16))),       # Row 3: all 16
    (120, list(range(14)) + [15]),# Row 4: 0-13, skip 14, then 15
    (143, list(range(16))),       # Row 5: all 16
    (166, list(range(9)) + [11, 12]),  # Row 6: 0-8, 11-12
    (191, list(range(3)) + list(range(4, 15))),  # Row 7: 0-2, 4-14
    (225, list(range(13))),       # Row 8: 0-12 (hearts)
]

# Row 9 is special: two sub-rows
ROW9_UPPER_Y = 250   # Flags
ROW9_UPPER_COLS = list(range(6, 16))  # cols 6-15

ROW9_LOWER_Y = 274   # More flags + card suits
ROW9_LOWER_FLAG_COLS = [6, 7]
ROW9_LOWER_SUIT_COLS = [12, 13, 14, 15]

COL_START = 16
COL_PITCH = 24


# ── Extraction + SVG ───────────────────────────────────────────────────

def extract_and_vectorize(img, cx, cy, max_y, cell_w=16):
    """Extract pixels from (cx, cy) with width cell_w, up to max_y.
    Returns SVG string or None."""
    w_img, h_img = img.size
    pixels = []  # (px, py, hex_color)
    actual_h = 0

    for py in range(min(max_y - cy + 1, 24)):
        iy = cy + py
        if iy >= h_img:
            break
        for px in range(cell_w):
            ix = cx + px
            if ix >= w_img:
                continue
            p = img.getpixel((ix, iy))
            if p[3] > 128:
                rgb = (p[0], p[1], p[2])
                hex_c = nearest_rdna(rgb)
                pixels.append((px, py, hex_c))
                actual_h = max(actual_h, py + 1)

    if len(pixels) < 8:
        return None

    height = max(actual_h, cell_w)

    # Horizontal run-length merge
    rows = {}
    for px, py, hc in pixels:
        rows.setdefault((py, hc), []).append(px)

    rects = []
    for (py, hc), xs in rows.items():
        xs.sort()
        rs = xs[0]
        re = xs[0]
        for x in xs[1:]:
            if x == re + 1:
                re = x
            else:
                rects.append((rs, py, re - rs + 1, 1, hc))
                rs = x
                re = x
        rects.append((rs, py, re - rs + 1, 1, hc))

    # Vertical merge
    rects.sort(key=lambda r: (r[4], r[0], r[2], r[1]))
    merged = []
    i = 0
    while i < len(rects):
        x, y, w, h, c = rects[i]
        while i + 1 < len(rects):
            nx, ny, nw, nh, nc = rects[i + 1]
            if nc == c and nx == x and nw == w and ny == y + h:
                h += nh
                i += 1
            else:
                break
        merged.append((x, y, w, h, c))
        i += 1

    # SVG output
    lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {cell_w} {height}" '
        f'width="{cell_w}" height="{height}" shape-rendering="crispEdges">'
    ]

    by_color = {}
    for x, y, w, h, c in merged:
        by_color.setdefault(c, []).append((x, y, w, h))

    for color, rl in by_color.items():
        if len(rl) == 1:
            x, y, w, h = rl[0]
            lines.append(f'  <rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{color}"/>')
        else:
            lines.append(f'  <g fill="{color}">')
            for x, y, w, h in rl:
                lines.append(f'    <rect x="{x}" y="{y}" width="{w}" height="{h}"/>')
            lines.append('  </g>')

    lines.append('</svg>')
    return '\n'.join(lines)


# ── Main ────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 3:
        print("Usage: export-emojis.py <input.png> <output-dir>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_dir = sys.argv[2]

    unicode_dir = os.path.join(output_dir, "unicode")
    named_dir = os.path.join(output_dir, "named")
    os.makedirs(unicode_dir, exist_ok=True)
    os.makedirs(named_dir, exist_ok=True)

    img = Image.open(input_path).convert('RGBA')
    print(f"Loaded {input_path}: {img.size[0]}×{img.size[1]}")

    count = 0
    emoji_idx = 0  # Index into FACE_EMOJIS

    # ── Rows 0-7: Face emojis ──
    for row_def_idx, (ry, cols) in enumerate(ROW_DEFS[:8]):
        # Determine max_y for this row (next row start - 1, or image bottom)
        if row_def_idx + 1 < len(ROW_DEFS):
            max_y = ROW_DEFS[row_def_idx + 1][0] - 1
        else:
            max_y = img.size[1] - 1

        for ci in cols:
            if emoji_idx >= len(FACE_EMOJIS):
                break
            cx = COL_START + ci * COL_PITCH
            svg = extract_and_vectorize(img, cx, ry, max_y)
            if svg is None:
                print(f"  SKIP: row {row_def_idx} col {ci} (no content)")
                continue

            code, name = FACE_EMOJIS[emoji_idx]
            emoji_idx += 1

            upath = os.path.join(unicode_dir, f"{code}.svg")
            npath = os.path.join(named_dir, f"{name}.svg")
            with open(upath, 'w') as f:
                f.write(svg + '\n')
            with open(npath, 'w') as f:
                f.write(svg + '\n')
            count += 1

    print(f"  Faces: {emoji_idx} emojis exported")

    # ── Row 8: Hearts ──
    ry, cols = ROW_DEFS[8]
    max_y_hearts = ROW9_UPPER_Y - 1
    for hi, ci in enumerate(cols):
        if hi >= len(HEART_EMOJIS):
            break
        cx = COL_START + ci * COL_PITCH
        svg = extract_and_vectorize(img, cx, ry, max_y_hearts)
        if svg is None:
            continue
        code, name = HEART_EMOJIS[hi]
        with open(os.path.join(unicode_dir, f"{code}.svg"), 'w') as f:
            f.write(svg + '\n')
        with open(os.path.join(named_dir, f"{name}.svg"), 'w') as f:
            f.write(svg + '\n')
        count += 1

    print(f"  Hearts: {len(HEART_EMOJIS)} exported")

    # ── Row 9 upper: Flags ──
    for fi, ci in enumerate(ROW9_UPPER_COLS):
        if fi >= len(FLAG_EMOJIS_UPPER):
            break
        cx = COL_START + ci * COL_PITCH
        svg = extract_and_vectorize(img, cx, ROW9_UPPER_Y, ROW9_LOWER_Y - 2)
        if svg is None:
            continue
        code, name = FLAG_EMOJIS_UPPER[fi]
        with open(os.path.join(unicode_dir, f"{code}.svg"), 'w') as f:
            f.write(svg + '\n')
        with open(os.path.join(named_dir, f"{name}.svg"), 'w') as f:
            f.write(svg + '\n')
        count += 1

    print(f"  Flags (upper): {len(FLAG_EMOJIS_UPPER)} exported")

    # ── Row 9 lower: More flags ──
    for fi, ci in enumerate(ROW9_LOWER_FLAG_COLS):
        if fi >= len(FLAG_EMOJIS_LOWER):
            break
        cx = COL_START + ci * COL_PITCH
        svg = extract_and_vectorize(img, cx, ROW9_LOWER_Y, img.size[1] - 1)
        if svg is None:
            continue
        code, name = FLAG_EMOJIS_LOWER[fi]
        with open(os.path.join(unicode_dir, f"{code}.svg"), 'w') as f:
            f.write(svg + '\n')
        with open(os.path.join(named_dir, f"{name}.svg"), 'w') as f:
            f.write(svg + '\n')
        count += 1

    # ── Row 9 lower: Card suits ──
    for si, ci in enumerate(ROW9_LOWER_SUIT_COLS):
        if si >= len(SUIT_EMOJIS):
            break
        cx = COL_START + ci * COL_PITCH
        svg = extract_and_vectorize(img, cx, ROW9_LOWER_Y, img.size[1] - 1)
        if svg is None:
            continue
        code, name = SUIT_EMOJIS[si]
        with open(os.path.join(unicode_dir, f"{code}.svg"), 'w') as f:
            f.write(svg + '\n')
        with open(os.path.join(named_dir, f"{name}.svg"), 'w') as f:
            f.write(svg + '\n')
        count += 1

    print(f"  Flags (lower) + Suits: {len(FLAG_EMOJIS_LOWER) + len(SUIT_EMOJIS)} exported")
    print(f"\nTotal: {count} SVGs in each of:")
    print(f"  {unicode_dir}/")
    print(f"  {named_dir}/")
    print(f"\nNote: Row 9 cols 0-4 (color palette swatches) skipped — not emojis.")


if __name__ == "__main__":
    main()
