# fn-2-gnc.10 Upgrade Iframe Security and Rect Tracking

## Description
Upgrade the current Page Builder iframe with security attributes and rect tracking from Webstudio.

## Context
Webstudio uses `credentialless` iframe attribute and ResizeObserver for precise rect tracking. Apply these patterns to RadFlow's existing iframe.

## Browser Compatibility Note
`credentialless` attribute has limited browser support:
- Chrome 110+ ✅
- Firefox: Not supported ❌
- Safari: Not supported ❌

Must use feature detection with fallback.

## Source Reference
`/Users/rivermassey/Desktop/dev/webstudio-main/apps/builder/app/canvas/canvas-iframe.tsx`

## Implementation

1. **Iframe Security Upgrade with Feature Detection**:
```typescript
// src/components/preview/PreviewCanvas.tsx
const supportsCredentialless = 'credentialless' in HTMLIFrameElement.prototype;

<iframe
  {...(supportsCredentialless && { credentialless: true })}
  sandbox="allow-scripts allow-same-origin"
  // Fallback sandbox for unsupported browsers
/>
```

2. **Rect Tracking System**:
   - Create `useCanvasRect` hook
   - Use ResizeObserver to track iframe dimensions
   - Store in Zustand viewportSlice
   - Update on resize, scroll, zoom

3. **Pointer Events Toggle**:
   - CSS variable `--canvas-pointer-events`
   - Toggle between `auto` (preview mode) and `none` (editing)
   - Allows overlays to receive events when editing

4. **Scaling Support**:
   - Track canvas scale factor
   - Overlays render at 100% scale
   - Canvas content renders at user-selected scale
   - Rect calculations account for scale

## Key Files
- **Modify**: `src/components/preview/PreviewCanvas.tsx`
- **Create**: `src/hooks/useCanvasRect.ts`
- **Modify**: `src/stores/slices/viewportSlice.ts` (add canvasRect)
## Context
Webstudio uses `credentialless` iframe attribute and ResizeObserver for precise rect tracking. Apply these patterns to RadFlow's existing iframe.

## Source Reference
`/Users/rivermassey/Desktop/dev/webstudio-main/apps/builder/app/canvas/canvas-iframe.tsx`

## Implementation

1. **Iframe Security Upgrade**:
   - Add `credentialless="true"` attribute (isolates credentials)
   - Add appropriate `sandbox` attributes if needed
   - Ensure cross-origin communication still works

2. **Rect Tracking System**:
   - Create `useCanvasRect` hook
   - Use ResizeObserver to track iframe dimensions
   - Store in `$canvasRect` nanostore/zustand
   - Update on resize, scroll, zoom

3. **Pointer Events Toggle**:
   - CSS variable `--canvas-pointer-events`
   - Toggle between `auto` (preview mode) and `none` (editing)
   - Allows overlays to receive events when editing

4. **Scaling Support**:
   - Track canvas scale factor
   - Overlays render at 100% scale
   - Canvas content renders at user-selected scale
   - Rect calculations account for scale

## Key Files
- **Modify**: `src/components/preview/PreviewCanvas.tsx`
- **Create**: `src/hooks/useCanvasRect.ts`
- **Modify**: `src/stores/slices/viewportSlice.ts` (add canvasRect)
## Acceptance
- [ ] Iframe has `credentialless="true"` attribute when supported (feature detection)
- [ ] Fallback sandbox attributes applied for Firefox/Safari
- [ ] Security implications documented in code comments for unsupported browsers
- [ ] ResizeObserver tracks iframe dimensions
- [ ] canvasRect updates on window resize
- [ ] canvasRect updates on iframe load
- [ ] Pointer events CSS variable toggles correctly
- [ ] Edit mode disables iframe pointer events
- [ ] Preview mode enables iframe pointer events
- [ ] Scale factor tracked and available to overlay system
- [ ] Cross-origin postMessage still works with credentialless
## Done summary
Implemented iframe security with credentialless attribute and rect tracking
## Evidence
- Commits:
- Tests:
- PRs: