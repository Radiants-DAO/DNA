# i18n Token Patterns for RadFlow

> Research document for fn-4.8: i18n token patterns (RTL/LTR, text expansion, CJK fonts)

## Executive Summary

This document defines internationalization (i18n) token patterns for the RadFlow design system. It covers bidirectional text handling (RTL/LTR), text expansion accommodation, CJK (Chinese, Japanese, Korean) typography, and locale-sensitive formatting. The system prioritizes CSS logical properties for automatic layout mirroring while maintaining RadOS's visual identity across languages.

**Key Decision:** RadFlow uses CSS logical properties exclusively for directional spacing/positioning, enabling automatic RTL support. Typography tokens are categorized by language family (Western, CJK, Tall scripts) with per-category line-height and font-stack overrides.

---

## Bidirectional Layout System

### CSS Logical Properties (Mandatory)

All RadFlow components must use CSS logical properties instead of physical properties. This enables automatic layout mirroring when `dir="rtl"` is set on the document.

| Physical Property | Logical Property | LTR Value | RTL Value |
|-------------------|------------------|-----------|-----------|
| `margin-left` | `margin-inline-start` | left | right |
| `margin-right` | `margin-inline-end` | right | left |
| `padding-left` | `padding-inline-start` | left | right |
| `padding-right` | `padding-inline-end` | right | left |
| `border-left` | `border-inline-start` | left | right |
| `border-right` | `border-inline-end` | right | left |
| `left` | `inset-inline-start` | left | right |
| `right` | `inset-inline-end` | right | left |
| `top` | `inset-block-start` | top | top |
| `bottom` | `inset-block-end` | bottom | bottom |
| `text-align: left` | `text-align: start` | left | right |
| `text-align: right` | `text-align: end` | right | left |
| `float: left` | `float: inline-start` | left | right |
| `float: right` | `float: inline-end` | right | left |

### Shorthand Logical Properties

```css
/* Two-value shorthands */
padding-inline: <start> <end>;   /* inline-start and inline-end */
padding-block: <start> <end>;    /* block-start and block-end */
margin-inline: <start> <end>;
margin-block: <start> <end>;

/* Examples */
.card {
  padding-inline: var(--space-4) var(--space-2);  /* More padding at start */
  margin-block: var(--space-2);                   /* Equal top/bottom */
}
```

### Direction Tokens

```css
:root {
  /* Document-level direction (set programmatically) */
  --text-direction: ltr;          /* or rtl */

  /* Layout direction for flexbox/grid */
  --flex-direction-row: row;      /* becomes row-reverse in RTL */

  /* Icon flip indicator */
  --icon-flip: 1;                 /* 1 = no flip, -1 = flip horizontally */
}

html[dir="rtl"] {
  --text-direction: rtl;
  --icon-flip: -1;
}
```

### HTML Attribute Requirements

```html
<!-- Document-level direction -->
<html lang="ar" dir="rtl">

<!-- User-generated content with unknown direction -->
<p dir="auto">{userContent}</p>

<!-- Mixed directional content -->
<span dir="ltr">123-456-7890</span> <!-- Phone numbers always LTR -->
```

---

## Language Family Categories

Following Material Design's categorization and Smashing Magazine's design system approach, RadFlow groups languages into categories for typography tokens:

### Category Definitions

| Category | Languages | Characteristics |
|----------|-----------|-----------------|
| **Western** | Latin, Greek, Cyrillic, Hebrew, Armenian, Georgian | Standard line height (1.5-1.6), left-to-right (except Hebrew) |
| **Tall** | Arabic, Hindi, Telugu, Thai, Vietnamese | Extended vertical space for diacritics, ligatures |
| **Dense (CJK)** | Chinese, Japanese, Korean | Uniform character width, larger line height, grid-based |
| **RTL** | Arabic, Hebrew, Persian, Urdu | Right-to-left reading direction |

### Language Category Token Structure

