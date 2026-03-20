#!/bin/bash
# Find non-oklch color values in CSS/TSX/TS files
# Reports: file:line — matched color value

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Skip node_modules, .next, dist, generated, vendor, lockfiles, .git
EXCLUDE="--glob=!node_modules --glob=!.next --glob=!dist --glob=!generated --glob=!*.lock --glob=!.git"

# 1. Hex colors (#rgb, #rrggbb, #rrggbbaa) — but not CSS custom property hashes or anchors
# 2. rgb()/rgba()
# 3. hsl()/hsla()
# 4. hwb()
# 5. lab()/lch() (non-oklch variants)
# 6. color() with srgb/display-p3 etc
# 7. Named CSS colors used as values (common ones)

echo "=== Non-OKLCH Color Audit ==="
echo ""

echo "--- Hex colors (#xxx, #xxxxxx, #xxxxxxxx) ---"
rg -n --no-heading \
  -t css -t ts --type-add 'tsx:*.tsx' -t tsx \
  $EXCLUDE \
  '#[0-9a-fA-F]{3,8}\b' \
  "$ROOT" \
  | grep -vE '(eslint|\.md:|CLAUDE|DESIGN|CHANGELOG|README|\.json:)' \
  | grep -vE '(--[a-zA-Z]|url\(|font-feature|#region|#end|sourceMappingURL|#\!)' \
  | grep -vE '(oklch)' \
  || echo "(none found)"

echo ""
echo "--- rgb()/rgba() ---"
rg -n --no-heading \
  -t css -t ts --type-add 'tsx:*.tsx' -t tsx \
  $EXCLUDE \
  'rgba?\s*\(' \
  "$ROOT" \
  | grep -vE '(eslint|\.md:|\.json:)' \
  | grep -vE '(oklch)' \
  || echo "(none found)"

echo ""
echo "--- hsl()/hsla() ---"
rg -n --no-heading \
  -t css -t ts --type-add 'tsx:*.tsx' -t tsx \
  $EXCLUDE \
  'hsla?\s*\(' \
  "$ROOT" \
  | grep -vE '(eslint|\.md:|\.json:)' \
  || echo "(none found)"

echo ""
echo "--- hwb() ---"
rg -n --no-heading \
  -t css -t ts --type-add 'tsx:*.tsx' -t tsx \
  $EXCLUDE \
  'hwb\s*\(' \
  "$ROOT" \
  || echo "(none found)"

echo ""
echo "--- lab()/lch() (non-ok variants) ---"
rg -n --no-heading \
  -t css -t ts --type-add 'tsx:*.tsx' -t tsx \
  $EXCLUDE \
  '\b(lab|lch)\s*\(' \
  "$ROOT" \
  | grep -vE '(oklch|oklab)' \
  || echo "(none found)"

echo ""
echo "--- color() function (srgb, display-p3, etc.) ---"
rg -n --no-heading \
  -t css -t ts --type-add 'tsx:*.tsx' -t tsx \
  $EXCLUDE \
  '\bcolor\s*\(' \
  "$ROOT" \
  | grep -vE '(eslint|\.md:|color-mix|currentColor|\.json:|backgroundColor|color:|--color-)' \
  | grep -vE '(oklch)' \
  || echo "(none found)"

echo ""
echo "=== Done ==="
