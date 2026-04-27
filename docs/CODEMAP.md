---
type: "note"
---
# DNA Codemap

> Agent-navigable architecture map for the DNA (Design Nexus Architecture) monorepo.\
> Turborepo + pnpm workspaces. All diagrams render in GitHub, VS Code (with extension), and Obsidian.

***

## 1. Monorepo Workspace Graph

```mermaid
graph TB
    subgraph ROOT["DNA Monorepo"]
        direction TB
        ROOT_CFG["Root Config<br/>turbo.json · pnpm-workspace.yaml<br/>eslint.rdna.config.mjs · package.json"]
    end

    subgraph PACKAGES["packages/"]
        direction TB
        RADIANTS["@rdna/radiants<br/>━━━━━━━━━━━━━━━<br/>Reference theme package<br/>Components · Tokens · ESLint<br/>Icons · Registry · Meta"]
        PREVIEW["@rdna/preview<br/>━━━━━━━━━━━━━━━<br/>Shared PreviewPage<br/>Schema generator<br/>Component meta types"]
    end

    subgraph APPS["apps/"]
        RADOS["rad-os<br/>━━━━━━━━━━━━━━━<br/>Next.js 16 desktop-OS UI<br/>Draggable window system<br/>9 catalog entries / 8 desktop launchers<br/>Port 3000"]
    end

    subgraph TOOLS["tools/"]
        PLAYGROUND["@rdna/playground<br/>━━━━━━━━━━━━━━━<br/>Component playground<br/>Agent workflow surface<br/>Annotation system<br/>Port 3004"]
    end

    RADIANTS -->|"workspace:*"| PREVIEW
    RADOS -->|"workspace:*"| RADIANTS
    PLAYGROUND -->|"workspace:*"| RADIANTS

    ROOT_CFG -.->|"turbo pipeline"| RADOS
    ROOT_CFG -.->|"turbo pipeline"| PLAYGROUND
    ROOT_CFG -.->|"turbo pipeline"| RADIANTS

    style RADIANTS fill:#fef3c7,stroke:#d97706,color:#000
    style RADOS fill:#dbeafe,stroke:#2563eb,color:#000
    style PLAYGROUND fill:#dcfce7,stroke:#16a34a,color:#000
    style PREVIEW fill:#fef3c7,stroke:#d97706,color:#000
```

***

## 2. Package: `@rdna/radiants` — Theme System

**Path:** `packages/radiants/`

