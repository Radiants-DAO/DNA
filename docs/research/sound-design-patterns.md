# Sound Design Patterns

> Research document for fn-4.6: Sound design patterns (audio sprites, categories, volume tokens)

## Executive Summary

This document defines sound design patterns for design systems, covering audio sprite management, sound categories, volume tokens, and user preference persistence. Sound is an often-overlooked dimension of UI/UX that can significantly enhance feedback, engagement, and accessibility when implemented thoughtfully.

**Key Insight:** The auditory cortex processes sound in ~25ms compared to ~250ms for visual processing. Sound provides immediate feedback where visual cues alone cannot compete in temporal responsiveness.

**Implementation Status:** Research only (deferred implementation). This document provides specifications for future audio infrastructure in theme-rad-os and RadFlow.

---

## Sound Design Philosophy for RadOS

### Alignment with Design System Character

RadOS's retro-modern aesthetic suggests a **mechanical, tactile** sound approach:

| Visual Pattern | Audio Equivalent |
|----------------|------------------|
| Hard pixel shadows | Crisp, defined sounds (no reverb) |
| Lift-and-press interaction | Mechanical click sounds |
| Retro 80s-90s aesthetic | 8-bit inspired tones, vintage computer sounds |
| Warm colors (yellow/cream) | Warm, friendly tones (not harsh beeps) |
| Max 300ms animation | Max 300ms sound duration |

### Core Principles

1. **Sound is optional, never required** - Every audio cue must have a visual equivalent
2. **Subtle over aggressive** - Sounds should complement, not distract
3. **Consistency builds recognition** - Same action = same sound
4. **User control is paramount** - Mute, volume, and category controls required
5. **Accessibility first** - Respect `prefers-reduced-motion` as audio proxy until `prefers-reduced-audio` exists

---

## Sound Categories

### Primary Categories

Based on Material Design, UX Sound, and industry research:

| Category | Purpose | Frequency | Volume Level | Examples |
|----------|---------|-----------|--------------|----------|
| **Feedback** | Confirm user actions | High | Low | Button click, toggle, selection |
| **Confirmation** | Signal success/completion | Medium | Medium | Save complete, upload done, payment success |
| **Error** | Alert to problems | Low | Medium-High | Validation error, action failed, connection lost |
| **Notification** | Attract attention | Variable | Medium | New message, reminder, update available |
| **Hero** | Celebrate achievements | Rare | High | Level complete, milestone reached, first-time action |
| **Ambient** | Background atmosphere | Continuous | Very Low | Focus mode, workspace ambiance |

### Category Token Mapping

```css
:root {
  /* Sound category volume levels (0.0 - 1.0) */
  --sound-volume-feedback: 0.3;
  --sound-volume-confirmation: 0.5;
  --sound-volume-error: 0.6;
  --sound-volume-notification: 0.5;
  --sound-volume-hero: 0.7;
  --sound-volume-ambient: 0.15;

  /* Master volume multiplier */
  --sound-volume-master: 1.0;
}
```

### Sound Type Details

#### Feedback Sounds (Earcons)

Short, subtle sounds confirming micro-interactions:
- **Button press**: Click sound (50-100ms)
- **Toggle switch**: On/off distinction (80-120ms)
- **Selection**: Highlight sound (50ms)
- **Hover** (optional): Very subtle (30ms) - often omitted

**Design Principle:** The more frequent an interaction, the less intrusive the sound.

#### Confirmation Sounds

Indicate successful completion of meaningful actions:
- **Form submission**: Positive chime (200-300ms)
- **File upload complete**: Success tone (200ms)
- **Save successful**: Brief confirmation (150ms)
- **Payment complete**: Celebratory but professional (300ms)

#### Error/Alert Sounds

Demand attention without causing alarm:
- **Validation error**: Warning tone (150ms)
- **Action blocked**: Denial sound (100ms)
- **Connection lost**: Alert tone (200ms)
- **System error**: More urgent than validation (250ms)

