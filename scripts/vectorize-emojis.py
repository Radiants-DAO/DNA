#!/usr/bin/env python3
"""
Vectorize pixel-art emoji sprite sheet → individual RDNA-recolored SVGs.

Each 16×16 emoji becomes an SVG with <rect> elements, colors mapped to
the nearest RDNA brand token via CIE Lab perceptual distance.

Usage:
  python3 scripts/vectorize-emojis.py <input.png> <output-dir>
"""

import sys, os, math
from PIL import Image
import colorsys

# ── RDNA Brand Palette ──────────────────────────────────────────────────
RDNA_PALETTE = {
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


# ── CIE Lab Conversion ─────────────────────────────────────────────────

def srgb_to_lab(r, g, b):
    """sRGB (0-255) → CIE L*a*b*"""
    def linearize(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    rl, gl, bl = linearize(r), linearize(g), linearize(b)

    # D65 white point
    x = rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375
    y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750
    z = rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041

    xn, yn, zn = 0.95047, 1.00000, 1.08883

    def f(t):
        return t ** (1/3) if t > 0.008856 else 7.787 * t + 16 / 116

    fx, fy, fz = f(x / xn), f(y / yn), f(z / zn)
    return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))


def lab_dist(a, b):
    return math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))


# Pre-compute Lab values for palette
RDNA_LAB = {name: srgb_to_lab(*rgb) for name, rgb in RDNA_PALETTE.items()}

# Color mapping cache
_color_cache = {}


def nearest_rdna(rgb):
    """Return (token_name, hex) for the closest RDNA color."""
    if rgb in _color_cache:
        return _color_cache[rgb]

    lab = srgb_to_lab(*rgb)
    best = min(RDNA_LAB.items(), key=lambda kv: lab_dist(lab, kv[1]))
    result = (best[0], RDNA_HEX[best[0]])
    _color_cache[rgb] = result
    return result


# ── Grid Detection ──────────────────────────────────────────────────────

def detect_grid(img):
    """Detect emoji grid positions from sprite sheet.
    Returns list of (x, y, row_idx, col_idx) for each emoji cell."""
    w, h = img.size

    def row_has_content(y):
        for x in range(w):
            if img.getpixel((x, y))[3] > 10:
                return True
        return False

    def col_has_content_in_band(x, y_start, y_end):
        for y in range(y_start, min(y_end + 1, h)):
            if img.getpixel((x, y))[3] > 10:
                return True
        return False

    # Find row bands (skip first 20 rows = text label)
    row_bands = []
    in_band = False
    band_start = 0
    for y in range(20, h):
        has = row_has_content(y)
        if has and not in_band:
            band_start = y
            in_band = True
        elif not has and in_band:
            row_bands.append((band_start, y - 1))
            in_band = False
    if in_band:
        row_bands.append((band_start, h - 1))

    # For each row band, find column blocks
    cells = []
    for row_idx, (ry_start, ry_end) in enumerate(row_bands):
        col_blocks = []
        in_block = False
        bx_start = 0
        for x in range(w):
            has = col_has_content_in_band(x, ry_start, ry_end)
            if has and not in_block:
                bx_start = x
                in_block = True
            elif not has and in_block:
                col_blocks.append((bx_start, x - 1))
                in_block = False
        if in_block:
            col_blocks.append((bx_start, w - 1))

        for col_idx, (cx_start, cx_end) in enumerate(col_blocks):
            block_w = cx_end - cx_start + 1
            if block_w >= 14 and block_w <= 20:
                # Single emoji
                cells.append((cx_start, ry_start, row_idx, col_idx))
            elif block_w > 20:
                # Multiple emojis merged — split at 24px pitch
                n_emojis = round(block_w / 24)
                if n_emojis < 1:
                    n_emojis = 1
                pitch = block_w / n_emojis
                for i in range(n_emojis):
                    ex = cx_start + round(i * pitch)
                    cells.append((ex, ry_start, row_idx, col_idx + i))

    return cells


# ── SVG Generation ──────────────────────────────────────────────────────

