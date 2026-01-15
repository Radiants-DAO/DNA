# AI UX Patterns for RadFlow

> Research document for fn-4.10: AI UX patterns (wayfinders, tuners, governors, trust builders)

## Executive Summary

This document adapts AI UX patterns from Shape of AI to RadFlow's design system editing context. RadFlow is a visual tool for editing theme tokens, browsing components, and managing design systems with AI assistance. The patterns address specific challenges: prompt construction for design system tasks, human oversight of AI-generated CSS/tokens, and building trust in AI suggestions.

**Key Decision:** RadFlow implements AI as an **assistant**, not an autonomous agent. Users remain in control with clear verification gates before any changes apply.

---

## Shape of AI Pattern Framework

Shape of AI identifies six categories of AI UX patterns:

| Category | Purpose | RadFlow Relevance |
|----------|---------|-------------------|
| **Wayfinders** | Help users begin AI interactions | High — prompt construction is hard |
| **Inputs** | Different ways to direct AI | Medium — focused use cases |
| **Tuners** | Refine AI outputs via constraints | High — design constraints matter |
| **Governors** | Human-in-the-loop oversight | Critical — code changes require approval |
| **Trust Builders** | Establish confidence in AI | High — generated CSS can break UIs |
| **Identifiers** | Brand AI distinctively | Medium — consistent visual language |

---

## Wayfinders: Helping Users Start

Wayfinders address the "blank canvas" problem. In RadFlow, users may not know what to ask or how to phrase design system prompts.

### Pattern: Prompt Gallery

Display curated examples of effective prompts for common design system tasks.

**RadFlow Implementation:**

```
╭─────────────────────────────────────────────────────────────────╮
│  AI Assistant                                          [?] [×]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  What would you like to do?                                     │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Enter your request...                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ── Try these examples ──────────────────────────────────────── │
│                                                                 │
│  ╭─────────────────────╮  ╭─────────────────────╮              │
│  │ "Make spacing more  │  │ "Create a compact   │              │
│  │  generous for touch │  │  density variant    │              │
│  │  interfaces"        │  │  for data tables"   │              │
│  ╰─────────────────────╯  ╰─────────────────────╯              │
│                                                                 │
│  ╭─────────────────────╮  ╭─────────────────────╮              │
│  │ "Adjust colors for  │  │ "Port these tokens  │              │
│  │  WCAG AAA contrast" │  │  to CSS variables"  │              │
│  ╰─────────────────────╯  ╰─────────────────────╯              │
│                                                                 │
╰─────────────────────────────────────────────────────────────────╯
```

**Example Categories:**

| Category | Example Prompts |
|----------|-----------------|
| Token Adjustments | "Make the color scale warmer", "Increase spacing by 20%" |
| Accessibility | "Audit colors for WCAG AA", "Add focus ring tokens" |
| Migration | "Convert Tailwind config to CSS variables" |
| Generation | "Create a compact density variant", "Add dark mode tokens" |
| Analysis | "Find inconsistent spacing values", "Show unused tokens" |

### Pattern: Suggestions (Contextual Nudges)

Surface relevant AI actions based on current editing context.

**RadFlow Implementation:**

```
╭─────────────────────────────────────────────────────────────────╮
│  Color Token: --color-brand-primary                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Value: #FCE184                                                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  ⚠ Low contrast with surface-primary (2.8:1)               ││
│  │                                                             ││
│  │  [AI: Suggest accessible alternatives]                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Used in: button-primary-bg, badge-highlight                    │
│                                                                 │
╰─────────────────────────────────────────────────────────────────╯
```

**Contextual Suggestion Triggers:**

| Context | Suggestion |
|---------|------------|
| Low contrast detected | "Suggest accessible alternatives" |
| Editing spacing token | "Apply to related spacing tokens" |
| Viewing component | "Generate variants from this base" |
| Multiple similar values | "Consolidate into shared token" |
| Missing dark mode | "Generate dark mode equivalents" |

### Pattern: Templates

Pre-structured prompts for complex multi-step operations.

**RadFlow Templates:**

