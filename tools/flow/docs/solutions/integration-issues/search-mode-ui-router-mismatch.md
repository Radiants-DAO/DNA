---
title: Search Mode UI/Router Mismatch
category: integration-issues
date: 2026-02-05
tags: [search, content-script, type-safety, feature-parity]
---

# Search Mode UI/Router Mismatch

## Symptom

SearchPanel's "Attr" mode silently behaved like selector search. Users selecting attribute search got CSS selector results instead.

## Investigation

1. **Checked SearchPanel UI** — Offered modes: `selector`, `text`, `attribute`
2. **Checked search.ts** — Defined type: `'selector' | 'text' | 'fuzzy'`
3. **Checked panelRouter** — Fell back to `selector` for unknown modes

## Root Cause

Three files had divergent search mode definitions:

```typescript
// SearchPanel.tsx (UI)
const modes = ['selector', 'text', 'attribute'];

// search.ts (implementation)
export type SearchMode = 'selector' | 'text' | 'fuzzy';

// panelRouter.ts (router)
const searchMode = mode === 'text' || mode === 'fuzzy' ? mode : 'selector';
// 'attribute' falls through to 'selector'
```

## Solution

### 1. Add attribute search to search.ts

```typescript
// packages/extension/src/content/features/search.ts
export type SearchMode = 'selector' | 'text' | 'fuzzy' | 'attribute';

export async function queryPage(query: string, mode: SearchMode = 'selector'): Promise<Element[]> {
  switch (mode) {
    case 'selector':
      return querySelectorSearch(query);
    case 'text':
      return textSearch(query);
    case 'fuzzy':
      return fuzzySearch(query);
    case 'attribute':
      return attributeSearch(query);
    default:
      return querySelectorSearch(query);
  }
}

function attributeSearch(query: string): Element[] {
  const results: Element[] = [];
  const lowerQuery = query.toLowerCase();

  // Parse "attr=value" or just "attr"
  const [attrName, attrValue] = query.includes('=')
    ? query.split('=').map(s => s.trim())
    : [query, null];

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  let node: Node | null;

  while ((node = walker.nextNode())) {
    const el = node as Element;
    for (const attr of el.attributes) {
      const nameMatch = attr.name.toLowerCase().includes(attrName.toLowerCase());
      const valueMatch = attrValue
        ? attr.value.toLowerCase().includes(attrValue.toLowerCase())
        : true;

      if (nameMatch && valueMatch) {
        results.push(el);
        break;
      }
    }
  }
  return results;
}
```

### 2. Update panelRouter validation

```typescript
// packages/extension/src/content/panelRouter.ts
const searchMode: SearchMode =
  mode === 'text' || mode === 'fuzzy' || mode === 'attribute' ? mode : 'selector';
```

## Prevention

1. **Single source of truth**: Export `SearchMode` type from search.ts, import everywhere
2. **Exhaustive switch**: Use TypeScript's exhaustive checking
3. **Type the UI**: `modes: SearchMode[]` instead of string array

## Related

- `packages/extension/src/content/features/search.ts` — Search implementation
- `packages/extension/src/panel/components/context/SearchPanel.tsx` — UI
- `packages/extension/src/content/panelRouter.ts` — Router
