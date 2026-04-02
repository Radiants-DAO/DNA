'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRadOSStore } from '@/store';
import { getWindowChrome } from '@/lib/apps';
import { resolveWindowSize, remToPx } from '@/lib/windowSizing';

// ============================================================================
// Push 2 MIDI Mapping — User Mode
// ============================================================================

// Bottom row pads → app launch/toggle
// Tap = open & focus. Tap focused = close. Tap unfocused = bring to front.
const APP_PADS: Record<number, string> = {
  36: 'brand',       // (7,0) Design Codex
  37: 'manifesto',   // (7,1) Becoming Substance
  38: 'music',       // (7,2) Rad Radio
  39: 'about',       // (7,3) About
  40: 'good-news',   // (7,4) Good News
  41: 'scratchpad',  // (7,5) Scratchpad
  42: 'studio',      // (7,6) Radiants Studio
};
const CLOSE_ALL_PAD = 43; // (7,7) — close all windows

// Row 6 pads → fullscreen toggle (mirrors app order)
const FULLSCREEN_PADS: Record<number, string> = {
  44: 'brand',
  45: 'manifesto',
  46: 'music',
  47: 'about',
  48: 'good-news',
  49: 'scratchpad',
  50: 'studio',
};

// Encoder CCs — these are typical Push 2 User Mode values.
// If they don't respond, check the console log for incoming CC numbers and adjust.
const ENCODER = {
  MOVE_X: 71,  // encoder 0: move window horizontally
  MOVE_Y: 72,  // encoder 1: move window vertically
  SIZE_W: 73,  // encoder 2: resize width
  SIZE_H: 74,  // encoder 3: resize height
  VOLUME: 75,  // encoder 4: rad radio volume
};

// Sensitivity
const MOVE_STEP = 12;   // px per encoder tick
const RESIZE_STEP = 20; // px per encoder tick

// Push 2 default pad color palette indices
const LED = {
  OFF: 0,
  DIM: 1,
  RED: 5,
  ORANGE: 9,
  YELLOW: 13,
  GREEN: 21,
  SPRING: 25,
  CYAN: 33,
  BLUE: 45,
  PURPLE: 49,
  PINK: 53,
  WHITE: 3,
  BRIGHT: 127,
};

// Each app gets a unique pad color
const APP_LED: Record<string, { open: number; focused: number }> = {
  'brand':      { open: LED.YELLOW,  focused: LED.BRIGHT },
  'manifesto':  { open: LED.ORANGE,  focused: LED.BRIGHT },
  'music':      { open: LED.GREEN,   focused: LED.BRIGHT },
  'about':      { open: LED.CYAN,    focused: LED.BRIGHT },
  'good-news':  { open: LED.BLUE,    focused: LED.BRIGHT },
  'scratchpad': { open: LED.PURPLE,  focused: LED.BRIGHT },
  'studio':     { open: LED.PINK,    focused: LED.BRIGHT },
};

// ============================================================================
// Helpers
// ============================================================================

/** Decode Push 2 relative encoder to signed integer */
function decodeRelative(value: number): number {
  return value < 64 ? value : value - 128;
}

/** Find topmost open window by zIndex */
function getTopWindowId(
  windows: Array<{ id: string; isOpen: boolean; zIndex: number }>
): string | undefined {
  let top: (typeof windows)[0] | undefined;
  for (const w of windows) {
    if (w.isOpen && (!top || w.zIndex > top.zIndex)) top = w;
  }
  return top?.id;
}

/** Resolve a window's current pixel size (runtime or catalog default) */
function resolveCurrentSize(
  w: { id: string; size?: { width: number; height: number } }
): { width: number; height: number } {
  if (w.size) return w.size;
  const chrome = getWindowChrome(w.id);
  const css = chrome?.defaultSize ? resolveWindowSize(chrome.defaultSize) : undefined;
  return css
    ? { width: remToPx(css.width), height: remToPx(css.height) }
    : { width: 600, height: 400 };
}

// ============================================================================
// Hook
// ============================================================================