```
╭─────────────────────────────────────────────────────────────────╮
│  Template: Accessibility Audit                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  This template will:                                            │
│  1. Check all color pairs for WCAG contrast                     │
│  2. Verify focus indicator visibility                           │
│  3. Review touch target sizes                                   │
│  4. Generate a report with fixes                                │
│                                                                 │
│  Configuration:                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Standard: [AA ▼]  (AAA requires 7:1 contrast)              ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Include: [Colors ✓] [Focus ✓] [Touch ✓] [Motion ○]        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  [Run Audit]                                  [Customize More]  │
│                                                                 │
╰─────────────────────────────────────────────────────────────────╯
```

**Template Library:**

| Template | Purpose |
|----------|---------|
| Accessibility Audit | WCAG compliance check with remediation suggestions |
| Theme Migration | Convert from one token format to another |
| Density Scaling | Generate compact/comfortable variants |
| Dark Mode Generation | Create dark theme from light tokens |
| Component Analysis | Extract tokens from existing components |

### Pattern: Follow-up

When initial prompts are ambiguous, request clarification before proceeding.

**RadFlow Implementation:**

```
User: "Make the theme more accessible"

╭─────────────────────────────────────────────────────────────────╮
│  AI Assistant                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  I can help improve accessibility. Let me clarify:              │
│                                                                 │
│  Which aspects should I focus on?                               │
│                                                                 │
│  ○ Color contrast (WCAG AA / AAA)                               │
│  ○ Focus indicators                                             │
│  ○ Touch target sizes                                           │
│  ○ Motion/animation reduction                                   │
│  ○ All of the above                                             │
│                                                                 │
│  [Continue]                                                     │
│                                                                 │
╰─────────────────────────────────────────────────────────────────╯
```

---

## Inputs: Directing AI Tasks

Inputs define how users communicate intent to AI. RadFlow focuses on design system operations.

### Pattern: Inline Action

AI actions available directly within token editors.

**RadFlow Implementation:**

```
╭─────────────────────────────────────────────────────────────────╮
│  Spacing Scale                                                  │
├─────────────────────────────────────────────────────────────────┤
│  --spacing-xs    │ 4px  │ [Edit] [AI ▼]                        │
│  --spacing-sm    │ 8px  │ [Edit] [AI ▼]                        │
│  --spacing-md    │ 16px │ [Edit] [AI ▼]                        │
│  --spacing-lg    │ 24px │ [Edit] [AI ▼]                        │
│  --spacing-xl    │ 32px │ [Edit] [AI ▼]                        │
╰─────────────────────────────────────────────────────────────────╯

[AI ▼] menu:
┌─────────────────────────┐
│ Scale proportionally    │  ← Adjust all values by ratio
│ Fill gaps               │  ← Add intermediate values
│ Explain rationale       │  ← Why these values?
│ Convert units           │  ← px → rem → em
│ Suggest alternatives    │  ← Common alternatives
└─────────────────────────┘
```

### Pattern: Transform

Convert between token formats and representations.

**RadFlow Transformations:**

| From | To | Use Case |
|------|-----|----------|
| CSS Variables | JSON tokens | Export for Style Dictionary |
| Tailwind config | CSS Variables | Migration from Tailwind |
| Figma variables | CSS Variables | Design-to-dev handoff |
| Theme object | SCSS variables | Legacy project support |

### Pattern: Regenerate

Produce alternative suggestions without changing the original prompt.

**RadFlow Implementation:**

```
╭─────────────────────────────────────────────────────────────────╮
│  AI Suggestion: Color Scale                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Original: #FCE184                                              │
│                                                                 │
│  Generated scale:                                               │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐       │
│  │ 50  │ 100 │ 200 │ 300 │ 400 │ 500 │ 600 │ 700 │ 800 │       │
│  │░░░░░│░░░░░│░░░░░│░░░░░│█████│█████│█████│█████│█████│       │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘       │
│                                                                 │
│  [Accept]  [Regenerate ↺]  [Adjust...]  [Dismiss]               │
│                                                                 │
│  ↺ Regeneration 2 of 5                                          │
│                                                                 │
╰─────────────────────────────────────────────────────────────────╯
```

---

## Tuners: Refining AI Output