```css
:root {
  /* Category: Western (default) */
  --typography-line-height-body: 1.6;
  --typography-line-height-heading: 1.2;
  --typography-letter-spacing: normal;
  --typography-word-spacing: normal;
}

/* Category: Tall scripts */
html[data-locale-category="tall"] {
  --typography-line-height-body: 1.8;
  --typography-line-height-heading: 1.4;
  --typography-letter-spacing: 0.02em;
}

/* Category: Dense (CJK) */
html[data-locale-category="dense"] {
  --typography-line-height-body: 1.7;
  --typography-line-height-heading: 1.3;
  --typography-letter-spacing: 0;      /* CJK doesn't use letter-spacing */
  --typography-word-spacing: 0;        /* No word spaces in CJK */
}
```

### Locale Category Mapping

```typescript
type LocaleCategory = 'western' | 'tall' | 'dense';

const LOCALE_CATEGORIES: Record<string, LocaleCategory> = {
  // Western (default)
  'en': 'western',
  'de': 'western',
  'fr': 'western',
  'es': 'western',
  'it': 'western',
  'pt': 'western',
  'nl': 'western',
  'pl': 'western',
  'ru': 'western',
  'uk': 'western',
  'el': 'western',
  'he': 'western',  // RTL but Western metrics

  // Tall scripts
  'ar': 'tall',     // Arabic - RTL
  'fa': 'tall',     // Persian - RTL
  'ur': 'tall',     // Urdu - RTL
  'hi': 'tall',     // Hindi
  'th': 'tall',     // Thai
  'vi': 'tall',     // Vietnamese
  'te': 'tall',     // Telugu
  'ta': 'tall',     // Tamil

  // Dense (CJK)
  'zh': 'dense',    // Chinese (Simplified/Traditional)
  'ja': 'dense',    // Japanese
  'ko': 'dense',    // Korean
};

const RTL_LANGUAGES = new Set(['ar', 'fa', 'ur', 'he', 'yi']);
```

---

## Text Expansion Accommodation

### Expansion Ratios by Language

When translating from English, text length varies significantly:

| Language | Typical Expansion | Example |
|----------|-------------------|---------|
| German | +30-40% | "Settings" → "Einstellungen" |
| Finnish | +30-40% | Compound words |
| French | +15-20% | "Cancel" → "Annuler" |
| Spanish | +15-20% | Similar to French |
| Italian | +10-15% | "Edit" → "Modifica" |
| Portuguese | +15-25% | Varies by region |
| Chinese | -30-50% | Single characters convey more |
| Japanese | -20-30% | Compact when using kanji |
| Korean | -10-20% | Syllable blocks |

### Design Principles for Expansion

```css
/* DO: Use flexible containers */
.button {
  min-width: fit-content;
  padding-inline: var(--space-4);
  white-space: nowrap;
}

/* DO: Allow text wrapping in labels */
.form-label {
  max-width: 100%;
  overflow-wrap: break-word;
  hyphens: auto;
}

/* DON'T: Fixed widths for text containers */
.button-bad {
  width: 120px;  /* ❌ Text will overflow in German */
}
```

### Expansion Buffer Tokens

```css
:root {
  /* Minimum padding to accommodate expansion */
  --text-expansion-buffer: 1.4;  /* 40% expansion buffer */

  /* Computed min-widths for common UI patterns */
  --button-min-width: calc(var(--space-16) * var(--text-expansion-buffer));
  --input-label-max-width: calc(200px * var(--text-expansion-buffer));
}
```

### Truncation Strategy