**Design Principle:** Error sounds should inform, not punish. Avoid harsh or startling tones.

#### Notification Sounds

Interrupt without visual dependency:
- **New message**: Attention-getting but pleasant (200ms)
- **Reminder**: Gentle ping (150ms)
- **Update available**: Soft notification (150ms)

#### Hero Sounds

Celebrate significant moments:
- **First-time completion**: Reward sound (300ms)
- **Achievement unlocked**: Celebration (400ms)
- **Milestone reached**: Fanfare (500ms max)

---

## Volume Token System

### Semantic Volume Scale

Volume tokens use semantic naming for intent, not raw values:

| Token | Linear Value | dB (approx) | Use Case |
|-------|--------------|-------------|----------|
| `--volume-silent` | 0.0 | -∞ | Muted state |
| `--volume-whisper` | 0.1 | -20 dB | Ambient, background |
| `--volume-soft` | 0.25 | -12 dB | Subtle feedback |
| `--volume-low` | 0.4 | -8 dB | Standard feedback |
| `--volume-medium` | 0.6 | -4 dB | Notifications, confirmations |
| `--volume-high` | 0.8 | -2 dB | Alerts, errors |
| `--volume-full` | 1.0 | 0 dB | Maximum (rare) |

### Volume Architecture

```css
:root {
  /* Base volume scale */
  --volume-silent: 0;
  --volume-whisper: 0.1;
  --volume-soft: 0.25;
  --volume-low: 0.4;
  --volume-medium: 0.6;
  --volume-high: 0.8;
  --volume-full: 1.0;

  /* Master volume (user-controlled, 0-1) */
  --volume-master: 1.0;

  /* Category-specific volumes (reference semantic scale) */
  --volume-category-feedback: var(--volume-soft);
  --volume-category-confirmation: var(--volume-medium);
  --volume-category-error: var(--volume-high);
  --volume-category-notification: var(--volume-medium);
  --volume-category-hero: var(--volume-high);
  --volume-category-ambient: var(--volume-whisper);
}
```

### Volume Calculation

Final volume for any sound:

```javascript
const effectiveVolume =
  baseVolume *
  categoryVolume *
  masterVolume;
```

### Logarithmic Volume Control

Volume perception is logarithmic. A linear slider creates poor UX where small movements at the low end cause large perceptual changes.

**Recommendation:** Use logarithmic volume curves for slider controls:

```javascript
// Convert linear slider (0-1) to logarithmic volume
function linearToVolume(linear) {
  if (linear === 0) return 0;
  // Using a power curve approximation
  return Math.pow(linear, 2);
}

// Convert volume to linear slider position
function volumeToLinear(volume) {
  if (volume === 0) return 0;
  return Math.sqrt(volume);
}
```

---

## Audio Sprite Management

### What Are Audio Sprites?

Audio sprites combine multiple sounds into a single file with a JSON manifest defining segment positions. Similar to image sprite sheets, this reduces HTTP requests and improves loading performance.

### Sprite Structure

```
sounds/
├── ui-sounds.mp3          # Combined audio file
├── ui-sounds.ogg          # Fallback format
├── ui-sounds.m4a          # iOS optimization
└── ui-sounds.json         # Manifest
```

### Manifest Format

```json
{
  "src": ["ui-sounds.ogg", "ui-sounds.mp3", "ui-sounds.m4a"],
  "sprite": {
    "button-click": [0, 100],
    "toggle-on": [200, 120],
    "toggle-off": [400, 100],
    "error": [600, 200],
    "success": [900, 250],
    "notification": [1200, 180]
  }
}
```

Format: `"name": [startTime (ms), duration (ms)]`

### Creating Audio Sprites

Use the `audiosprite` CLI tool (ffmpeg wrapper):