Tuners add constraints to improve AI output quality. Critical for design system work where consistency matters.

### Pattern: Parameters

Explicit constraints passed to AI.

**RadFlow Parameters:**

```
╭─────────────────────────────────────────────────────────────────╮
│  Generate Dark Mode Theme                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Parameters:                                                    │
│                                                                 │
│  Contrast minimum:  [WCAG AA ▼]                                 │
│  Background range:  [Pure black ─●────────── Dark gray]         │
│  Preserve hues:     [Yes ✓]                                     │
│  Shadow style:      [Glow ○]  [Invert ○]  [Fade ●]              │
│                                                                 │
│  [Generate with Parameters]                                     │
│                                                                 │
╰─────────────────────────────────────────────────────────────────╯
```

**Common Parameter Types:**

| Parameter | Values | Purpose |
|-----------|--------|---------|
| WCAG Level | A, AA, AAA | Accessibility constraint |
| Color Mode | Preserve hues, Shift to neutral | Brand consistency |
| Scaling Factor | 0.5x, 0.75x, 1x, 1.25x, 1.5x | Density/size adjustments |
| Output Format | CSS, JSON, SCSS, Tailwind | Integration target |

### Pattern: Filters

Constrain what the AI can modify.

**RadFlow Filters:**

```
╭─────────────────────────────────────────────────────────────────╮
│  AI Scope Filter                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  What can AI modify?                                            │
│                                                                 │
│  Token categories:                                              │
│  [✓] Colors          [✓] Spacing       [○] Typography           │
│  [✓] Borders         [○] Shadows       [○] Motion               │
│                                                                 │
│  Protection:                                                    │
│  [✓] Lock brand colors (--color-brand-*)                        │
│  [✓] Lock font families                                         │
│  [○] Lock semantic mappings                                     │
│                                                                 │
│  [Apply Filters]                                                │
│                                                                 │
╰─────────────────────────────────────────────────────────────────╯
```

### Pattern: Attachments (Reference Context)

Provide specific examples or references for AI to follow.

**RadFlow Attachments:**

| Attachment Type | Purpose |
|-----------------|---------|
| DESIGN_SYSTEM.md | Style rules and constraints |
| Component screenshot | Visual target for generation |
| Existing theme | Pattern to follow |
| Color palette image | Color extraction source |
| Figma export | Design source of truth |

**Implementation:**

```
╭─────────────────────────────────────────────────────────────────╮
│  Context for AI                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Attached:                                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📄 DESIGN_SYSTEM.md (always included)                       ││
│  │ 📄 current-theme.css (auto-attached)                        ││
│  │ 🖼 target-design.png (user added)           [Remove]        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  [+ Add reference file]  [+ Add screenshot]                     │
│                                                                 │
╰─────────────────────────────────────────────────────────────────╯
```

### Pattern: Voice and Tone

Ensure AI-generated content matches design system voice.

**RadFlow Voice Settings:**

```
╭─────────────────────────────────────────────────────────────────╮
│  AI Output Style                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Token naming convention:                                       │
│  ○ kebab-case (--color-brand-primary)                           │
│  ● camelCase (colorBrandPrimary)                                │
│  ○ SCREAMING_SNAKE_CASE ($COLOR_BRAND_PRIMARY)                  │
│                                                                 │
│  Comment style:                                                 │
│  ● Terse ("Primary brand color")                                │
│  ○ Descriptive ("Primary brand color used for...")              │
│  ○ None                                                         │
│                                                                 │
│  Code format:                                                   │
│  [✓] Auto-format output                                         │
│  [✓] Include source comments                                    │
│                                                                 │
╰─────────────────────────────────────────────────────────────────╯
```

---

## Governors: Human-in-the-Loop Oversight

Governors are **critical** for RadFlow. AI-generated CSS can break interfaces. Users must verify before changes apply.

### Pattern: Action Plan

Display intended changes before execution.

**RadFlow Implementation:**