```css
/* For fixed-width containers, truncate gracefully */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Multi-line clamp */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

---

## CJK Typography System

### Font Stack Architecture

CJK fonts are specified after Latin fonts because:
1. Latin fonts rarely include CJK glyphs
2. CJK fonts always include (often suboptimal) Latin glyphs
3. Specifying Latin first ensures brand fonts render for Latin text

```css
:root {
  /* RadOS default (Western) */
  --font-family-heading: 'Joystix', monospace;
  --font-family-body: 'Mondwest', system-ui, sans-serif;

  /* CJK-aware stacks */
  --font-family-cjk-heading:
    'Joystix',                              /* Brand Latin */
    'Noto Sans CJK SC',                     /* Simplified Chinese */
    'Noto Sans CJK TC',                     /* Traditional Chinese */
    'Noto Sans CJK JP',                     /* Japanese */
    'Noto Sans CJK KR',                     /* Korean */
    'Microsoft YaHei',                      /* Windows Chinese fallback */
    'Hiragino Sans',                        /* macOS Japanese fallback */
    'Apple SD Gothic Neo',                  /* macOS Korean fallback */
    monospace;

  --font-family-cjk-body:
    'Mondwest',
    'Noto Sans CJK SC',
    'Noto Sans CJK TC',
    'Noto Sans CJK JP',
    'Noto Sans CJK KR',
    'PingFang SC',
    'Hiragino Kaku Gothic Pro',
    'Malgun Gothic',
    system-ui,
    sans-serif;
}

/* Apply CJK font stack for CJK locales */
html[lang^="zh"],
html[lang="ja"],
html[lang="ko"] {
  --font-family-heading: var(--font-family-cjk-heading);
  --font-family-body: var(--font-family-cjk-body);
}
```

### Regional Variant Selection

Unicode unifies many CJK characters, but regional variants differ visually. Use `lang` attribute to trigger correct glyphs:

```html
<!-- Simplified Chinese -->
<html lang="zh-CN">

<!-- Traditional Chinese (Taiwan) -->
<html lang="zh-TW">

<!-- Traditional Chinese (Hong Kong) -->
<html lang="zh-HK">

<!-- Japanese -->
<html lang="ja">

<!-- Korean -->
<html lang="ko">
```

### Google Noto Fonts (Recommended)

Google's Noto font family provides pan-language harmony with 1000+ language support:

| Noto Font | Use Case | Weight Range |
|-----------|----------|--------------|
| Noto Sans | UI text, body | 100-900 |
| Noto Sans CJK | Chinese, Japanese, Korean | 100-900 |
| Noto Sans Arabic | Arabic script | 100-900 |
| Noto Sans Hebrew | Hebrew script | 100-900 |
| Noto Sans Thai | Thai script | 100-900 |
| Noto Sans Devanagari | Hindi, Sanskrit | 100-900 |

```css
/* Import strategy: Load only needed scripts */
@font-face {
  font-family: 'Noto Sans CJK SC';
  src: url('NotoSansCJKsc-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
  unicode-range: U+4E00-9FFF;  /* CJK Unified Ideographs */
}
```

### CJK Typography Adjustments

```css
html[lang^="zh"],
html[lang="ja"],
html[lang="ko"] {
  /* Larger line height for dense scripts */
  --typography-line-height-body: 1.7;

  /* Increased font size for readability */
  --font-size-base: 0.9375rem;  /* 15px vs 14px default */

  /* No letter-spacing (already uniform width) */
  --typography-letter-spacing: 0;

  /* Disable italics (not native to CJK) */
  --font-style-emphasis: normal;
  --font-weight-emphasis: 600;  /* Use weight instead */
}
```

### CJK-Specific Considerations

| Feature | Western | CJK | Token/Property |
|---------|---------|-----|----------------|
| Emphasis | Italics | Bold weight | `--font-style-emphasis` |
| ALL CAPS | Common | Doesn't exist | Disable text-transform |
| Word spacing | 0.25em | None | `--typography-word-spacing` |
| Line break | Between words | Between any characters | `word-break: break-all` |
| Punctuation | Proportional | Full-width | Font feature settings |

---

## Arabic/Hebrew (RTL) Typography

### Line Height for Arabic

Arabic requires more vertical space due to diacritical marks (harakat) and letter extensions:

```css
html[lang^="ar"],
html[lang="fa"],
html[lang="ur"] {
  --typography-line-height-body: 1.8;
  --typography-line-height-heading: 1.5;
}
```

### Font Stack for Arabic

```css
:root {
  --font-family-arabic:
    'Mondwest',                    /* Brand Latin (for mixed content) */
    'Noto Sans Arabic',            /* Primary Arabic */
    'Geeza Pro',                   /* macOS fallback */
    'Segoe UI',                    /* Windows fallback */
    'Tahoma',                      /* Legacy fallback */
    sans-serif;
}

html[lang^="ar"],
html[lang="fa"] {
  --font-family-body: var(--font-family-arabic);
}
```

### Hebrew Typography

```css
:root {
  --font-family-hebrew:
    'Mondwest',
    'Noto Sans Hebrew',
    'Arial Hebrew',               /* macOS */
    'Segoe UI',                   /* Windows */
    sans-serif;
}

html[lang="he"],
html[lang="yi"] {
  --font-family-body: var(--font-family-hebrew);
  /* Hebrew uses Western line-height */
  --typography-line-height-body: 1.6;
}
```

### Bidirectional Mixed Content

```css
/* Numbers and punctuation in RTL context */
.rtl-number {
  direction: ltr;
  unicode-bidi: embed;
}

/* Isolate embedded opposite-direction text */
.bidi-isolate {
  unicode-bidi: isolate;
}

/* For sequences like "Chapter 3" in Arabic */
.bidi-override {
  unicode-bidi: bidi-override;
}
```

---

## Date/Number/Currency Formatting

### JavaScript Intl API Integration

RadFlow delegates locale-sensitive formatting to the browser's Intl API:

```typescript
// Date formatting
const formatDate = (date: Date, locale: string): string => {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};

// Number formatting
const formatNumber = (num: number, locale: string): string => {
  return new Intl.NumberFormat(locale).format(num);
};

// Currency formatting
const formatCurrency = (amount: number, locale: string, currency: string): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount);
};