```mermaid
graph TB
    subgraph TOKENS["CSS Token Layer"]
        direction LR
        INDEX_CSS["index.css<br/>(entry point — imports all)"]
        TOKENS_CSS["tokens.css<br/>Tier 1 brand + Tier 2 semantic<br/>@theme blocks"]
        DARK_CSS["dark.css<br/>Dark mode overrides"]
        TYPO_CSS["typography.css<br/>@layer base element styles"]
        FONTS_CSS["fonts.css<br/>@font-face declarations"]
        BASE_CSS["base.css<br/>Reset / element styles"]
        ANIM_CSS["animations.css<br/>Motion tokens + keyframes"]
        PIXEL_CSS["pixel-corners.css<br/>+ pixel-corners.generated.css"]
        PATTERNS_CSS["patterns.css<br/>+ pattern-shadows.css"]
    end

    subgraph COMPONENTS["components/core/ — 42 Components"]
        direction LR
        C_INTERACTIVE["Interactive<br/>━━━━━━━━━━<br/>Button · Checkbox · Combobox<br/>Input · InputSet · NumberField<br/>Select · Slider · Switch<br/>Toggle · ToggleGroup"]
        C_OVERLAY["Overlay / Dialog<br/>━━━━━━━━━━<br/>AlertDialog · Dialog<br/>Drawer · Sheet · Popover<br/>ContextMenu · DropdownMenu<br/>Tooltip · PreviewCard"]
        C_LAYOUT["Layout / Display<br/>━━━━━━━━━━<br/>AppWindow · Card · Alert · Badge<br/>Breadcrumbs · Collapsible<br/>Menubar · NavigationMenu<br/>ScrollArea · Separator<br/>Tabs · Toolbar"]
        C_FEEDBACK["Feedback / Pixel / Misc<br/>━━━━━━━━━━<br/>Avatar · CountdownTimer · Icon<br/>Meter · Pattern · PixelBorder<br/>PixelIcon · PixelTransition<br/>Spinner · Toast"]
    end

    subgraph META_LAYER["Meta / Contract Layer"]
        direction LR
        META["meta/index.ts<br/>Barrel export of all<br/>Component.meta.ts files"]
        CONTRACT["contract/system.ts<br/>Design contract types"]
        SCHEMAS["schemas/index.ts<br/>Barrel export of all<br/>Component.schema.json"]
        GENERATED["generated/<br/>ai-contract.json<br/>eslint-contract.json"]
    end

    subgraph REGISTRY["registry/"]
        direction LR
        REG_INDEX["index.ts — Registry API"]
        REG_BUILD["build-registry.ts<br/>build-registry-metadata.ts"]
        REG_PROPS["PropControls.tsx<br/>useShowcaseProps.ts"]
        REG_RUNTIME["runtime-attachments.tsx"]
        REG_TYPES["types.ts"]
    end

    subgraph ESLINT["eslint/ — eslint-plugin-rdna"]
        direction LR
        ESLINT_INDEX["index.mjs<br/>Plugin entry + configs"]
        ESLINT_RULES["rules/<br/>15 rule files"]
        ESLINT_TOKEN_MAP["token-map.mjs<br/>Token validation data"]
        ESLINT_UTILS["utils.mjs<br/>rdna-disable-comment-utils.mjs"]
    end

    subgraph ICONS["icons/"]
        direction LR
        ICON_GEN["generated.tsx<br/>(from assets/icons SVGs)"]
        ICON_COMP["Icon.tsx · DesktopIcons.tsx"]
        ICON_TYPES["types.ts · index.ts"]
    end

    subgraph PATTERNS["patterns/"]
        direction LR
        PAT_REG["registry.ts"]
        PAT_TYPES["types.ts"]
        PAT_INDEX["index.ts"]
    end

    subgraph SCRIPTS["scripts/"]
        direction LR
        GEN_ICONS["generate-icons.ts"]
        GEN_PIXEL["generate-pixel-corners.ts<br/>pixel-corners-lib.ts<br/>pixel-corners.config.ts"]
    end

    INDEX_CSS --> TOKENS_CSS
    INDEX_CSS --> TYPO_CSS
    INDEX_CSS --> FONTS_CSS
    INDEX_CSS --> BASE_CSS
    INDEX_CSS --> ANIM_CSS
    INDEX_CSS --> PIXEL_CSS
    INDEX_CSS --> PATTERNS_CSS

    COMPONENTS -.->|"each has .meta.ts"| META
    COMPONENTS -.->|"each has .schema.json"| SCHEMAS
    META -->|"generate:schemas"| SCHEMAS
    META -->|"builds"| GENERATED

    style TOKENS fill:#fef9c3,stroke:#ca8a04,color:#000
    style COMPONENTS fill:#fed7aa,stroke:#ea580c,color:#000
    style META_LAYER fill:#e0e7ff,stroke:#4f46e5,color:#000
    style REGISTRY fill:#d1fae5,stroke:#059669,color:#000
    style ESLINT fill:#fce7f3,stroke:#db2777,color:#000
```

### Component File Convention (per component)

```mermaid
graph LR
    TSX["Component.tsx<br/>Implementation"]
    META_TS["Component.meta.ts<br/>Source of truth:<br/>props, slots, tokens,<br/>registry config"]
    SCHEMA["Component.schema.json<br/>Generated from meta"]

    META_TS -->|"pnpm registry:generate"| SCHEMA
    TSX -.->|"imports types from"| META_TS

    style META_TS fill:#e0e7ff,stroke:#4f46e5,color:#000
    style SCHEMA fill:#f3e8ff,stroke:#7c3aed,color:#000
    style TSX fill:#fed7aa,stroke:#ea580c,color:#000
```

### Exports Map (`package.json`)