```
╭─────────────────────────────────────────────────────────────────╮
│  AI Action Plan                                    [?] [×]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Request: "Improve contrast for accessibility"                  │
│                                                                 │
│  I will make these changes:                                     │
│                                                                 │
│  1. ◉ Adjust --color-text-secondary                             │
│     Current: #666666 (3.5:1 contrast)                           │
│     Proposed: #595959 (4.6:1 contrast)                          │
│     Reason: Below WCAG AA threshold                             │
│                                                                 │
│  2. ◉ Adjust --color-border-subtle                              │
│     Current: #E0E0E0 (1.2:1 contrast)                           │
│     Proposed: #B0B0B0 (2.8:1 contrast)                          │
│     Reason: UI borders should be visible                        │
│                                                                 │
│  3. ◯ Skip --color-text-disabled                                │
│     Current: #999999 (2.8:1 contrast)                           │
│     Note: Intentionally lower contrast for disabled state       │
│                                                                 │
│  Affected components: Button, Input, Card, Badge (12 total)     │
│                                                                 │
│  [Review Changes]  [Modify Plan]  [Cancel]                      │
│                                                                 │
╰─────────────────────────────────────────────────────────────────╯
```

**Action Plan Requirements:**

| Element | Purpose |
|---------|---------|
| Current value | What exists now |
| Proposed value | What AI will change |
| Reason | Why this change is suggested |
| Scope | What components/files are affected |
| Skip explanation | Why certain items are not changed |

### Pattern: Verification

Explicit confirmation gates before applying changes.

**RadFlow Verification Flow:**

```
Step 1: Plan Review              Step 2: Preview               Step 3: Confirm
╭─────────────────────╮         ╭─────────────────────╮       ╭─────────────────────╮
│                     │         │                     │       │                     │
│  AI proposes        │  ──▶    │  Visual diff shows  │  ──▶  │  Apply changes?     │
│  changes            │         │  before/after       │       │                     │
│                     │         │                     │       │  [Apply] [Revert]   │
╰─────────────────────╯         ╰─────────────────────╯       ╰─────────────────────╯
```

**Preview Mode:**

```
╭─────────────────────────────────────────────────────────────────╮
│  Preview: Before / After                          [Split View]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────┐ ┌─────────────────────────────────┐│
│  │ BEFORE                  │ │ AFTER                           ││
│  │                         │ │                                 ││
│  │ ╭─────────────────────╮ │ │ ╭─────────────────────╮         ││
│  │ │  Low Contrast Text  │ │ │ │  Higher Contrast    │         ││
│  │ │  Hard to read       │ │ │ │  Easier to read     │         ││
│  │ ╰─────────────────────╯ │ │ ╰─────────────────────╯         ││
│  │                         │ │                                 ││
│  └─────────────────────────┘ └─────────────────────────────────┘│
│                                                                 │
│  ◄ Previous Change    [2 of 5]    Next Change ►                 │
│                                                                 │
│  [Apply This]  [Skip This]  [Apply All Reviewed]                │
│                                                                 │
╰─────────────────────────────────────────────────────────────────╯
```

### Pattern: Controls

Allow interruption or modification during AI operations.

**RadFlow Controls:**

```
╭─────────────────────────────────────────────────────────────────╮
│  AI Processing: Analyzing theme tokens...                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ████████████████████░░░░░░░░░░░░░░░░░░░░  45%                  │
│                                                                 │
│  Current: Checking color contrast pairs                         │
│  Found: 3 issues so far                                         │
│                                                                 │
│  [Pause]  [Stop]  [Show Details]                                │
│                                                                 │
╰─────────────────────────────────────────────────────────────────╯
```

### Pattern: Stream of Thought

Show AI reasoning for transparency.

**RadFlow Implementation:**

```
╭─────────────────────────────────────────────────────────────────╮
│  AI Reasoning (click to expand)                        [−]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ▸ Reading DESIGN_SYSTEM.md for constraints                     │
│    Found: "No gray colors — use black at opacity"               │
│                                                                 │
│  ▸ Analyzing current --color-text-secondary: #666666            │
│    This is pure gray, violating style guide                     │
│                                                                 │
│  ▸ Calculating WCAG contrast against --color-surface-primary    │
│    Result: 3.5:1 (below AA requirement of 4.5:1)                │
│                                                                 │
│  ▸ Generating compliant alternative                             │
│    Option 1: rgba(0,0,0,0.65) — matches style guide             │
│    Option 2: #595959 — simpler but still gray                   │
│                                                                 │
│  ▸ Recommending Option 1 based on style guide compliance        │
│                                                                 │
╰─────────────────────────────────────────────────────────────────╯
```