```bash
npm install -g audiosprite

audiosprite \
  --output ui-sounds \
  --format howler \
  --export ogg,mp3,m4a \
  sounds/button-click.wav \
  sounds/toggle-on.wav \
  sounds/toggle-off.wav \
  sounds/error.wav \
  sounds/success.wav \
  sounds/notification.wav
```

### Howler.js Integration

```javascript
import { Howl } from 'howler';
import spriteData from './ui-sounds.json';

const uiSounds = new Howl({
  src: spriteData.src,
  sprite: spriteData.sprite,
  volume: 0.5,
});

// Play a specific sound
uiSounds.play('button-click');
uiSounds.play('success');
```

### When to Use Sprites vs. Individual Files

| Approach | Best For |
|----------|----------|
| **Audio Sprites** | Multiple short UI sounds, games, high-interaction apps |
| **Individual Files** | Few sounds, long-form audio, dynamic loading |
| **Hybrid** | Sprite for UI sounds + individual for hero sounds |

---

## Technical Implementation

### Recommended Libraries

| Library | Best For | Size |
|---------|----------|------|
| **Howler.js** | General UI sounds, sprites, cross-browser | 7KB |
| **Tone.js** | Synthesis, music, sequencing | 60KB |
| **Web Audio API** | Direct control, custom processing | Native |

### Basic Implementation Pattern

```typescript
// sound-manager.ts
import { Howl } from 'howler';

interface SoundConfig {
  src: string[];
  sprite?: Record<string, [number, number]>;
}

class SoundManager {
  private sounds: Map<string, Howl> = new Map();
  private masterVolume: number = 1.0;
  private categoryVolumes: Record<string, number> = {
    feedback: 0.3,
    confirmation: 0.5,
    error: 0.6,
    notification: 0.5,
    hero: 0.7,
    ambient: 0.15,
  };
  private enabled: boolean = true;

  load(name: string, config: SoundConfig, category: string) {
    const sound = new Howl({
      ...config,
      volume: this.getEffectiveVolume(category),
    });
    this.sounds.set(name, sound);
  }

  play(name: string, spriteId?: string) {
    if (!this.enabled) return;

    const sound = this.sounds.get(name);
    if (sound) {
      sound.play(spriteId);
    }
  }

  setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  }

  setCategoryVolume(category: string, volume: number) {
    this.categoryVolumes[category] = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private getEffectiveVolume(category: string): number {
    return this.masterVolume * (this.categoryVolumes[category] || 0.5);
  }

  private updateAllVolumes() {
    // Implementation to update all loaded sound volumes
  }
}

export const soundManager = new SoundManager();
```

### React Hook Pattern

```typescript
// use-sound.ts
import { useCallback, useEffect } from 'react';
import { soundManager } from './sound-manager';

export function useSound(soundName: string, spriteId?: string) {
  const play = useCallback(() => {
    soundManager.play(soundName, spriteId);
  }, [soundName, spriteId]);

  return play;
}

// Usage in component
function Button({ onClick, children }) {
  const playClick = useSound('ui-sounds', 'button-click');

  const handleClick = (e) => {
    playClick();
    onClick?.(e);
  };

  return <button onClick={handleClick}>{children}</button>;
}
```

### Web Audio API Direct Usage

For simple cases without library overhead:

```typescript
class SimpleAudioPlayer {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();

  async init() {
    this.audioContext = new AudioContext();
  }

  async load(name: string, url: string) {
    if (!this.audioContext) await this.init();

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
    this.sounds.set(name, audioBuffer);
  }

  play(name: string, volume: number = 0.5) {
    if (!this.audioContext) return;

    const buffer = this.sounds.get(name);
    if (!buffer) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = buffer;
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    source.start();
  }
}
```

---

## Preference Persistence

### User Preferences Schema