| Export Path                    | Entry Point                  | Type                                 |
| ------------------------------ | ---------------------------- | ------------------------------------ |
| `.`                            | `index.css`                  | Full theme CSS                       |
| `./tokens`                     | `tokens.css`                 | Token-only CSS                       |
| `./dark`                       | `dark.css`                   | Dark mode overrides                  |
| `./animations`                 | `animations.css`             | Motion CSS                           |
| `./base`                       | `base.css`                   | Base reset CSS                       |
| `./typography`                 | `typography.css`             | Typography styles                    |
| `./fonts`                      | `fonts.css`                  | Font declarations                    |
| `./components/core`            | `components/core/index.ts`   | All component exports                |
| `./icons`                      | `icons/index.ts`             | 154 icon components + dynamic loader |
| `./schemas`                    | `schemas/index.ts`           | Generated schema barrel              |
| `./eslint`                     | `eslint/index.mjs`           | ESLint plugin                        |
| `./registry`                   | `registry/index.ts`          | Component registry + types           |
| `./meta`                       | `meta/index.ts`              | Component meta index                 |
| `./patterns`                   | `patterns/index.ts`          | 51 dither patterns (6 groups)        |
| `./registry/forced-states.css` | `registry/forced-states.css` | Pseudo-state CSS                     |

### All 42 Components

| Directory         | Component       | Has Tests | Base-UI Wrap |
| ----------------- | --------------- | --------- | ------------ |
| `Alert/`          | Alert           | yes       | -            |
| `AlertDialog/`    | AlertDialog     | yes       | yes          |
| `AppWindow/`      | AppWindow       | yes       | yes          |
| `Avatar/`         | Avatar          | yes       | yes          |
| `Badge/`          | Badge           | yes       | -            |
| `Breadcrumbs/`    | Breadcrumbs     | -         | -            |
| `Button/`         | Button          | yes       | yes          |
| `Card/`           | Card            | yes       | -            |
| `Checkbox/`       | Checkbox, Radio | yes       | yes          |
| `Collapsible/`    | Collapsible     | yes       | yes          |
| `Combobox/`       | Combobox        | yes       | yes          |
| `ContextMenu/`    | ContextMenu     | yes       | yes          |
| `CountdownTimer/` | CountdownTimer  | yes       | -            |
| `Dialog/`         | Dialog          | yes       | yes          |
| `Drawer/`         | Drawer          | yes       | yes          |
| `DropdownMenu/`   | DropdownMenu    | yes       | yes          |
| `Icon/`           | Icon            | -         | -            |
| `Input/`          | Input, TextArea | yes       | yes          |
| `InputSet/`       | InputSet        | yes       | yes          |
| `Menubar/`        | Menubar         | yes       | yes          |
| `Meter/`          | Meter           | yes       | yes          |
| `NavigationMenu/` | NavigationMenu  | yes       | yes          |
| `NumberField/`    | NumberField     | yes       | yes          |
| `Pattern/`        | Pattern         | yes       | -            |
| `PixelBorder/`    | PixelBorder     | yes       | -            |
| `PixelIcon/`      | PixelIcon       | yes       | -            |
| `PixelTransition/` | PixelTransition | yes       | -            |
| `Popover/`        | Popover         | yes       | yes          |
| `PreviewCard/`    | PreviewCard     | yes       | yes          |
| `ScrollArea/`     | ScrollArea      | yes       | -            |
| `Select/`         | Select          | yes       | yes          |
| `Separator/`      | Separator       | -         | yes          |
| `Sheet/`          | Sheet           | yes       | yes          |
| `Slider/`         | Slider          | yes       | yes          |
| `Spinner/`        | Spinner         | -         | -            |
| `Switch/`         | Switch          | yes       | yes          |
| `Tabs/`           | Tabs            | yes       | yes          |
| `Toast/`          | Toast           | yes       | yes          |
| `Toggle/`         | Toggle          | yes       | yes          |
| `ToggleGroup/`    | ToggleGroup     | yes       | yes          |
| `Toolbar/`        | Toolbar         | yes       | yes          |
| `Tooltip/`        | Tooltip         | yes       | yes          |

***

## 3. App: `rad-os` — Desktop OS UI

**Path:** `apps/rad-os/` · **Port:** 3000