### Pattern: Branches (Version History)

Maintain history of AI-assisted changes for comparison and rollback.

**RadFlow Branching:**

```
╭─────────────────────────────────────────────────────────────────╮
│  Theme Versions                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    ○ Current working state                      │
│                    │                                            │
│  ○────────────────●┤ AI: Accessibility improvements             │
│  │                 │ 12 tokens changed, Jan 15 2:34 PM          │
│  │                 │                                            │
│  │                 ├─○ AI: Alternative color scheme             │
│  │                 │   (not applied)                            │
│  │                 │                                            │
│  ○─────────────────┘ Manual: Updated brand colors               │
│  │                   3 tokens changed, Jan 14 4:12 PM           │
│  │                                                              │
│  ○ Initial import from Figma                                    │
│    Jan 14 10:00 AM                                              │
│                                                                 │
│  [Compare Versions]  [Restore to Point]                         │
│                                                                 │
╰─────────────────────────────────────────────────────────────────╯
```

---

## Trust Builders: Establishing Confidence

Trust builders help users understand AI limitations and feel confident in AI suggestions.

### Pattern: Disclosure

Clearly indicate AI-generated or AI-assisted content.

**RadFlow Disclosure:**

```
╭─────────────────────────────────────────────────────────────────╮
│  Token: --spacing-comfortable-lg                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Value: 32px                                                    │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ✨ AI Generated                                            │ │
│  │ Created by AI on Jan 15 as part of density scale          │ │
│  │ Based on: --spacing-md (16px) × 2                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Status: [Unverified]  →  [Mark as Verified]                    │
│                                                                 │
╰─────────────────────────────────────────────────────────────────╯
```

**Disclosure Indicators:**

| Indicator | Meaning |
|-----------|---------|
| ✨ AI Generated | Token created entirely by AI |
| 🔄 AI Modified | Existing token adjusted by AI |
| ✓ Verified | Human has reviewed AI output |
| ⚠ Unverified | AI output not yet reviewed |

### Pattern: Caveat

Proactively disclose limitations and potential issues.

**RadFlow Caveats:**

```
╭─────────────────────────────────────────────────────────────────╮
│  AI Suggestion                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Generated dark mode theme with 24 tokens.                      │
│                                                                 │
│  ⚠ Caveats:                                                     │
│  • Shadow-to-glow conversion is heuristic — review each one     │
│  • Brand colors preserved but may need contrast adjustment      │
│  • Generated from light mode; semantic meanings assumed         │
│  • Test with actual components before deploying                 │
│                                                                 │
│  Confidence: ████████░░ 80%                                     │
│  (High confidence for color transforms, lower for shadows)      │
│                                                                 │
╰─────────────────────────────────────────────────────────────────╯
```

**Standard Caveats by Task:**

| Task | Standard Caveats |
|------|------------------|
| Color generation | "Contrast ratios calculated mathematically; test in context" |
| Token migration | "Format converted; semantic meanings may differ" |
| Accessibility audit | "Automated checks only; manual testing recommended" |
| Dark mode generation | "Heuristic inversion; brand perception may change" |

### Pattern: Data Ownership

Clear controls over what data AI can access and remember.

**RadFlow Data Settings:**

```
╭─────────────────────────────────────────────────────────────────╮
│  AI Data Settings                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  What AI can access:                                            │
│  [✓] Current theme tokens                                       │
│  [✓] DESIGN_SYSTEM.md                                           │
│  [○] Git history                                                │
│  [○] Other project files                                        │
│                                                                 │
│  AI memory:                                                     │
│  [✓] Remember my style preferences                              │
│  [○] Learn from my edits over time                              │
│  [○] Share patterns across projects                             │
│                                                                 │
│  [Clear AI Memory]  [Export AI Data]                            │
│                                                                 │
╰─────────────────────────────────────────────────────────────────╯
```

