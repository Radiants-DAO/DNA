# impl-02: PixelPlayground left-island absolute-tab shim

Collapses the `absolute` tab strip + `pt-11` body offset into a normal flex column (F1 from `10-pixel-studio.md`).

## File changed

- `apps/rad-os/components/apps/pixel-playground/PixelPlayground.tsx:62-80`

## Before

```tsx
<div className="relative h-full min-h-0">
  <div className="absolute top-0 left-0 right-0 z-10 px-3 py-2 border-b border-line bg-card">
    <ModeNav ... />
  </div>
  <div className="h-full pt-11 flex flex-col min-h-0">
    ...body...
  </div>
</div>
```

## After

```tsx
<div className="flex flex-col h-full min-h-0">
  <div className="shrink-0 px-3 py-2 border-b border-line bg-card">
    <ModeNav ... />
  </div>
  <div className="flex-1 min-h-0 flex flex-col">
    ...body...
  </div>
</div>
```

## Why equivalent

The tab strip's `px-3 py-2 border-b border-line bg-card` is unchanged, so its rendered height is identical (`~44px` ≈ the `pt-11 = 2.75rem` magic offset it was reserving). Promoted to `shrink-0` in normal flow, it takes its natural content height. The body uses `flex-1 min-h-0` to fill remaining space — same available area as before. The inner scroll region (`flex-1 min-h-0 overflow-y-auto` at :122) and all body children are unchanged. Drops the `relative`/`absolute`/`z-10`/`pt-11` quartet and the fragile height-match assumption.

No consumers touch the internal shape — `<PixelPlayground />` is instantiated from `LabApp.tsx:44` only.
