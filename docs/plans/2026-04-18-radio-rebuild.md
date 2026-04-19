# Radio Rebuild (side-by-side with RadRadio)

**Worktree:** `~/Desktop/dev/DNA` (main)
**Date:** 2026-04-18
**Status:** approved

## Intent

Rebuild the music app as a new `Radio` component driven by the Paper design at `app.paper.design/file/01KP7YATPHZNBNEC215AM9958W`. Keep existing `RadRadioApp` untouched and functional. Share the same Zustand audio store, same video list, and same `<audio>` pipeline. Add SLOW + REVERB WebAudio effects.

## Component map

### ctrl changes
- **NEW** `packages/ctrl/layout/LCDScreen/` — black inset panel, yellow rim, radial sheen
- **NEW** `packages/ctrl/selectors/TransportPill/` — rounded pill wrapping N transport buttons with end-cap rounding
- **UPDATE** `packages/ctrl/controls/Fader/Fader.tsx` — add `orientation: 'horizontal' | 'vertical'`
- **UPDATE** `packages/ctrl/readouts/Meter/Meter.tsx` — add `glow?: boolean` and peak-cap color

### app-local (`apps/rad-os/components/apps/radio/`)
- `Radio.tsx` — main shell
- `RadioFrame.tsx` — 277×535 dot-pattern widget + drag
- `RadioTitleBar.tsx` — floating pill of radiants `Button` controls (close/min/fullscreen/pip)
- `RadioDisc.tsx` — 400×400 disc, inner 256-circle masking the video, 36 perimeter ticks lit by track progress
- `RadioVisualizer.tsx` — 32-LED playback progress strip
- `RadioEffectsRow.tsx` — [L-meter] [SLOW + REVERB faders] [R-meter]
- `useWebAudioEffects.ts` — audio graph (playbackRate slow + convolver reverb + AnalyserNode)

### other
- `radRadioSlice.ts` — add `radioSlow`, `radioReverb`, `radioSetSlow`, `radioSetReverb`
- `AppWindow.tsx` — add `chromeless?: boolean` prop
- `catalog.tsx` — add `id: 'radio'` entry alongside `id: 'music'`

## Tasks

### Batch 1 — foundation
- [ ] T1. Extend `radRadioSlice` with slow + reverb state/actions
- [ ] T2. Add `chromeless` prop to `AppWindow` (hides titlebar, renders full-bleed, keeps drag)
- [ ] T3. Build `useWebAudioEffects` hook — wires `audioRef` into `AudioContext → source → (dry + convolver) → destination`, exposes analyser + setSlow/setReverb

### Batch 2 — ctrl primitives
- [ ] T4. Add `LCDScreen` to `packages/ctrl/layout/`, export from `packages/ctrl/index.ts`
- [ ] T5. Add `TransportPill` to `packages/ctrl/selectors/`, export from `packages/ctrl/index.ts`
- [ ] T6. Update `Fader` to support `orientation: 'horizontal'` (groove + thumb + ticks)
- [ ] T7. Update `Meter` to support `glow?: boolean` and `peakCapColor?`

### Batch 3 — radio app pieces
- [ ] T8. `RadioFrame` — outer 277×535 widget, dot-pattern bg, drag handle
- [ ] T9. `RadioTitleBar` — floating pill with window controls, uses window context
- [ ] T10. `RadioDisc` — circular video clip + 36 tick ring driven by currentTime/duration
- [ ] T11. `RadioVisualizer` — 32 LEDs fill by progress ratio
- [ ] T12. `RadioEffectsRow` — L-meter + SLOW + REVERB + R-meter layout

### Batch 4 — wiring
- [ ] T13. `Radio.tsx` — compose everything, mount `RadRadioController` + `useWebAudioEffects`, render `RadioTitleBar` as floating overlay
- [ ] T14. Add catalog entry `id: 'radio'` with `chromeless: true`, `resizable: false`, `contentPadding: false`, `defaultSize: { width: 277, height: 535 }`
- [ ] T15. Verify: `pnpm build`, lint the new files, visually sanity-check in dev

## Verifications

- `pnpm -w build` passes
- `pnpm -w lint` — no new errors in touched files
- `Radio` app launches from start menu, renders at 277×535, draggable
- Floating titlebar controls close/minimize work
- Play a track → video clips to the disc center, ticks rotate, 32-LED strip fills, VU meters move
- SLOW fader slows audio (pitch preserved disabled = true "chopped/screwed"), REVERB fader blends wet/dry

## Out of scope (v1)
- Favorite / queue / channel selector
- Persisting slow/reverb values across sessions
