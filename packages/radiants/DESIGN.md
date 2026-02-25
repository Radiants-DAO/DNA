# RDNA Design System

> Radiant Design Nexus Architecture — the design language for Radiants.

## How to Use This Document

This document is the **canonical source of truth** for the RDNA design system. It defines what the system _should_ be — current code may not match. When code and this document conflict, this document wins.

**Audience:** AI agents implementing UI. Every rule includes do/don't code examples.

**Scope:** Section 1 (Design System) applies to all RDNA consumers. Section 2 (RadOS Application) applies only to the rad-os app.

---

# Part 1: Design System

## 1. Design Philosophy

### Art Is the Environment, UI Is the Overlay

Radiants treats art as the centerpiece. The background canvas, fullscreen video in the music player, dithered textures — these are the _environment_. UI floats on top as translucent, minimal chrome.

**Three-layer model:**

| Layer | Role | Examples |
|-------|------|----------|
| **Environment** | Art, video, canvas — the deepest, most expansive layer | WebGL sun, Rad Radio fullscreen video, dither textures |
| **Surface** | Windows, cards, panels — containers for content | AppWindow, Card, Dialog, Sheet |
| **Chrome** | Title bars, buttons, controls — minimal and functional | WindowTitleBar, Button, Tabs, Taskbar |

**Rule:** Chrome should never compete with art. When in doubt, reduce chrome.

### Sun Mode / Moon Mode

The design system has two named modes that go beyond light/dark color swapping:

| | Sun Mode (Light) | Moon Mode (Dark) |
|---|---|---|
| **Metaphor** | Harsh overhead sun | Soft ambient moonlight |
| **Shadows** | Sharp pixel-art offsets (directional, hard-edged) | Soft ambient glows (omnidirectional, diffused) |
| **Borders** | Solid black, high contrast | Translucent cream, subtle |
| **Surfaces** | Warm cream backgrounds | Deep black backgrounds |
| **Personality** | Bold, graphic, printwork | Atmospheric, cinematic, neon |

AI agents should understand: swapping modes doesn't just invert colors — it changes the _character_ of every visual element.

### The Discovery Layer

Easter eggs are a first-class design concern. In an agentic web, humans find delight through exploration — not through AI-mediated summaries.

**Rules for Easter eggs:**
- Delightful, never annoying
- Non-destructive — never alter user data or state
- Session-scoped — reset on page reload unless explicitly persisted
- Never block functionality — always dismissible
- Do not document specific Easter eggs in this file