export function usePush2() {
  const outputRef = useRef<MIDIOutput | null>(null);

  const store = useRadOSStore;

  // -- Send a pad LED color via Note On (velocity = palette index) --
  const setPadLED = useCallback((note: number, color: number) => {
    const out = outputRef.current;
    if (!out) return;
    out.send(color === 0 ? [0x80, note, 0] : [0x90, note, color]);
  }, []);

  // -- Refresh all pad LEDs to match current window state --
  const refreshLEDs = useCallback(() => {
    const { windows } = store.getState();
    const topId = getTopWindowId(windows);

    // App row (bottom)
    for (const [noteStr, appId] of Object.entries(APP_PADS)) {
      const note = Number(noteStr);
      const w = windows.find((w) => w.id === appId);
      const colors = APP_LED[appId];
      if (!colors) { setPadLED(note, LED.OFF); continue; }

      if (!w || !w.isOpen) {
        setPadLED(note, LED.DIM);
      } else if (w.id === topId) {
        setPadLED(note, colors.focused);
      } else {
        setPadLED(note, colors.open);
      }
    }

    // Fullscreen row
    for (const [noteStr, appId] of Object.entries(FULLSCREEN_PADS)) {
      const note = Number(noteStr);
      const w = windows.find((w) => w.id === appId);
      if (w?.isOpen && w.isFullscreen) {
        setPadLED(note, LED.BLUE);
      } else if (w?.isOpen) {
        setPadLED(note, LED.DIM);
      } else {
        setPadLED(note, LED.OFF);
      }
    }

    // Close-all pad — red when windows open, dim otherwise
    setPadLED(CLOSE_ALL_PAD, windows.some((w) => w.isOpen) ? LED.RED : LED.DIM);
  }, [store, setPadLED]);

  // -- Handle incoming MIDI --
  const handleMIDI = useCallback(
    (event: MIDIMessageEvent) => {
      const data = event.data;
      if (!data || data.length < 2) return;
      const status = data[0];
      const d1 = data[1];
      const d2 = data.length > 2 ? data[2] : 0;
      const type = status & 0xf0;

      // --- Note On (pad press) ---
      if (type === 0x90 && d2 > 0) {
        const state = store.getState();

        // App toggle
        if (d1 in APP_PADS) {
          const appId = APP_PADS[d1];
          const w = state.windows.find((w) => w.id === appId);
          if (!w || !w.isOpen) {
            state.openWindow(appId);
          } else if (w.id === getTopWindowId(state.windows)) {
            state.closeWindow(appId);
          } else {
            state.focusWindow(appId);
          }
          requestAnimationFrame(refreshLEDs);
          return;
        }

        // Fullscreen toggle
        if (d1 in FULLSCREEN_PADS) {
          const appId = FULLSCREEN_PADS[d1];
          const w = state.windows.find((w) => w.id === appId);
          if (w?.isOpen) {
            state.toggleFullscreen(appId);
            requestAnimationFrame(refreshLEDs);
          }
          return;
        }

        // Close all
        if (d1 === CLOSE_ALL_PAD) {
          for (const w of state.windows) {
            if (w.isOpen) state.closeWindow(w.id);
          }
          requestAnimationFrame(refreshLEDs);
          return;
        }
      }

      // --- CC (encoder / button) ---
      if (type === 0xb0) {
        const cc = d1;
        // Debug: uncomment to discover your Push 2's CC numbers
        // console.log(`[Push2] CC ${cc} value=${d2} delta=${decodeRelative(d2)}`);
        const delta = decodeRelative(d2);
        const state = store.getState();
        const topId = getTopWindowId(state.windows);
        if (!topId) return;

        const w = state.windows.find((w) => w.id === topId);
        if (!w) return;

        if (cc === ENCODER.MOVE_X) {
          state.updateWindowPosition(topId, {
            x: w.position.x + delta * MOVE_STEP,
            y: w.position.y,
          });
        } else if (cc === ENCODER.MOVE_Y) {
          state.updateWindowPosition(topId, {
            x: w.position.x,
            y: w.position.y + delta * MOVE_STEP,
          });
        } else if (cc === ENCODER.SIZE_W) {
          const size = resolveCurrentSize(w);
          state.updateWindowSize(topId, {
            width: Math.max(300, size.width + delta * RESIZE_STEP),
            height: size.height,
          });
        } else if (cc === ENCODER.SIZE_H) {
          const size = resolveCurrentSize(w);
          state.updateWindowSize(topId, {
            width: size.width,
            height: Math.max(200, size.height + delta * RESIZE_STEP),
          });
        } else if (cc === ENCODER.VOLUME) {
          const vol = state.volume;
          state.setVolume(Math.max(0, Math.min(100, vol + delta * 2)));
        }
      }
    },
    [store, refreshLEDs]
  );

  // -- Connect to Push 2 via Web MIDI --
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
      console.warn('[Push2] Web MIDI API not available in this browser');
      return;
    }

    let input: MIDIInput | null = null;
    let unsub: (() => void) | null = null;
    let cancelled = false;

    navigator.requestMIDIAccess({ sysex: false }).then((access) => {
      if (cancelled) return;

      // Find Push 2 User Port (preferred) or any Push 2 port
      let foundInput: MIDIInput | null = null;
      let foundOutput: MIDIOutput | null = null;

      for (const [, port] of access.inputs) {
        const name = port.name ?? '';
        if (name.includes('Push 2') && name.toLowerCase().includes('user')) {
          foundInput = port;
          break;
        }
        if (name.includes('Push 2') && !foundInput) foundInput = port;
      }
      for (const [, port] of access.outputs) {
        const name = port.name ?? '';
        if (name.includes('Push 2') && name.toLowerCase().includes('user')) {
          foundOutput = port;
          break;
        }
        if (name.includes('Push 2') && !foundOutput) foundOutput = port;
      }

      if (!foundInput) {
        console.warn(
          '[Push2] No Push 2 found. Available MIDI inputs:',
          [...access.inputs.values()].map((p) => p.name)
        );
        return;
      }

      input = foundInput;
      outputRef.current = foundOutput;
      input.onmidimessage = handleMIDI;

      console.log(
        `[Push2] Connected — input: "${input.name}", output: "${foundOutput?.name ?? 'none'}"`
      );

      // Light up pads to current state
      refreshLEDs();

      // Keep LEDs in sync as windows change
      unsub = store.subscribe(refreshLEDs);
    }).catch((err) => {
      console.error('[Push2] MIDI access denied:', err);
    });

    return () => {
      cancelled = true;
      if (input) input.onmidimessage = null;
      unsub?.();
      // Turn off all mapped pads on disconnect
      if (outputRef.current) {
        for (const note of [...Object.keys(APP_PADS), ...Object.keys(FULLSCREEN_PADS), String(CLOSE_ALL_PAD)]) {
          outputRef.current.send([0x80, Number(note), 0]);
        }
      }
      outputRef.current = null;
    };
  }, [handleMIDI, refreshLEDs, store]);
}