---

## Identifiers: AI Visual Language

Consistent visual indicators for AI features within RadOS aesthetic.

### Pattern: Avatar

Recognizable AI identity.

**RadFlow AI Avatar:**

```
Standard avatar:     Thinking state:      Error state:
   ╭───╮               ╭───╮               ╭───╮
   │ ◇ │               │ ◈ │               │ ✕ │
   ╰───╯               ╰───╯               ╰───╯
   Idle               Processing          Error
```

The diamond shape (◇) represents crystalline precision — appropriate for a design system tool.

### Pattern: Color

Distinct color treatment for AI elements.

**RadFlow AI Colors:**

| Element | Color | Token |
|---------|-------|-------|
| AI accent | Sky Blue | `--color-ai-accent` |
| AI surface | Blue tint | `--color-ai-surface` |
| AI border | Blue | `--color-ai-border` |
| AI generated badge | Blue | `--color-ai-badge` |

This uses the existing Sky Blue (`#95BAD2`) from RadOS, creating visual distinction without introducing new brand colors.

### Pattern: Iconography

Consistent icons for AI actions.

| Action | Icon | Description |
|--------|------|-------------|
| AI suggestion | ✨ | Sparkle for generated content |
| AI processing | ◈ | Filled diamond while thinking |
| AI verified | ✓ | Checkmark for reviewed items |
| AI error | ⚠ | Warning triangle |
| Regenerate | ↺ | Circular arrow |

---

## Integration with RadFlow Features

### Variables Editor + AI

```
╭─────────────────────────────────────────────────────────────────╮
│  Color Tokens                                    [AI Assist ◇]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  --color-brand-primary   │ #FCE184 │ ████ │ [AI ▼]             │
│  --color-brand-secondary │ #95BAD2 │ ████ │ [AI ▼]             │
│  --color-text-primary    │ #0F0E0C │ ████ │ [AI ▼]             │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ◇ AI Suggestions:                                              │
│  • "Add darker shade for --color-brand-primary"                 │
│  • "These 2 tokens have similar values — consolidate?"          │
│                                                                 │
╰─────────────────────────────────────────────────────────────────╯
```

### Component Browser + AI

```
╭─────────────────────────────────────────────────────────────────╮
│  Button Component                                [AI Assist ◇]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Props: variant, size, disabled                                 │
│  Tokens used: 8                                                 │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ◇ AI Actions:                                                  │
│  • "Generate size variants"                                     │
│  • "Create matching IconButton"                                 │
│  • "Extract to design tokens"                                   │
│  • "Audit accessibility"                                        │
│                                                                 │
╰─────────────────────────────────────────────────────────────────╯
```

### Search + AI

```
╭─────────────────────────────────────────────────────────────────╮
│  Search                                          [AI Mode ◇]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ "tokens for error states"                                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  AI understands:                                                │
│  • Natural language queries                                     │
│  • Semantic intent ("error" → red, warning, destructive)        │
│  • Related concepts                                             │
│                                                                 │
│  Results:                                                       │
│  • --color-error (#FF6B63)                                      │
│  • --color-error-surface (rgba(255,107,99,0.1))                 │
│  • --color-destructive-action                                   │
│  • --border-error                                               │
│                                                                 │
╰─────────────────────────────────────────────────────────────────╯
```

---

## Implementation Recommendations

### Phase 1: Foundation (MVP)

| Pattern | Priority | Complexity |
|---------|----------|------------|
| Action Plan (Governor) | Critical | Medium |
| Verification (Governor) | Critical | Medium |
| Disclosure (Trust) | High | Low |
| Prompt Gallery (Wayfinder) | High | Low |

**Rationale:** Governors are non-negotiable for code-affecting tools. Trust indicators are low-effort but high-impact. Prompt gallery helps users get started.

### Phase 2: Enhancement

| Pattern | Priority | Complexity |
|---------|----------|------------|
| Parameters (Tuner) | High | Medium |
| Suggestions (Wayfinder) | High | Medium |
| Preview/Diff (Governor) | High | High |
| Stream of Thought (Governor) | Medium | Medium |