```mermaid
graph TB
    subgraph NEXTJS["app/ — Next.js App Router"]
        LAYOUT["layout.tsx<br/>Root layout"]
        PAGE["page.tsx<br/>Entry page"]
        GLOBALS["globals.css<br/>Tailwind v4 + RDNA tokens"]
    end

    subgraph WINDOW_SYSTEM["components/Rad_os/ — Window System"]
        DESKTOP["Desktop.tsx<br/>RadOSDesktop.tsx"]
        APPWINDOW["AppWindow.tsx<br/>Draggable window chrome"]
        TASKBAR["Taskbar.tsx"]
        STARTMENU["StartMenu.tsx"]
        INVERT["InvertModeProvider.tsx<br/>InvertOverlay.tsx"]
    end

    subgraph APP_COMPONENTS["components/apps/ — Catalog Apps"]
        ABOUT["AboutApp.tsx"]
        BRAND["BrandApp.tsx<br/>+ brand-assets/"]
        LAB["LabApp.tsx"]
        PIXEL_LAB["pixel-lab/PixelLab.tsx<br/>+ pixel-playground/"]
        PREFS["PreferencesApp.tsx<br/>(desktop hidden)"]
        SCRATCHPAD["ScratchpadApp.tsx<br/>+ scratchpad/"]
        HACKATHON["HackathonExeApp.tsx"]
        GOOD_NEWS["goodnews/GoodNewsLegacyApp.tsx"]
        MANIFESTO["manifesto/ManifestoBook.tsx"]
        RADIO["radio/RadioWidget.tsx<br/>(taskbar-hosted)"]
    end

    subgraph STATE["store/ — Zustand"]
        STORE_INDEX["index.ts<br/>Combined store<br/>devtools + persist"]
        WINDOWS_SLICE["windowsSlice.ts<br/>Window positions, z-index,<br/>open/close/focus"]
        PREFS_SLICE["preferencesSlice.ts<br/>Theme, wallpaper,<br/>favorites"]
        RADIO_SLICE["radRadioSlice.ts<br/>Track playback state"]
    end

    subgraph HOOKS_LIB["hooks/ + lib/"]
        USE_WM["useWindowManager"]
        USE_HASH["useHashRouting"]
        USE_MOBILE["useIsMobile"]
        USE_KONAMI["useKonamiCode"]
        APP_CATALOG["lib/apps/catalog.tsx<br/>Single source of truth:<br/>id, title, icon, component,<br/>sizing, ambient, start menu"]
    end

    subgraph BG["components/background/"]
        WEBGL_SUN["WebGLSun.tsx"]
    end

    PAGE --> DESKTOP
    DESKTOP --> APPWINDOW
    DESKTOP --> TASKBAR
    DESKTOP --> STARTMENU
    DESKTOP --> WEBGL_SUN
    APP_CATALOG -->|"registers"| APP_COMPONENTS
    STORE_INDEX --> WINDOWS_SLICE
    STORE_INDEX --> PREFS_SLICE
    STORE_INDEX --> RADIO_SLICE

    style NEXTJS fill:#dbeafe,stroke:#2563eb,color:#000
    style WINDOW_SYSTEM fill:#e0e7ff,stroke:#4f46e5,color:#000
    style APP_COMPONENTS fill:#fef3c7,stroke:#d97706,color:#000
    style STATE fill:#dcfce7,stroke:#16a34a,color:#000
```

### App Catalog (`lib/apps/catalog.tsx`)

| id | Window Title | Category | Desktop Visible | Subtabs |
| --- | --- | --- | --- | --- |
| `brand` | Brand | tools | yes | Logos, Color, Type |
| `lab` | Dev Tools | tools | yes | UI Library |
| `pixel-lab` | Pixel Lab | tools | yes | Radiants, Corners, Icons, Patterns, Dither, Canvas |
| `preferences` | Preferences | tools | no | General, Themes |
| `scratchpad` | Scratchpad | tools | yes | - |
| `hackathon-exe` | Hackathon.EXE | media | yes | Winners, Submissions, Archive |
| `good-news` | Good News | media | yes | - |
| `about` | About | about | yes | - |
| `manifesto` | Becoming Substance | about | yes | - |

Radio playback is taskbar-hosted through `components/apps/radio/RadioWidget.tsx`, not registered as a launchable catalog window.

### Zustand Store Persistence

Key: `rados-storage` (v1). Persists: `volume`, `reduceMotion`, `darkMode`, `radioFavorites`. Does NOT persist window positions or invertMode.

***

## 4. Tool: `@rdna/playground` — Component Playground

**Path:** `tools/playground/` · **Port:** 3004