```typescript
interface SoundPreferences {
  enabled: boolean;           // Master on/off
  masterVolume: number;       // 0.0 - 1.0
  categories: {
    feedback: boolean;        // Per-category toggles
    confirmation: boolean;
    error: boolean;
    notification: boolean;
    hero: boolean;
    ambient: boolean;
  };
  categoryVolumes: {
    feedback: number;
    confirmation: number;
    error: number;
    notification: number;
    hero: number;
    ambient: number;
  };
}

const defaultPreferences: SoundPreferences = {
  enabled: true,
  masterVolume: 0.7,
  categories: {
    feedback: true,
    confirmation: true,
    error: true,
    notification: true,
    hero: true,
    ambient: false,  // Off by default
  },
  categoryVolumes: {
    feedback: 0.3,
    confirmation: 0.5,
    error: 0.6,
    notification: 0.5,
    hero: 0.7,
    ambient: 0.15,
  },
};
```

### Storage Strategies

#### LocalStorage (Simple)

```typescript
const STORAGE_KEY = 'radflow-sound-preferences';

function loadPreferences(): SoundPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('Failed to load sound preferences');
  }
  return defaultPreferences;
}

function savePreferences(prefs: SoundPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('Failed to save sound preferences');
  }
}
```

#### Tauri Persistent Storage

For RadFlow desktop app:

```rust
// Rust side: use tauri-plugin-store
use tauri_plugin_store::StoreExt;

#[tauri::command]
fn get_sound_preferences(app: tauri::AppHandle) -> Result<SoundPreferences, String> {
    let store = app.store("settings.json")?;
    let prefs = store.get("sound_preferences")
        .and_then(|v| serde_json::from_value(v.clone()).ok())
        .unwrap_or_default();
    Ok(prefs)
}

#[tauri::command]
fn set_sound_preferences(
    app: tauri::AppHandle,
    prefs: SoundPreferences
) -> Result<(), String> {
    let store = app.store("settings.json")?;
    store.set("sound_preferences", serde_json::to_value(prefs)?);
    store.save()?;
    Ok(())
}
```

### System Preference Detection

#### Reduced Motion as Audio Proxy

Until `prefers-reduced-audio` is standardized, use `prefers-reduced-motion` as a signal:

```typescript
function shouldReduceSound(): boolean {
  // Check user's explicit preference first
  const prefs = loadPreferences();
  if (!prefs.enabled) return true;

  // Fall back to system preference
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

#### Proposed: prefers-reduced-audio Detection

For future-proofing:

```typescript
function checkAudioPreference(): 'reduce' | 'no-preference' {
  // Future standard (not yet implemented in browsers)
  const reducedAudio = window.matchMedia('(prefers-reduced-audio: reduce)');
  if (reducedAudio.matches) return 'reduce';

  // Fall back to motion preference
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches) return 'reduce';

  return 'no-preference';
}
```

---

## Accessibility Considerations

### WCAG Guidelines

1. **No audio autoplay** - User must initiate audio
2. **Audio control available** - Pause/mute within 3 seconds of page load
3. **Visual alternatives** - Every sound has visual feedback equivalent
4. **Volume control** - User can adjust or mute
5. **No audio-only information** - Critical info never conveyed solely through sound

### Implementation Checklist

- [ ] Master mute toggle prominently accessible
- [ ] Per-category sound controls in settings
- [ ] Respect `prefers-reduced-motion` for audio
- [ ] No sound plays on page load
- [ ] All sounds have visual equivalents
- [ ] Error sounds accompanied by visual error states
- [ ] Notification sounds accompanied by visual notifications
- [ ] Screen reader announcements don't conflict with sounds

### Non-Use Cases

Identify when sound should NOT play:

- Device on silent/vibrate mode
- User has muted sounds
- `prefers-reduced-motion` is enabled
- Page is not visible (tab backgrounded)
- Another app/media is playing (optional)

```typescript
function shouldPlaySound(): boolean {
  // Check document visibility
  if (document.hidden) return false;

  // Check user preferences
  const prefs = loadPreferences();
  if (!prefs.enabled) return false;

  // Check system preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }

  return true;
}
```

---

## Sound Design Specifications for RadOS

### Recommended Sound Characteristics

Based on RadOS visual design language:

| Characteristic | Visual Equivalent | Audio Specification |
|----------------|-------------------|---------------------|
| Hard pixel shadows | No reverb/echo | Dry, direct sounds |
| Retro 80s-90s | Vintage computer | 8-bit inspired, chip sounds |
| Warm colors | Warm tones | Mid-frequency emphasis, avoid harsh highs |
| Subtle radius | Subtle attack | Soft attack, natural decay |
| Mechanical interaction | Mechanical sounds | Clicks, clacks, tactile |

### Duration Alignment

Match sound duration to animation duration tokens:

| Motion Token | Duration | Sound Duration |
|--------------|----------|----------------|
| `--duration-fast` | 100ms | 50-100ms |
| `--duration-base` | 150ms | 100-150ms |
| `--duration-moderate` | 200ms | 150-200ms |
| `--duration-slow` | 300ms | 200-300ms |

### Sound Token Proposals for RadOS

```css
:root {
  /* Sound duration tokens (align with motion) */
  --sound-duration-micro: 50ms;    /* Hover, micro feedback */
  --sound-duration-short: 100ms;   /* Button clicks, toggles */
  --sound-duration-medium: 200ms;  /* Confirmations, notifications */
  --sound-duration-long: 300ms;    /* Hero sounds, max duration */

  /* Sound character tokens */
  --sound-attack: 10ms;            /* Fast attack for mechanical feel */
  --sound-decay: 100ms;            /* Natural decay */
  --sound-reverb: 0;               /* No reverb (dry like hard shadows) */
}
```

---

## Settings UI Design

### Sound Settings Panel

```
┌─────────────────────────────────────────────────────────────┐
│  SOUND SETTINGS                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Master Volume              ████████████░░░░░░ 70%  [🔊]    │
│                                                              │
│  ─────────────────────────────────────────────────────      │
│                                                              │
│  Sound Categories                                            │
│                                                              │
│  [✓] Feedback sounds        ████░░░░░░░░░░░░ 30%            │
│      Button clicks, toggles                                  │
│                                                              │
│  [✓] Confirmation sounds    ██████████░░░░░░ 50%            │
│      Success, save complete                                  │
│                                                              │
│  [✓] Error sounds           ████████████░░░░ 60%            │
│      Validation, failures                                    │
│                                                              │
│  [✓] Notifications          ██████████░░░░░░ 50%            │
│      Messages, updates                                       │
│                                                              │
│  [ ] Ambient sounds         ████░░░░░░░░░░░░ 15%            │
│      Background atmosphere                                   │
│                                                              │
│  ─────────────────────────────────────────────────────      │
│                                                              │
│  [Test Sounds]        [Reset to Defaults]                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Quick Access Control

Keyboard shortcut: `Cmd/Ctrl + Shift + M` - Toggle master mute

Menu bar indicator showing current sound state:
- 🔊 Sounds enabled
- 🔇 Sounds muted

---

## File Organization

### Recommended Structure

```
packages/theme-rad-os/
├── sounds/
│   ├── sprites/
│   │   ├── ui-sounds.ogg
│   │   ├── ui-sounds.mp3
│   │   ├── ui-sounds.m4a
│   │   └── ui-sounds.json
│   └── individual/
│       └── hero-success.mp3
├── tokens/
│   └── sound.css             # Volume and duration tokens
└── lib/
    └── sound-manager.ts      # Sound management utilities
```

### Token File: sound.css