def extract_emoji(img, x, y, size=16):
    """Extract a size×size pixel grid, return list of (px, py, rdna_name, hex)."""
    pixels = []
    for py in range(size):
        for px in range(size):
            ix, iy = x + px, y + py
            if ix >= img.size[0] or iy >= img.size[1]:
                continue
            p = img.getpixel((ix, iy))
            if p[3] > 128:
                rgb = (p[0], p[1], p[2])
                name, hex_color = nearest_rdna(rgb)
                pixels.append((px, py, name, hex_color))
    return pixels


def pixels_to_svg(pixels, size=16, scale=1):
    """Convert pixel list to SVG string with horizontal run-length merging."""
    if not pixels:
        return None

    # Group by (y, color) and merge horizontal runs
    rows = {}
    for px, py, name, hex_color in pixels:
        key = (py, hex_color)
        if key not in rows:
            rows[key] = []
        rows[key].append(px)

    rects = []
    for (py, hex_color), x_positions in rows.items():
        x_positions.sort()
        # Merge consecutive x positions
        runs = []
        run_start = x_positions[0]
        run_end = x_positions[0]
        for x in x_positions[1:]:
            if x == run_end + 1:
                run_end = x
            else:
                runs.append((run_start, run_end))
                run_start = x
                run_end = x
        runs.append((run_start, run_end))

        for rs, re in runs:
            w = re - rs + 1
            rects.append((rs, py, w, 1, hex_color))

    # Further merge: vertically adjacent rects with same x, w, color
    # Sort by (color, x, w, y)
    rects.sort(key=lambda r: (r[4], r[0], r[2], r[1]))
    merged = []
    i = 0
    while i < len(rects):
        x, y, w, h, c = rects[i]
        # Look ahead for vertically adjacent same-shape rects
        while i + 1 < len(rects):
            nx, ny, nw, nh, nc = rects[i + 1]
            if nc == c and nx == x and nw == w and ny == y + h:
                h += nh
                i += 1
            else:
                break
        merged.append((x, y, w, h, c))
        i += 1

    # Build SVG
    vb_size = size * scale
    lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" '
        f'width="{vb_size}" height="{vb_size}" shape-rendering="crispEdges">',
    ]

    # Group rects by color for cleaner SVG
    by_color = {}
    for x, y, w, h, c in merged:
        by_color.setdefault(c, []).append((x, y, w, h))

    for color, rect_list in by_color.items():
        if len(rect_list) == 1:
            x, y, w, h = rect_list[0]
            lines.append(f'  <rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{color}"/>')
        else:
            lines.append(f'  <g fill="{color}">')
            for x, y, w, h in rect_list:
                lines.append(f'    <rect x="{x}" y="{y}" width="{w}" height="{h}"/>')
            lines.append('  </g>')

    lines.append('</svg>')
    return '\n'.join(lines)


def is_empty_emoji(pixels):
    """Check if the extracted pixels form a meaningful emoji (not just noise)."""
    return len(pixels) >= 8  # At least 8 pixels of content


# ── Main ────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 3:
        print("Usage: vectorize-emojis.py <input.png> <output-dir>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_dir = sys.argv[2]
    os.makedirs(output_dir, exist_ok=True)

    img = Image.open(input_path).convert('RGBA')
    print(f"Loaded {input_path}: {img.size[0]}×{img.size[1]}")

    cells = detect_grid(img)
    print(f"Detected {len(cells)} emoji cells")

    count = 0
    color_usage = {}

    for x, y, row_idx, col_idx in cells:
        pixels = extract_emoji(img, x, y, 16)
        if not is_empty_emoji(pixels):
            continue

        svg = pixels_to_svg(pixels, 16, scale=1)
        if svg is None:
            continue

        name = f"emoji-r{row_idx:02d}-c{col_idx:02d}"
        path = os.path.join(output_dir, f"{name}.svg")
        with open(path, 'w') as f:
            f.write(svg + '\n')

        # Track color usage
        for _, _, rdna_name, _ in pixels:
            color_usage[rdna_name] = color_usage.get(rdna_name, 0) + 1

        count += 1

    print(f"\nGenerated {count} SVG files in {output_dir}/")
    print(f"\nRDNA color usage across all emojis:")
    for name, usage in sorted(color_usage.items(), key=lambda x: -x[1]):
        print(f"  {name:<15} {usage:>6} pixels")


if __name__ == "__main__":
    main()