```mermaid
graph TB
    subgraph PG_APP["app/playground/ — Next.js Pages"]
        PG_PAGE["page.tsx · PlaygroundClient.tsx"]
        PG_CANVAS["PlaygroundCanvas.tsx<br/>@xyflow/react node canvas"]
        PG_TOOLBAR["PlaygroundToolbar.tsx<br/>ModeToolbar.tsx"]
        PG_NODES["nodes/<br/>ComponentCard.tsx<br/>VariantRow.tsx"]
    end

    subgraph PG_COMPONENTS["app/playground/components/"]
        ANNO_COMP["AnnotationBadge.tsx<br/>AnnotationComposer.tsx<br/>AnnotationDetail.tsx<br/>AnnotationPin.tsx"]
        COMPOSER["ComposerShell.tsx<br/>AdoptComposer.tsx"]
        SEARCH["ComponentSearch.tsx<br/>IconFinder.tsx"]
        DEMOS["playground-ui-demos.tsx"]
        SCREENSHOT["ScreenshotStrip.tsx"]
        VIOLATIONS["ViolationBadge.tsx"]
    end

    subgraph PG_API["app/playground/api/ — Route Handlers"]
        AGENT_SIGNAL["agent/signal/route.ts<br/>+ signal-store.ts"]
        AGENT_ANNO["agent/annotation/route.ts<br/>+ annotation-store.ts"]
        GENERATE["generate/route.ts<br/>generate/[file]/route.ts<br/>generate/write/route.ts"]
    end

    subgraph PG_LIB["app/playground/lib/"]
        STORAGE["storage.ts"]
        VIOLATIONS_LIB["violations.ts"]
        ITERATIONS["iterations.server.ts<br/>iteration-naming.ts"]
        WORK_OVERLAY["work-overlay.ts"]
        SOURCE_POLICY["source-path-policy.ts"]
        CLAMP["clampPopoverPosition.ts"]
        SIGNAL_EVENT["playground-signal-event.ts"]
    end

    subgraph PG_CLI["bin/ — CLI Tools"]
        CLI_MAIN["rdna-playground.mjs"]
        CLI_CMDS["commands/<br/>agent-fix.mjs<br/>annotate.mjs<br/>create-variants.mjs<br/>status.mjs<br/>variations.mjs<br/>work-signal.mjs"]
        CLI_LIB["lib/<br/>api.mjs · prompt.mjs"]
    end

    subgraph PG_GENERATED["generated/"]
        REG_MANIFEST["registry.manifest.json"]
        REG_TS["registry.ts"]
        VIOL_MANIFEST["violations.manifest.json"]
    end

    subgraph PG_SCRIPTS["scripts/"]
        BUILD_CONTRACT["build-radiants-contract.ts"]
        GEN_REG["generate-registry.ts"]
        GEN_VIOL["generate-violations-manifest.mjs"]
        CHECK_FRESH["check-registry-freshness.mjs"]
        WATCH_REG["watch-registry.mjs"]
        VERIFY_VAR["verify-generated-variation.mjs"]
    end

    PG_PAGE --> PG_CANVAS
    PG_CANVAS --> PG_NODES
    PG_PAGE --> PG_TOOLBAR
    PG_CANVAS --> PG_COMPONENTS
    CLI_MAIN --> CLI_CMDS
    CLI_CMDS --> CLI_LIB
    PG_SCRIPTS -->|"outputs"| PG_GENERATED

    style PG_APP fill:#dcfce7,stroke:#16a34a,color:#000
    style PG_API fill:#d1fae5,stroke:#059669,color:#000
    style PG_CLI fill:#fef9c3,stroke:#ca8a04,color:#000
    style PG_GENERATED fill:#f3e8ff,stroke:#7c3aed,color:#000
```

***

## 5. Data Flow: Registry Pipeline

```mermaid
graph LR
    A["Component.meta.ts<br/>(42 components)"] -->|"pnpm registry:generate"| B["Component.schema.json<br/>(per component)"]
    A -->|"meta/index.ts barrel"| C["@rdna/radiants/meta"]
    B -->|"schemas/index.ts barrel"| D["@rdna/radiants/schemas"]
    A -->|"build-registry-metadata.ts"| E["registry/index.ts"]
    E -->|"generate-registry.ts"| F["playground/generated/<br/>registry.ts<br/>registry.manifest.json"]
    A -->|"build-radiants-contract.ts"| G["generated/<br/>ai-contract.json<br/>eslint-contract.json"]
    G -->|"consumed by"| H["eslint-plugin-rdna<br/>token-map.mjs"]

    style A fill:#e0e7ff,stroke:#4f46e5,color:#000
    style F fill:#dcfce7,stroke:#16a34a,color:#000
    style G fill:#fce7f3,stroke:#db2777,color:#000
```