```css
:root {
  /* Sound enabled state (controlled via JS) */
  --sound-enabled: 1;

  /* Master volume */
  --sound-volume-master: 0.7;

  /* Volume scale */
  --volume-silent: 0;
  --volume-whisper: 0.1;
  --volume-soft: 0.25;
  --volume-low: 0.4;
  --volume-medium: 0.6;
  --volume-high: 0.8;
  --volume-full: 1.0;

  /* Category default volumes */
  --sound-volume-feedback: var(--volume-soft);
  --sound-volume-confirmation: var(--volume-medium);
  --sound-volume-error: var(--volume-high);
  --sound-volume-notification: var(--volume-medium);
  --sound-volume-hero: var(--volume-high);
  --sound-volume-ambient: var(--volume-whisper);

  /* Duration tokens (align with motion) */
  --sound-duration-micro: 50ms;
  --sound-duration-short: 100ms;
  --sound-duration-medium: 200ms;
  --sound-duration-long: 300ms;
}
```

---

## Implementation Recommendations

### Phase 1: Foundation (When Ready)

1. **Add Howler.js** to project dependencies
2. **Create sound token CSS** file with volume scale
3. **Implement SoundManager** class
4. **Add preference persistence** (localStorage for web, Tauri store for desktop)
5. **Create Settings UI** for sound preferences

### Phase 2: Integration

1. **Create audio sprites** for UI sounds
2. **Add useSound hook** for React components
3. **Integrate sounds** with existing components (buttons, toggles, etc.)
4. **Add keyboard shortcut** for mute toggle
5. **Implement reduced-motion detection**

### Phase 3: Polish

1. **Design custom RadOS sounds** matching visual aesthetic
2. **Add hero sounds** for achievements/milestones
3. **Implement category-specific** volume controls
4. **Add sound preview** in settings
5. **Performance optimization** (preloading, lazy loading)

### Priority Matrix

| Task | Complexity | Impact | Priority |
|------|------------|--------|----------|
| Volume tokens | Low | Medium | P1 |
| SoundManager class | Medium | High | P1 |
| Preference persistence | Low | High | P1 |
| Audio sprites | Medium | Medium | P2 |
| Settings UI | Medium | Medium | P2 |
| Custom sound design | High | High | P3 |
| Hero sounds | Medium | Low | P3 |

---

## References

### Research Sources

- [UserInterface.wiki: Sounds on the Web](https://www.userinterface.wiki/sounds-on-the-web)
- [Material Design: Applying Sound to UI](https://m2.material.io/design/sound/applying-sound-to-ui.html)
- [UX Sound: Types of UX/UI Sounds](https://ux-sound.com/types-of-ux-ui-sounds/)
- [Smashing Magazine: Guidelines for Designing with Audio](https://www.smashingmagazine.com/2012/09/guidelines-for-designing-with-audio/)
- [Google Design: Sound & Touch](https://design.google/library/ux-sound-haptic-material-design)
- [Web Audio API Book: Volume and Loudness](https://webaudioapi.com/book/Web_Audio_API_Boris_Smus_html/ch03.html)
- [Howler.js Documentation](https://howlerjs.com/)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)

### Project Context

- DESIGN_SYSTEM.md animation constraints
- motion-token-system.md duration alignment
- accessibility-tokens.md preference patterns

---

## Appendix: Token Quick Reference

### Volume Tokens

```css
--volume-silent   /* 0.0   | Muted */
--volume-whisper  /* 0.1   | Ambient, background */
--volume-soft     /* 0.25  | Subtle feedback */
--volume-low      /* 0.4   | Standard feedback */
--volume-medium   /* 0.6   | Notifications */
--volume-high     /* 0.8   | Alerts, errors */
--volume-full     /* 1.0   | Maximum */
```

### Category Volumes

```css
--sound-volume-feedback       /* soft (0.25) */
--sound-volume-confirmation   /* medium (0.6) */
--sound-volume-error          /* high (0.8) */
--sound-volume-notification   /* medium (0.6) */
--sound-volume-hero           /* high (0.8) */
--sound-volume-ambient        /* whisper (0.1) */
```

### Duration Tokens

```css
--sound-duration-micro   /* 50ms  | Hover feedback */
--sound-duration-short   /* 100ms | Clicks, toggles */
--sound-duration-medium  /* 200ms | Confirmations */
--sound-duration-long    /* 300ms | Hero sounds */
```
