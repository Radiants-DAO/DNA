---
title: CSS Property Kebab-Case to CamelCase Conversion
category: integration-issues
date: 2026-02-05
tags: [css, getComputedStyle, react, style-properties, naming-convention]
---

# CSS Property Kebab-Case to CamelCase Conversion

## Symptom

Designer sections (SpacingSection, LayoutSection, etc.) showed empty/default values even when elements had styles applied. Initial styles from inspection weren't populating the UI controls.

## Investigation

1. **Verified inspection data** — InspectionResult contained correct style values
2. **Checked styleEntriesToRecord()** — Function was converting StyleEntry[] to Record correctly
3. **Found property name mismatch** — styleExtractor returned `margin-top`, sections expected `marginTop`

## Root Cause

Browser's `getComputedStyle()` returns CSS property names in kebab-case (the CSS standard), but React/JavaScript style objects use camelCase. The `styleEntriesToRecord()` function passed through property names unchanged.

```typescript
// styleExtractor.ts emits:
{ property: 'margin-top', value: '16px' }
{ property: 'flex-direction', value: 'row' }

// SpacingSection expects:
initialStyles?.marginTop
initialStyles?.flexDirection
```

## Solution

Add kebab-to-camel conversion in `styleEntriesToRecord()`:

```typescript
// packages/extension/src/panel/components/layout/RightPanel.tsx

function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function styleEntriesToRecord(entries: StyleEntry[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (const entry of entries) {
    record[kebabToCamel(entry.property)] = entry.value;
  }
  return record;
}
```

## Prevention

1. **Document the convention**: styleExtractor returns kebab-case (browser standard), panel components expect camelCase (JS standard)
2. **Convert at the boundary**: The conversion happens once in `styleEntriesToRecord()`, not scattered across components
3. **Type the record**: Consider `Record<CamelCaseProperty, string>` if stricter typing needed

## Related

- `packages/extension/src/content/styleExtractor.ts` — Source of kebab-case properties
- `packages/extension/src/panel/components/designer/sections/*.tsx` — Consumers expecting camelCase