// Relative time ("3 days ago")
const formatRelativeTime = (value: number, unit: Intl.RelativeTimeFormatUnit, locale: string): string => {
  return new Intl.RelativeTimeFormat(locale, {
    numeric: 'auto'
  }).format(value, unit);
};
```

### Format Tokens (CSS Custom Properties for Display)

```css
:root {
  /* Date format indicators (for placeholder text) */
  --format-date-short: 'MM/DD/YYYY';     /* US */
  --format-date-time: 'h:mm A';          /* 12-hour */

  /* Number format indicators */
  --format-decimal-separator: '.';
  --format-thousands-separator: ',';
}

/* European locales */
html[lang="de"],
html[lang="fr"],
html[lang="es"] {
  --format-date-short: 'DD.MM.YYYY';
  --format-decimal-separator: ',';
  --format-thousands-separator: '.';
}
```

---

## Implementation Tokens Summary

### Direction Tokens

| Token | Default | RTL Override | Purpose |
|-------|---------|--------------|---------|
| `--text-direction` | `ltr` | `rtl` | Document direction |
| `--icon-flip` | `1` | `-1` | Directional icon mirroring |

### Typography Category Tokens

| Token | Western | Tall | Dense |
|-------|---------|------|-------|
| `--typography-line-height-body` | 1.6 | 1.8 | 1.7 |
| `--typography-line-height-heading` | 1.2 | 1.4 | 1.3 |
| `--typography-letter-spacing` | normal | 0.02em | 0 |
| `--font-style-emphasis` | italic | italic | normal |
| `--font-weight-emphasis` | 400 | 400 | 600 |

### Font Stack Tokens

| Token | Purpose |
|-------|---------|
| `--font-family-heading` | Heading typeface stack |
| `--font-family-body` | Body text stack |
| `--font-family-cjk-heading` | CJK-aware heading stack |
| `--font-family-cjk-body` | CJK-aware body stack |
| `--font-family-arabic` | Arabic script stack |
| `--font-family-hebrew` | Hebrew script stack |

### Expansion Tokens

| Token | Value | Purpose |
|-------|-------|---------|
| `--text-expansion-buffer` | 1.4 | 40% expansion multiplier |
| `--button-min-width` | calc(...) | Minimum button width |

---

## RadOS Integration Notes

### Compatibility with RadOS Visual Identity

1. **Joystix font**: Works for Latin, Greek, Cyrillic. CJK locales fall back to Noto Sans CJK while keeping RadOS color/spacing aesthetics.

2. **Hard shadows**: Pixel-perfect shadows work universally across scripts.

3. **Lift-and-press interactions**: Motion tokens from fn-4.4 apply regardless of text direction.

4. **Color system**: Semantic tokens (surface-primary, content-primary) are language-agnostic.

### Migration Path

1. **Phase 1**: Audit existing CSS for physical properties → replace with logical properties
2. **Phase 2**: Add language category detection and CSS custom property overrides
3. **Phase 3**: Implement font loading strategy for CJK/Arabic/Hebrew
4. **Phase 4**: Add Intl API wrappers for date/number formatting

---

## Testing Recommendations

### Pseudo-localization

Use pseudo-localization to test expansion without full translation:

```typescript
// Expand text by 40% with accented characters
const pseudoLocalize = (text: string): string => {
  const accents: Record<string, string> = {
    'a': 'á', 'e': 'é', 'i': 'í', 'o': 'ó', 'u': 'ú'
  };
  const expanded = text.replace(/[aeiou]/gi, (c) => accents[c.toLowerCase()] || c);
  return `[[ ${expanded} ]]`;  // Brackets show string boundaries
};
```

### RTL Testing Checklist

- [ ] Layout mirrors correctly with `dir="rtl"`
- [ ] Icons flip appropriately (arrows, chevrons)
- [ ] Non-flipping icons stay correct (checkmarks, search)
- [ ] Numbers display left-to-right within RTL context
- [ ] Mixed content (Arabic + English) renders correctly
- [ ] Focus order follows RTL reading direction

### CJK Testing Checklist

- [ ] Characters render in correct regional variant
- [ ] Font fallback chain works (brand → Noto → system)
- [ ] Line height provides adequate reading comfort
- [ ] Text wraps at character boundaries
- [ ] Emphasis uses bold weight, not italics

---

## References

### W3C Standards
- [CSS Logical Properties Level 1](https://www.w3.org/TR/css-logical-1/)
- [RTL Rendering of LTR Scripts](https://w3c.github.io/i18n-drafts/questions/qa-ltr-scripts-in-rtl.en)
- [Arabic & Persian Layout Requirements](https://www.w3.org/International/alreq/)

### Design System Case Studies
- [Integrating Localization Into Design Systems (Smashing Magazine)](https://www.smashingmagazine.com/2025/05/integrating-localization-into-design-systems/)
- [Material Design Typography](https://m1.material.io/style/typography.html)

### Typography Resources
- [Typotheque: Typesetting CJK Text](https://www.typotheque.com/articles/typesetting-cjk-text)
- [CJK Font Stack Notes (Snook.ca)](https://snook.ca/archives/html_and_css/cjk-font-stack-notes)
- [Google Noto Fonts](https://fonts.google.com/noto)

### CSS Resources
- [CSS Logical Properties (CSS-Tricks)](https://css-tricks.com/css-logical-properties-and-values/)
- [Digging Into CSS Logical Properties (Ahmad Shadeed)](https://ishadeed.com/article/css-logical-properties/)
- [RTL Styling 101](https://rtlstyling.com/posts/rtl-styling/)

### JavaScript Internationalization
- [MDN: Intl API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [The Power of the Intl API (Smashing Magazine)](https://www.smashingmagazine.com/2025/08/power-intl-api-guide-browser-native-internationalization/)