***

## 6. Data Flow: Token System

```mermaid
graph TD
    subgraph TIER1["Tier 1 — Brand Primitives"]
        BRAND["tokens.css @theme<br/>--color-sun-yellow: oklch(...);<br/>--color-ember-red: oklch(...);<br/>--color-carbon: oklch(...);"]
    end

    subgraph TIER2["Tier 2 — Semantic Tokens"]
        SEM["tokens.css @theme<br/>--color-page: var(--color-parchment);<br/>--color-main: var(--color-carbon);<br/>--color-line: var(--color-dust);"]
    end

    subgraph DARK["Dark Mode"]
        DARK_OVER["dark.css<br/>Flips semantic tokens<br/>--color-page: var(--color-carbon);<br/>--color-main: var(--color-parchment);"]
    end

    subgraph CONSUME["Consumers"]
        TW["Tailwind v4 utilities<br/>bg-page · text-main · border-line"]
        COMP["Component classNames<br/>className='bg-page text-main'"]
        ESLINT_ENFORCE["eslint-plugin-rdna<br/>enforces semantic usage"]
    end

    BRAND --> SEM
    SEM --> TW
    SEM --> DARK_OVER
    DARK_OVER --> TW
    TW --> COMP
    ESLINT_ENFORCE -.->|"validates"| COMP

    style TIER1 fill:#fef3c7,stroke:#d97706,color:#000
    style TIER2 fill:#dbeafe,stroke:#2563eb,color:#000
    style DARK fill:#1e293b,stroke:#64748b,color:#f8fafc
```

***

## 7. Data Flow: Agent Workflow (Playground)

```mermaid
sequenceDiagram
    participant Agent as Claude Agent
    participant Hook as PreToolUse Hook
    participant API as Playground API<br/>(localhost:3004)
    participant Store as Annotation Store<br/>(file-based)
    participant UI as Playground UI

    Agent->>Hook: Edit component file
    Hook->>API: POST /api/agent/signal<br/>(work-start)
    API->>Store: Write signal
    Store->>UI: SSE / poll update
    UI-->>UI: Show work overlay

    Note over Agent: Reads injected annotations<br/>from PreToolUse hook

    Agent->>Agent: Fix component code
    Agent->>API: POST resolve/dismiss<br/>annotation
    API->>Store: Update annotation

    Agent->>API: POST /api/agent/signal<br/>(work-end)
    API->>Store: Clear signal
    Store->>UI: Remove overlay
```

***

## 8. ESLint Plugin Architecture

```mermaid
graph TB
    subgraph PLUGIN["eslint-plugin-rdna"]
        INDEX["eslint/index.mjs<br/>Plugin entry"]
        RECOMMENDED["configs.recommended<br/>10 rules at warn"]
        INTERNALS["configs.internals<br/>prefer-rdna-components: off"]
        STRICT["configs.recommended-strict<br/>10 rules at error (future)"]
    end

    subgraph RULES["eslint/rules/ — 11 Core Rules"]
        R1["no-hardcoded-colors"]
        R2["no-hardcoded-spacing"]
        R3["no-hardcoded-typography"]
        R4["prefer-rdna-components"]
        R5["no-removed-aliases"]
        R6["no-raw-radius"]
        R7["no-raw-shadow"]
        R8["no-clipped-shadow"]
        R9["no-pixel-border"]
        R10["no-hardcoded-motion"]
        R11["no-legacy-color-format<br/>(in lib/)"]
    end

    subgraph REPO_RULES["Repo-Local Rules (eslint.rdna.config.mjs)"]
        RR1["no-viewport-breakpoints-in-window-layout"]
        RR2["require-exception-metadata"]
        RR3["no-broad-rdna-disables"]
        RR4["no-mixed-style-authority"]
    end

    subgraph SCOPES["Lint Scopes"]
        S1["apps/rad-os/** → recommended"]
        S2["tools/playground/** → recommended"]
        S3["packages/radiants/components/core/** → internals"]
    end

    INDEX --> RECOMMENDED
    INDEX --> INTERNALS
    INDEX --> STRICT
    RECOMMENDED --> RULES
    SCOPES --> RECOMMENDED
    SCOPES --> INTERNALS

    style PLUGIN fill:#fce7f3,stroke:#db2777,color:#000
    style REPO_RULES fill:#fef3c7,stroke:#d97706,color:#000
```

