Updated typography.css to use fluid typography tokens from tokens.css.

**Changes:**
- Replaced all Tailwind text size classes (text-4xl, text-3xl, etc.) with fluid CSS custom properties (--text-4xl, --text-3xl, etc.)
- Font sizes now scale responsively using clamp() between viewport widths
- All 23 typography elements updated: h1-h6, p, a, ul, ol, li, small, strong, em, code, pre, kbd, mark, blockquote, cite, abbr, dfn, q, sub, sup, del, ins, caption, label, figcaption

**Token mappings:**
- h1: --text-4xl (32-40px fluid)
- h2: --text-3xl (24-30px fluid)
- h3: --text-2xl (20-24px fluid)
- h4: --text-xl (18-20px fluid)
- h5: --text-lg (16-18px fluid)
- h6, p, a, ul, ol, li, strong, em, mark, blockquote, abbr, dfn, q, del, ins: --text-base (14-16px fluid)
- small, cite, pre: --text-sm (12-14px fluid)
- code, kbd, sub, sup, caption, label, figcaption: --text-xs (10-12px fluid)
