---
title: Selection Metadata Preservation on Inspection
category: integration-issues
date: 2026-02-05
tags: [chrome-extension, state-management, react, element-selection]
---

# Selection Metadata Preservation on Inspection

## Symptom

After Alt+click selection, rich element metadata (id, classList, rect, textPreview) was immediately lost. PreviewCanvas tag display and other UI relying on these fields showed empty values.

## Investigation

1. **Checked Alt+click flow** — `element:selected` message contained full metadata
2. **Checked inspection flow** — `flow:content:inspection-result` followed immediately
3. **Found overwrite** — Inspection result handler replaced rich selection with minimal object

## Root Cause

A previous fix to sync selection with inspection always overwrote `selectedElement`:

```typescript
case 'flow:content:inspection-result':
  setInspectionResult(msg.result);
  if (msg.result) {
    setSelectedElement({  // Overwrites everything!
      elementRef: msg.elementRef || 'selected',
      elementIndex: -1,
      selector: msg.result.selector,
      tagName: msg.result.tagName,
      id: '',           // Lost!
      classList: [],    // Lost!
      rect: { ... },    // Lost!
      textPreview: '',  // Lost!
    });
  }
```

The Alt+click flow sends two messages in sequence:
1. `element:selected` — Full metadata from content script
2. `flow:content:inspection-result` — Inspection data (no id/classList/rect)

The second message overwrote the first's data.

## Solution

Only update `selectedElement` when it's a different element, preserving metadata for same-element inspection:

```typescript
// packages/extension/src/entrypoints/panel/Panel.tsx

case 'flow:content:inspection-result':
  setInspectionResult(msg.result);
  if (msg.result) {
    setSelectedElement((prev) => {
      // If same element, preserve rich metadata from element:selected
      if (prev && prev.selector === msg.result.selector) {
        // Only update elementRef if provided (for mutation engine registration)
        return msg.elementRef ? { ...prev, elementRef: msg.elementRef } : prev;
      }
      // Different element (from Search inspect) — create minimal selection
      return {
        elementRef: msg.elementRef || 'selected',
        elementIndex: -1,
        selector: msg.result.selector,
        tagName: msg.result.tagName,
        id: '',
        classList: [],
        rect: { top: 0, left: 0, width: 0, height: 0 },
        textPreview: '',
      };
    });
  }
  break;
```

## Two Selection Flows

| Flow | Messages | Metadata |
|------|----------|----------|
| **Alt+click** | `element:selected` → `flow:content:inspection-result` | Rich (id, classList, rect, textPreview) |
| **Search inspect** | `flow:content:inspection-result` only | Minimal (selector, tagName) |

The fix handles both:
- Alt+click: Preserves rich metadata from first message
- Search: Creates minimal selection since no prior `element:selected`

## Prevention

1. **Understand message sequences**: Document which messages arrive in what order
2. **Merge, don't replace**: When updating state, consider what existing data should be preserved
3. **Differentiate flows**: The selector comparison distinguishes "same element, more data" from "new element"

## Related

- `packages/extension/src/entrypoints/panel/Panel.tsx` — Selection state management
- `packages/extension/src/content/inspector.ts` — Inspection pipeline
- `packages/shared/src/messages.ts` — Message type definitions