***

## 9. Root Scripts & Infrastructure

```mermaid
graph TB
    subgraph ROOT_SCRIPTS["scripts/"]
        AUDIT_SA["audit-style-authority.mjs"]
        INSTALL_HOOKS["install-git-hooks.mjs<br/>install-git-hooks-lib.mjs"]
        LINT_STAGED["lint-design-system-staged.mjs"]
        LINT_TOKENS["lint-token-colors.mjs"]
        REG_GUARD["registry-guard.mjs<br/>registry-guard-lib.mjs<br/>with-registry-guard.mjs"]
        REPORT_EXC["report-new-rdna-exceptions.mjs"]
    end

    subgraph HOOKS[".claude/hooks/"]
        HOOK_SIGNAL["playground-work-signal.sh<br/>Auto work-start on component edit"]
        HOOK_ANNO["playground-annotation-inject.sh<br/>Print pending annotations"]
    end

    subgraph DEV_CMDS["Key Commands"]
        CMD1["pnpm dev → turbo dev (all)"]
        CMD2["pnpm build → turbo build"]
        CMD3["pnpm lint → turbo lint"]
        CMD4["pnpm lint:design-system → RDNA rules"]
        CMD5["pnpm registry:generate → schemas + playground"]
        CMD6["pnpm registry:check:full → freshness + tests"]
    end

    REG_GUARD -->|"pre-dev / pre-build"| CMD1
    REG_GUARD -->|"pre-dev / pre-build"| CMD2
    INSTALL_HOOKS -->|"pnpm prepare"| HOOKS

    style ROOT_SCRIPTS fill:#f1f5f9,stroke:#475569,color:#000
    style HOOKS fill:#fef9c3,stroke:#ca8a04,color:#000
```

***

## 10. Documentation & Research Map

```mermaid
graph TB
    subgraph DOCS["docs/"]
        THEME_SPEC["theme-spec.md<br/>Complete DNA specification"]
        PROD_READY["production-readiness-*.md<br/>Checklist, execution,<br/>interview, research tracks"]

        subgraph DOCS_SUB["Subdirectories"]
            PLANS["plans/<br/>23 implementation plans<br/>(2026-03-05 → 2026-03-22)"]
            BRAINSTORMS["brainstorms/<br/>10 feature explorations"]
            RESEARCH_D["research/<br/>Token primitives, guard rails,<br/>design contract synthesis"]
            QA["qa/<br/>Visual compare, lint baseline,<br/>CSS contract hardening"]
            REPORTS["reports/<br/>Playground spike,<br/>production readiness audit"]
            SOLUTIONS["solutions/<br/>integration-issues/ (3)<br/>tooling/ (6)"]
            ARCHIVE["archive/<br/>Legacy conversion guides"]
        end
    end

    subgraph RESEARCH["research/"]
        DG["design-guard/<br/>Architecture candidates,<br/>scorecard, recommendation,<br/>evidence log, loop log"]
        AUDIT["production-readiness-*<br/>Audit swarm, behavior loop,<br/>cleanup loop, UI browser loop"]
        CLAUDE_LOOP["claude-max-loop-*<br/>Bootstrap + continuation"]
    end

    style DOCS fill:#f1f5f9,stroke:#475569,color:#000
    style RESEARCH fill:#fef9c3,stroke:#ca8a04,color:#000
```

***

## 11. Quick File Finder

### Where is...?