### Phase 3: Polish

| Pattern | Priority | Complexity |
|---------|----------|------------|
| Templates (Wayfinder) | Medium | Medium |
| Branches (Governor) | Medium | High |
| Caveats (Trust) | Medium | Low |
| Full identifier system | Low | Medium |

### Technical Integration

```
RadFlow AI Architecture:

┌──────────────────────────────────────────────────────────────────┐
│  Frontend (React)                                                │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────────────┐│
│  │ AI UI Patterns │ │ Token Editors  │ │ Component Browser     ││
│  │ (Governors,    │ │ (Inline AI     │ │ (AI suggestions)      ││
│  │  Trust, etc.)  │ │  actions)      │ │                       ││
│  └────────────────┘ └────────────────┘ └────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  AI Integration Layer (Tauri IPC)                                │
│  • Request validation                                            │
│  • Context assembly (tokens, DESIGN_SYSTEM.md)                   │
│  • Response parsing                                              │
│  • Change tracking                                               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  LLM Backend                                                     │
│  • Claude API (primary)                                          │
│  • Local model option (future)                                   │
│  • Prompt templates (from prompt library)                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Summary

RadFlow's AI UX should prioritize:

1. **Safety First:** Governors ensure human control over all code changes
2. **Clear Communication:** Wayfinders help users construct effective prompts
3. **Precision Tuning:** Tuners let users constrain AI for design system accuracy
4. **Earned Trust:** Trust builders transparently show AI capabilities and limitations
5. **Visual Consistency:** Identifiers integrate AI seamlessly into RadOS aesthetic

The design system context makes some patterns more critical than general AI applications:
- **Action Plans** prevent AI from silently modifying tokens
- **Visual Previews** catch design regressions before they ship
- **Style Attachments** ensure AI follows existing design rules
- **Version History** enables rollback of AI experiments

---

## References

### Research Sources

- [Shape of AI](https://www.shapeof.ai/) — AI UX pattern library
- Shape of AI Categories: Wayfinders, Inputs, Tuners, Governors, Trust Builders, Identifiers
- [Nielsen Norman Group: AI UX](https://www.nngroup.com/articles/ai-ux-getting-started/) — Foundation principles
- [Anthropic Claude Design Guidelines](https://docs.anthropic.com/claude/docs/claude-product-ux-guidelines) — AI disclosure patterns

### Project Context

- DESIGN_SYSTEM.md — RadOS visual constraints
- motion-token-system.md — Animation patterns for AI interactions
- accessibility-tokens.md — A11y requirements for AI UI
- fn-4.9 (Prompt Library) — Template structure for AI prompts

---

## Appendix: Pattern Quick Reference

### Wayfinders (Starting AI interactions)

| Pattern | Implementation |
|---------|----------------|
| Gallery | Curated prompt examples |
| Follow-up | Clarifying questions |
| Suggestions | Contextual action hints |
| Templates | Pre-structured operations |
| Nudges | Feature discovery alerts |

### Inputs (Directing AI)

| Pattern | Implementation |
|---------|----------------|
| Inline Action | Context menu on tokens |
| Transform | Format conversion |
| Regenerate | Alternative suggestions |

### Tuners (Constraining AI)

| Pattern | Implementation |
|---------|----------------|
| Parameters | Explicit constraints |
| Filters | Scope limitations |
| Attachments | Reference context |
| Voice/Tone | Output style |

### Governors (Human oversight)

| Pattern | Implementation |
|---------|----------------|
| Action Plan | Show proposed changes |
| Verification | Confirm before applying |
| Controls | Pause/stop operations |
| Stream of Thought | Show reasoning |
| Branches | Version history |

### Trust Builders (Confidence)

| Pattern | Implementation |
|---------|----------------|
| Disclosure | AI-generated indicators |
| Caveat | Limitation warnings |
| Data Ownership | Privacy controls |

### Identifiers (Visual language)

| Pattern | Implementation |
|---------|----------------|
| Avatar | Diamond icon (◇) |
| Color | Sky Blue accent |
| Iconography | ✨ ◈ ✓ ⚠ ↺ |