| Looking for                    | Path                                                            |
| ------------------------------ | --------------------------------------------------------------- |
| **Design tokens**              | `packages/radiants/tokens.css`                                  |
| **Dark mode overrides**        | `packages/radiants/dark.css`                                    |
| **Typography styles**          | `packages/radiants/typography.css`                              |
| **Font declarations**          | `packages/radiants/fonts.css`                                   |
| **Animation tokens**           | `packages/radiants/animations.css`                              |
| **Pixel corner CSS**           | `packages/radiants/pixel-corners.css` + `.generated.css`        |
| **A specific component**       | `packages/radiants/components/core/{Name}/{Name}.tsx`           |
| **Component metadata**         | `packages/radiants/components/core/{Name}/{Name}.meta.ts`       |
| **Component schema**           | `packages/radiants/components/core/{Name}/{Name}.schema.json`   |
| **All component exports**      | `packages/radiants/components/core/index.ts`                    |
| **All meta exports**           | `packages/radiants/meta/index.ts`                               |
| **Icon components**            | `packages/radiants/icons/generated.tsx`                         |
| **Icon source SVGs**           | `packages/radiants/assets/icons/`                               |
| **ESLint plugin entry**        | `packages/radiants/eslint/index.mjs`                            |
| **ESLint rule impl**           | `packages/radiants/eslint/rules/{rule-name}.mjs`                |
| **ESLint token map**           | `packages/radiants/eslint/token-map.mjs`                        |
| **Registry API**               | `packages/radiants/registry/index.ts`                           |
| **AI contract (generated)**    | `packages/radiants/generated/ai-contract.json`                  |
| **Design contract types**      | `packages/radiants/contract/system.ts`                          |
| **Pattern definitions**        | `packages/radiants/patterns/registry.ts`                        |
| **rad-os entry**               | `apps/rad-os/app/page.tsx`                                      |
| **rad-os globals CSS**         | `apps/rad-os/app/globals.css`                                   |
| **App catalog**                | `apps/rad-os/lib/apps/catalog.tsx`                              |
| **Window system**              | `apps/rad-os/components/Rad_os/`                                |
| **Zustand store**              | `apps/rad-os/store/index.ts`                                    |
| **Store slices**               | `apps/rad-os/store/slices/{name}Slice.ts`                       |
| **Playground page**            | `tools/playground/app/playground/page.tsx`                      |
| **Playground CLI**             | `tools/playground/bin/rdna-playground.mjs`                      |
| **Playground registry**        | `tools/playground/generated/registry.ts`                        |
| **Playground annotations API** | `tools/playground/app/playground/api/agent/annotation/route.ts` |
| **Playground signals API**     | `tools/playground/app/playground/api/agent/signal/route.ts`     |
| **Schema generator**           | `packages/preview/src/generate-schemas.ts`                      |
| **PreviewPage component**      | `packages/preview/src/PreviewPage.tsx`                          |
| **RDNA lint config**           | `eslint.rdna.config.mjs` (root)                                 |
| **Registry guard**             | `scripts/registry-guard.mjs`                                    |
| **Design spec**                | `docs/theme-spec.md`                                            |
| **Design system doc**          | `packages/radiants/DESIGN.md`                                   |
| **Plans archive**              | `archive/plans/`                                                |
| **Research artifacts**         | `archive/research/design-guard/`                                |
| **Iteration files**            | `tools/playground/app/playground/iterations/`                   |
| **Iteration prompt builder**   | `tools/playground/app/playground/prompts/iteration.prompt.ts`   |
| **Annotation store**           | `tools/playground/app/playground/api/agent/annotation-store.ts` |
| **Signal store**               | `tools/playground/app/playground/api/agent/signal-store.ts`     |
| **Window sizing**              | `apps/rad-os/lib/windowSizing.ts`                               |
| **Konami code easter egg**     | `apps/rad-os/hooks/useKonamiCode.ts`                            |
| **WebGL background**           | `apps/rad-os/components/background/WebGLSun.tsx`                |
| **Preview package types**      | `packages/preview/src/types.ts`                                 |
| **Define component meta**      | `packages/preview/src/define-component-meta.ts`                 |
| **Prompt templates**           | `archive/prompts/dna-conversion/templates/`                     |
| **Production readiness**       | `docs/production-readiness-checklist.md`                        |

### Ports

| Service    | Port | Command    |
| ---------- | ---- | ---------- |
| rad-os     | 3000 | `pnpm dev` |
| playground | 3004 | `pnpm dev` |

### Key Dependencies

| Dep                        | Used By              | Purpose             |
| -------------------------- | -------------------- | ------------------- |
| `@base-ui/react` ^1.4.1    | radiants, ctrl       | Headless primitives |
| `class-variance-authority` | radiants, playground | Variant styling     |
| `zustand` ^5               | rad-os               | State management    |
| `react-draggable`          | rad-os               | Window dragging     |
| `@xyflow/react`            | playground           | Node canvas         |
| `next` 16.1.6              | rad-os, playground   | Framework           |
| `tailwindcss` ^4           | all                  | CSS engine          |
| `vitest`                   | all                  | Testing             |

⠀
