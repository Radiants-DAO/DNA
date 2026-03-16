# Radiator Frontend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use wf-execute to implement this plan task-by-task.

**Goal:** Build the full Radiator frontend — mock RadOS shell, explainer flow, holder burn ceremony (6 scenes), and admin wizard — using the @rdna/radiants design system.

**Worktree:** `/Users/rivermassey/Desktop/dev/radiator` (will be moved to `/dna/apps/radiator` in the DNA monorepo)

**Architecture:** Single-page app inside a mock RadOS window. Internal view routing via Zustand state (no Next.js page routes for app views). Solana wallet adapter for wallet connection. `@radiants-dao/core` SDK for on-chain transactions. All styling via @rdna/radiants semantic tokens + Tailwind v4 utilities. Container queries for responsive layout within the window.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS v4, @rdna/radiants (design system), @radiants-dao/core (SDK), @solana/wallet-adapter, Zustand (app state), class-variance-authority (CVA)

**Brainstorm:** `docs/brainstorms/2026-02-27-radiator-frontend-brainstorm.md`

**Figma Reference:** File `MICrnPV32mAQA2kxjGsooA`, section node `4246:21791`

---

## Required Skills For This Plan

Use these skills in this order while executing:

1. `writing-plans` — maintain bite-sized tasks, exact file paths, and commit checkpoints.
2. `solana-dev` — enforce devnet/RPC correctness, wallet signing flow, and chain-account wiring.
3. `test-driven-development` — write/adjust failing tests where feasible before non-trivial logic changes.
4. `verification-before-completion` — run lint/build/manual verification before claiming any task done.
5. `requesting-code-review` — run at the end of major integration chunks.

---

## Prerequisites

Before starting implementation:
1. Move this repo into `/dna/apps/radiator` (user handles this)
2. Ensure `@rdna/radiants` is accessible as a workspace dependency
3. Ensure `@radiants-dao/core` is installable (npm or local link from `radiants-program-library`)
4. Set `NEXT_PUBLIC_RPC_ENDPOINT` to a **DAS-capable devnet RPC** (Helius/Triton/etc.). Do not rely on default `https://api.devnet.solana.com` for `searchAssets`.

---

## Frontend-First Execution Mode (Hackathon Fast Path)

For this prototype, build scenes/UI first, then run a dedicated connection pass. Do not block visual progress on chain integration.

- Frontend pass: all scene components, local state flow, loading/error/success affordances.
- Connection pass: wire only the defined adapter boundary functions.
- Scope rule: one real successful devnet transaction path is required for submission credibility.

---

## Connection Contract (Do Not Bypass)

All on-chain and DAS interactions must flow through exactly these boundaries:

1. **Wallet/RPC provider boundary**
   - Source: `src/app/providers.tsx`
   - Responsibility: wallet connection, endpoint, connection config.

2. **DAS boundary**
   - Source: `src/utils/index.ts` (or `src/lib/das-client.ts` if split)
   - Responsibility: collection/owner asset discovery via `searchAssets`.

3. **Radiator transaction boundary (client adapter)**
   - Create: `src/lib/radiator-client.ts`
   - Responsibility: wrap SDK methods behind a unified adapter interface.
   - Rule: page/scene components must not instantiate or call `TheRadiatorCore` directly.
   - **Mock/Live split (controlled by `USE_MOCK_CHAIN` in `src/constants.ts`):**
     - `createConfig` → **LIVE** (real SDK call via `TheRadiatorCore`). This is the one real devnet path.
     - `createClaim` → **MOCKED** (returns fake entangledPair/mint PDAs, simulated delay). Blocked by hardcoded collection metadata in SDK `burnNFT`.
     - `burnNFT` → **MOCKED** (returns fake tx sig, simulated delay). Blocked by hardcoded collection metadata address `8gwhwX...`.
     - `swap` → **MOCKED** (returns fake tx sig, simulated delay). Blocked by `RADIATOR_LUT = PublicKey.default` placeholder.
   - The adapter exports one interface — callers don't know if they're hitting chain or mock. Switching is a single constant flip.

4. **Radiator manifest boundary (off-chain state)**
   - Create: `src/lib/radiator-manifest.ts`
   - Responsibility: persist/retrieve per-radiator metadata needed for holder flow:
     - `configAccount`
     - `collection`
     - `elements[]` mapping (`mint -> index/name/uri`)
     - reveal mode flag
   - Rule: no holder `createClaim` call without a resolved element index/proof source.

---

## Shared Scene State Contract

Use one cross-scene shape so UI wiring is stable before chain integration:

```ts
{
  collectionAddress: string;
  configAccount: string | null;
  selectedPrimaryMint: string | null;
  selectedGasMints: string[];
  offeringSize: number;
  txs: {
    createConfig?: string;
    createClaim?: string;
    burns: string[];
    swap?: string;
  };
}
```

---

## UI Action Contract (Client Adapter)

Each CTA button calls one async function from `src/lib/radiator-client.ts`. The adapter reads `USE_MOCK_CHAIN` from `src/constants.ts` and routes to real SDK or mock implementation per method:

| Function | Live/Mock | Notes |
|----------|-----------|-------|
| `fetchCollection()` | Live (DAS) | Uses existing `getCollectionAssets` |
| `createConfig()` | **Live** | Real devnet tx via `TheRadiatorCore.createConfig` |
| `createClaim()` | Mock | Returns fake PDAs, 1.5s delay |
| `burnGasNFT(mint)` | Mock | Returns fake tx sig, 1s delay |
| `swap()` | Mock | Returns fake tx sig, 2s delay |

Scene components import only from `radiator-client.ts` — never `@radiants-dao/core`.

```ts
// src/constants.ts
export const USE_MOCK_CHAIN = true; // flip to false to enable all real calls
```

---

## Frontend Handoff Checklist (Before Full Connection Pass)

Before wiring remaining live calls (createClaim, burnNFT, swap):

1. Every primary CTA is wired to the client adapter functions above.
2. Each action has visible `idle/loading/success/error` UI states.
3. Each tx-producing scene has a signature display slot (works with both mock and real sigs).
4. State writes use the shared scene state contract fields.
5. No scene component imports `@radiants-dao/core` directly.
6. `createConfig` works end-to-end on devnet with a real wallet.

Remaining connection pass: fix SDK blockers (hardcoded collection metadata in `burnNFT`, `RADIATOR_LUT` placeholder in `swap`), then flip mock→live per method.

---

## Scene → Integration Mapping

| Scene | Adapter call | Live/Mock | Notes |
|-------|-------------|-----------|-------|
| Admin Select Collection | `fetchCollection()` (DAS) | Live | Uses existing `getCollectionAssets` |
| Admin Deploy | `client.createConfig(...)` | **Live** | Real devnet tx, persist manifest |
| Holder Choose | `fetchCollection()` (DAS) | Live | Filter by owner |
| Holder Seal Claim | `client.createClaim(...)` | Mock | SDK blocker: hardcoded collection metadata |
| Holder Feed Radiator | `client.burnGasNFT(...)` | Mock | SDK blocker: hardcoded collection metadata |
| Holder Ignite | `client.swap(...)` | Mock | SDK blocker: `RADIATOR_LUT = PublicKey.default` |

---

## Known Risks To Defer (Unless Blocking)

- Full upload/storage pipeline (Arweave/IPFS/Shadow) can be mocked for prototype.
- RadOS shell migration can wait; standalone Next.js prototype is acceptable.
- Full directory/global analytics can be placeholder if one end-to-end devnet path works.
- **SDK `burnNFT` hardcodes collection metadata** (`8gwhwX2t6YyL58JH7E4ao8stwzFm8WyXfLLyW4zVLc19`) — will fail for any other collection. Must be parameterized before `burnNFT` can go live.
- **`RADIATOR_LUT` is `PublicKey.default`** — `swap` will fail until a real Address Lookup Table is deployed and the constant updated.
- Both blockers are SDK-side fixes, not frontend. Mocking these calls keeps the UI unblocked.

---

## Critical RDNA Rules (Reference During ALL Tasks)

These are non-negotiable per DESIGN.md. Violating any of these is a bug.

- **Semantic tokens ONLY** — never use brand tokens (`bg-cream`, `text-ink`) or hex values in component code. Always `bg-page`, `text-main`, etc.
- **Container queries, NOT viewport breakpoints** — inside the AppWindow, use `@sm:`, `@md:`, `@lg:` (Tailwind v4 container queries). NEVER `sm:`, `md:`, `lg:` (viewport breakpoints).
- **1px borders only** — `border border-line`. No `border-2` anywhere.
- **Joystix is the default font** — all UI chrome uses it. Apply `font-mondwest` explicitly only for body/paragraph text.
- **Ease-out only, max 300ms** — `ease-default` easing. No `ease-in-out`, no durations > 300ms.
- **No emojis** — use icons from `@rdna/radiants/icons`.
- **CVA for all variants** — no manual conditional class building.
- **Sun Mode snaps, Moon Mode eases** — hover/focus feedback is instant in Sun Mode (no transition). State transitions ease with `duration-base`.
- **`max-w` Tailwind v4 bug** — use explicit rem values (`max-w-[28rem]`), never T-shirt sizes (`max-w-md`).
- **Shadow tokens** — match to component role. `shadow-resting` for buttons, `shadow-raised` for cards, `shadow-floating` for the window.
- **Focus rings** — `ring-2 ring-focus ring-offset-1` on all interactive elements.
- **Touch targets** — minimum 44px effective area.
- **Icons** — import from `@rdna/radiants/icons` only. Never lucide-react, heroicons, or external libs.

---

## Phase 0: Project Setup & Migration

Strip the create-next-app boilerplate and wire up Tailwind v4 + @rdna/radiants.

### Task 0.1: Clean Boilerplate

**Files:**
- Delete: `src/app/page.module.css` (CSS Modules — we're using Tailwind)
- Delete: `src/components/RadiatorBurner.tsx` (broken, unused)
- Modify: `src/app/globals.css` — replace entirely with @rdna/radiants imports
- Modify: `src/app/layout.tsx` — remove CSS Module import, update metadata
- Modify: `src/app/page.tsx` — replace placeholder with shell entry point
- Delete: `src/app/setup/page.tsx` (admin flow moves into the app window)

**Steps:**

1. Remove `src/app/page.module.css`, `src/components/RadiatorBurner.tsx`, `src/app/setup/page.tsx`

2. Replace `src/app/globals.css` with:
```css
@import '@rdna/radiants';
@import '@rdna/radiants/dark';
```

3. Update `src/app/layout.tsx`:
- Remove `import styles from "./page.module.css"` and `import { Inter } from "next/font/google"`
- Remove `className={inter.className}` from `<body>` and `className={styles.main}` from `<main>`
- Update metadata title to `"The Radiator"` and description to `"Irradiate your collection into 1/1 art"`
- Body gets `className="bg-page text-main"`
- Remove `<main>` wrapper — the shell handles layout

4. Commit: `chore: strip create-next-app boilerplate`

### Task 0.2: Install Dependencies & Wire Workspace

**Steps:**

1. Add `@rdna/radiants` as a workspace dependency in `package.json`:
```json
"@rdna/radiants": "workspace:*"
```

2. Install Tailwind v4 + postcss (pnpm):
```bash
pnpm add tailwindcss @tailwindcss/postcss postcss
```

3. Install Zustand:
```bash
pnpm add zustand
```

4. Install class-variance-authority:
```bash
pnpm add class-variance-authority
```

5. Create `postcss.config.mjs`:
```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

6. Add `transpilePackages` to `next.config.mjs` so Next.js processes the workspace TS source:
```js
const nextConfig = {
  transpilePackages: ['@rdna/radiants'],
};
export default nextConfig;
```

7. Build the `@radiants-dao/core` SDK (required for import resolution even though we mock calls during frontend pass):
```bash
cd radiants-program-library && npm run build-pkg && cd ..
```

8. Run `pnpm install` at the monorepo root to link everything.

9. Verify dev server starts without errors: `pnpm run dev`

10. Commit: `chore: install tailwind v4, zustand, cva; wire workspace deps`

### Task 0.3: Set Up Provider Tree

**Files:**
- Modify: `src/app/providers.tsx` — add RDNA ToastProvider, keep Solana providers
- Modify: `src/app/layout.tsx` — update provider wrapping

**Steps:**

1. Update `src/app/providers.tsx`:
- Keep `ConnectionProvider`, `WalletProvider`, `WalletModalProvider`
- Replace `react-hot-toast` `Toaster` with `ToastProvider` from `@rdna/radiants/components/core`
- Remove `require("@solana/wallet-adapter-react-ui/styles.css")` — we're building custom wallet UI with RDNA components

2. Commit: `chore: wire RDNA toast provider`

### Task 0.4: Set Up Zustand Store

**Files:**
- Create: `src/store/index.ts` — main store
- Create: `src/store/viewSlice.ts` — scene/view navigation
- Create: `src/store/radiatorSlice.ts` — radiator config data
- Create: `src/store/burnSlice.ts` — burn ceremony state

**Steps:**

1. Create `src/store/viewSlice.ts`:
```typescript
import { StateCreator } from 'zustand';

export type View =
  | 'explainer'
  | 'landing'
  | 'choose-fate'
  | 'seal-claim'
  | 'feed-radiator'
  | 'ignite'
  | 'radiated'
  | 'admin-wizard';

export type AdminStep =
  | 'select-collection'
  | 'upload-art'
  | 'set-rules'
  | 'review-deploy'
  | 'success';

export interface ViewSlice {
  currentView: View;
  adminStep: AdminStep;
  setView: (view: View) => void;
  setAdminStep: (step: AdminStep) => void;
}

export const createViewSlice: StateCreator<ViewSlice> = (set) => ({
  currentView: 'explainer',
  adminStep: 'select-collection',
  setView: (view) => set({ currentView: view }),
  setAdminStep: (step) => set({ adminStep: step }),
});
```

2. Create `src/store/radiatorSlice.ts`:
```typescript
import { StateCreator } from 'zustand';
import { PublicKey } from '@solana/web3.js';

export interface RadiatorConfig {
  configAccountKey: PublicKey | null;
  collection: PublicKey | null;
  collectionName: string;
  offeringSize: number;
  revealUpfront: boolean;
  totalBurnt: number;
  totalSwaps: number;
}

export interface RadiatorSlice {
  config: RadiatorConfig | null;
  setConfig: (config: RadiatorConfig) => void;
  clearConfig: () => void;
}

export const createRadiatorSlice: StateCreator<RadiatorSlice> = (set) => ({
  config: null,
  setConfig: (config) => set({ config }),
  clearConfig: () => set({ config: null }),
});
```

3. Create `src/store/burnSlice.ts`:
```typescript
import { StateCreator } from 'zustand';
import { PublicKey } from '@solana/web3.js';

export interface NFTItem {
  mint: PublicKey;
  name: string;
  image: string;
  uri: string;
}

export interface BurnSlice {
  eligibleNFTs: NFTItem[];
  primaryNFT: NFTItem | null;
  gasNFTs: NFTItem[];
  offeringRealized: number;
  entangledPair: PublicKey | null;
  rewardPreview: { name: string; image: string; uri: string } | null;
  setEligibleNFTs: (nfts: NFTItem[]) => void;
  setPrimaryNFT: (nft: NFTItem | null) => void;
  addGasNFT: (nft: NFTItem) => void;
  removeGasNFT: (mint: PublicKey) => void;
  incrementOffering: () => void;
  setEntangledPair: (pair: PublicKey | null) => void;
  setRewardPreview: (preview: { name: string; image: string; uri: string } | null) => void;
  resetBurn: () => void;
}

export const createBurnSlice: StateCreator<BurnSlice> = (set) => ({
  eligibleNFTs: [],
  primaryNFT: null,
  gasNFTs: [],
  offeringRealized: 0,
  entangledPair: null,
  rewardPreview: null,
  setEligibleNFTs: (nfts) => set({ eligibleNFTs: nfts }),
  setPrimaryNFT: (nft) => set({ primaryNFT: nft }),
  addGasNFT: (nft) => set((s) => ({ gasNFTs: [...s.gasNFTs, nft] })),
  removeGasNFT: (mint) => set((s) => ({ gasNFTs: s.gasNFTs.filter((n) => !n.mint.equals(mint)) })),
  incrementOffering: () => set((s) => ({ offeringRealized: s.offeringRealized + 1 })),
  setEntangledPair: (pair) => set({ entangledPair: pair }),
  setRewardPreview: (preview) => set({ rewardPreview: preview }),
  resetBurn: () => set({ primaryNFT: null, gasNFTs: [], offeringRealized: 0, entangledPair: null, rewardPreview: null }),
});
```

4. Create `src/store/index.ts` combining all slices:
```typescript
import { create } from 'zustand';
import { ViewSlice, createViewSlice } from './viewSlice';
import { RadiatorSlice, createRadiatorSlice } from './radiatorSlice';
import { BurnSlice, createBurnSlice } from './burnSlice';

type AppStore = ViewSlice & RadiatorSlice & BurnSlice;

export const useAppStore = create<AppStore>()((...a) => ({
  ...createViewSlice(...a),
  ...createRadiatorSlice(...a),
  ...createBurnSlice(...a),
}));
```

5. Commit: `feat: add zustand store with view, radiator, and burn slices`

---

## Phase 1: Mock RadOS Shell

Build the minimal desktop + single window shell.

### Task 1.1: WebGL Sun Background

**Files:**
- Create: `src/components/shell/WebGLSun.tsx`

**Steps:**

1. Copy the WebGL dither sun shader from `/Users/rivermassey/Desktop/dev/DNA/apps/rad-os`. The component at `/components/Rad_os/WebGLSun.tsx` contains:
   - A `<canvas>` element with `imageRendering: pixelated`
   - GLSL fragment shader with 4x4 Bayer matrix dithering
   - Animated sun arc (right-to-left)
   - Mouse repulsion + trail effects
   - Light/dark mode color switching (cream/sun-yellow vs sun-yellow/ink)

2. Adapt the import paths — remove any RadOS-specific dependencies. The component should be self-contained with its own shader code.

3. Mark as `'use client'` (uses refs, effects, canvas).

4. Verify it renders: drop it into page.tsx temporarily, check both light and dark modes.

5. Commit: `feat: port WebGL dither sun from RadOS`

### Task 1.2: Desktop Shell Component

**Files:**
- Create: `src/components/shell/Desktop.tsx`
- Create: `src/components/shell/Watermark.tsx`

**Steps:**

1. Create `src/components/shell/Watermark.tsx`:
- `absolute inset-0 flex items-center justify-center z-0 pointer-events-none text-center`
- Large heading: `font-joystix text-2xl uppercase text-main` — "THE RADIATOR"
- Subtext: `font-mondwest text-lg text-sub` — "Full RadOS coming soon"
- Small: `font-mondwest text-sm text-mute` — "Prototype for Solana Grizzlython Submission"
- Note: We're not copying the WordmarkLogo SVG. Use text-based branding for the prototype.

2. Create `src/components/shell/Desktop.tsx`:
```
fixed inset-0 overflow-hidden
├── z-0: WebGLSun (absolute inset-0)
├── z-0: Watermark (absolute inset-0, pointer-events-none)
├── z-100: AppWindow (absolute, centered)
└── z-200: Taskbar (fixed bottom-0)
```

- Accept `children` (the app window content)
- The watermark should be visible around/behind the window

3. Commit: `feat: desktop shell with WebGL background and watermark`

### Task 1.3: AppWindow Chrome

**Files:**
- Create: `src/components/shell/AppWindow.tsx`
- Create: `src/components/shell/WindowTitleBar.tsx`

**Steps:**

1. Create `src/components/shell/WindowTitleBar.tsx`:

Structure (per RadOS spec):
```
flex items-center gap-3 pl-4 pr-1 pt-1 pb-1
├── Icon (radiation symbol — use Icon from @rdna/radiants/icons or inline SVG)
├── Title: font-joystix text-sm uppercase text-head — "RADIATOR"
├── Divider (flex-1, hr line)
├── Action CTA: Button variant="outline" size="sm" — "Radiate a Collection"
│   (this is the admin entry point — onClick → setView('admin-wizard'))
├── Help button: Button variant="ghost" size="md" iconOnly
├── Fullscreen button: Button variant="ghost" size="md" iconOnly
└── Close button: Button variant="ghost" size="md" iconOnly
```

- Import `Button`, `Divider` from `@rdna/radiants/components/core`
- Import icons from `@rdna/radiants/icons`
- The "Radiate a Collection" CTA calls `useAppStore().setView('admin-wizard')`
- Close button can minimize/hide the window (or no-op for the prototype since it's the only window)

2. Create `src/components/shell/AppWindow.tsx`:

Structure:
```
absolute border border-line rounded-md overflow-hidden flex flex-col shadow-floating
background: linear-gradient(0deg, var(--color-window-chrome-from), var(--color-window-chrome-to))
├── WindowTitleBar
└── Content area: flex-1 min-h-0 overflow-y-auto @container rounded-sm
    └── {children}
```

- Position: centered on desktop, sized to ~1100x700 (or responsive with min/max constraints)
- Set `@container` on the content wrapper for container queries inside
- CSS variable `--app-content-max-height` for child scroll containers
- Not draggable for the prototype (skip react-draggable complexity)

3. Commit: `feat: AppWindow with title bar chrome`

### Task 1.4: Minimal Taskbar

**Files:**
- Create: `src/components/shell/Taskbar.tsx`

**Steps:**

1. Build a simplified taskbar:
```
fixed bottom-0 left-0 right-0 z-[200] flex items-center justify-between px-2 py-2
├── Left: Button variant="primary" size="md" — "Start" (non-functional for prototype)
└── Right: Pill bar bg-page border border-line rounded-sm p-1 flex items-center gap-0.5
    ├── Dark mode toggle (RadMarkIcon or similar — toggles class="dark" on <html>)
    └── Optional: social icon links
```

- Dark mode toggle: `document.documentElement.classList.toggle('dark')`
- Use icons from `@rdna/radiants/icons`
- Taskbar has NO background — floats transparently per RadOS spec

2. Commit: `feat: minimal taskbar with dark mode toggle`

### Task 1.5: Wire Shell Together

**Files:**
- Modify: `src/app/page.tsx` — render the full shell
- Modify: `src/app/layout.tsx` — clean up, just providers + children

**Steps:**

1. Update `src/app/page.tsx` to render:
```tsx
<Desktop>
  <AppWindow>
    <RadiatorApp />
  </AppWindow>
</Desktop>
```

2. Create `src/components/RadiatorApp.tsx` — the main app component that reads `currentView` from Zustand and renders the appropriate scene. For now, just render a placeholder for each view:
```tsx
'use client';
import { useAppStore } from '@/store';

export function RadiatorApp() {
  const currentView = useAppStore((s) => s.currentView);

  switch (currentView) {
    case 'explainer': return <div>Explainer</div>;
    case 'landing': return <div>Landing</div>;
    // ... etc
    default: return <div>Unknown view</div>;
  }
}
```

3. Verify: dev server shows WebGL background, centered window with title bar, taskbar at bottom, placeholder content.

4. Commit: `feat: wire shell together with view routing`

---

## Phase 2: Explainer Flow + Holder Landing

### Task 2.1: Explainer Scene

**Files:**
- Create: `src/components/scenes/Explainer.tsx`

**Steps:**

1. Build a multi-step explainer overlay inside the window content area. Language is nuclear/radiation themed.

Structure — 3-4 slides the user clicks through:
- Slide 1: "WHAT IS THE RADIATOR?" — Big heading. Subtext: "A nuclear forge for your NFT collection."
- Slide 2: "HOW IT WORKS" — Visual: original NFTs → radiator → mutated 1/1. "Select your NFTs. Feed them to the radiator. Irradiate until something entirely new emerges."
- Slide 3: "YOUR COLLECTION. CONCENTRATED." — "Burn the many. Receive the one. Every radNFT is a 1/1 mutation born from the ashes of your collection."
- Final: CTA button — "ENTER THE RADIATOR" → transitions to `landing` view

2. Use RDNA components: `Button` for CTA, step indicators via `Badge` or custom dots.

3. Animate slide transitions with `animate-fadeIn` (RDNA animation class, `duration-base`).

4. Store "has seen explainer" in localStorage so returning users skip it.

5. Commit: `feat: explainer flow — what is the radiator`

### Task 2.2: Holder Landing Scene

**Files:**
- Create: `src/components/scenes/Landing.tsx`
- Create: `src/components/ui/StatBadge.tsx`

**Steps:**

1. Build the landing page (maps to Figma screen 2 — "RADIATIONS" grid):

```
@container content area
├── Header row
│   ├── Left: radiation icon + "RADIATIONS" heading (font-joystix text-xl uppercase)
│   └── Right: StatBadge "TOTAL NFTS IRRADIATED: 32,311" + StatBadge "TOTAL VALUE BURNT: 2,359.80 *"
├── Grid of radiator cards (@sm:grid-cols-2 @lg:grid-cols-4 gap-4)
│   └── Each card: collection image, collection name (font-joystix text-sm uppercase)
│       onClick → load that radiator config → setView('choose-fate')
└── Empty state if no radiators: "No active radiators yet"
```

2. `StatBadge` component — small pill with label + value, styled with `bg-depth border border-line rounded-sm px-3 py-2 font-joystix text-sm uppercase`.

3. For the prototype, use mock data for the radiator list. Create `src/data/mockRadiators.ts` with 4-6 sample entries.

4. Commit: `feat: holder landing with radiator grid`

### Task 2.3: Wallet Connection Integration

**Files:**
- Create: `src/components/ui/ConnectWallet.tsx`
- Modify: `src/components/shell/WindowTitleBar.tsx` — add wallet status

**Steps:**

1. Build `ConnectWallet.tsx` — a custom wallet connect button using RDNA Button component + `useWallet()` hook:
- Disconnected: `Button variant="primary"` — "CONNECT WALLET"
- Connected: shows truncated address in a `Badge` or the title bar

2. Add wallet address display to `WindowTitleBar.tsx` — right side, before the action buttons:
- Show truncated pubkey like the Figma mockup: `"3X91...ANHU"` in a bordered pill
- Use `font-joystix text-sm`

3. Gate burn flow scenes behind wallet connection — if not connected, show `ConnectWallet` CTA instead of the NFT grid.

4. Commit: `feat: wallet connection with RDNA styling`

---

## Phase 3: Holder Burn Ceremony (Theater)

The 6-scene ceremonial flow. Each scene is a full replacement of the window content area.

### Task 3.1: Choose Your Fate (Scene 1)

**Files:**
- Create: `src/components/scenes/ChooseFate.tsx`
- Create: `src/components/ui/NFTCard.tsx`

**Steps:**

1. Fetch the holder's eligible NFTs using `getCollectionAssets()` from `src/utils/index.ts` (already exists). Filter by collection AND owner (pass wallet pubkey).

2. Build the NFT grid — holder's eligible NFTs from this collection:
```
├── Heading: "CHOOSE YOUR FATE" (font-joystix text-xl uppercase)
├── Subtext: "Select the NFT that will be irradiated" (font-mondwest)
├── NFT grid (@sm:grid-cols-2 @md:grid-cols-3 @lg:grid-cols-4 gap-4)
│   └── NFTCard: image, name, optional value
│       onClick → setPrimaryNFT(nft) → show confirmation
├── If reveal is on: show the mapped 1/1 preview below the selected NFT
└── CTA: Button variant="primary" size="lg" — "SEAL YOUR FATE" → setView('seal-claim')
    (disabled until a primary NFT is selected)
```

3. `NFTCard` — reusable card component:
```
border border-line rounded-sm overflow-hidden cursor-pointer
hover: shadow-lifted (Sun Mode: instant, no transition)
selected: border-focus shadow-glow-success
├── Image: aspect-square object-cover
├── Name: font-joystix text-sm uppercase p-2
└── Optional value: font-mondwest text-sm text-mute p-2
```

4. Commit: `feat: choose your fate — NFT selection grid`

### Task 3.2: Seal the Claim (Scene 2)

**Files:**
- Create: `src/components/scenes/SealClaim.tsx`

**Steps:**

1. Confirmation screen before the `createClaim` transaction:
```
Centered layout
├── Selected NFT large preview (the primary NFT)
├── If reveal on: arrow/radiation icon → reward 1/1 preview
├── Text: "YOUR FATE IS ABOUT TO BE SEALED" (font-joystix uppercase)
├── Offering requirement: "This radiation requires {offeringSize - 1} additional sacrifices"
├── Warning text: "This action cannot be undone" (text-danger font-mondwest)
├── Two buttons:
│   ├── Button variant="ghost" — "GO BACK" → setView('choose-fate')
│   └── Button variant="primary" size="lg" — "SEAL IT" → execute createClaim
```

2. On "SEAL IT" click:
- Show loading state (Button with `loading` prop or Spinner from RDNA)
- Call `TheRadiatorCore.createClaim(configAccount, configData, tree, nftMint, index, name, uri)`
- On success: store entangledPair in burnSlice, show dramatic transition, then `setView('feed-radiator')`
- On error: show toast with error message via `useToast()`

3. Transition: fade/scale animation between scenes using RDNA animation classes.

4. Commit: `feat: seal the claim — confirmation + tx`

### Task 3.3: Feed the Radiator (Scene 3)

**Files:**
- Create: `src/components/scenes/FeedRadiator.tsx`
- Create: `src/components/ui/FuelGauge.tsx`

**Steps:**

1. This is the gas-burning loop. Maps to Figma screens 3-5 (the split layout content, restructured as a theater scene):

```
├── Top: FuelGauge showing progress
│   ├── Label: "FUEL LEVEL" (font-joystix)
│   ├── Progress bar: {offeringRealized} / {offeringSize - 1} filled
│   └── Text: "{remaining} more sacrifices needed"
├── Selected primary NFT (small preview, fixed in corner or top)
├── Already-burned gas NFTs (shown as greyed/crossed-out tombstones)
├── Available NFTs grid (remaining eligible NFTs minus primary, minus already burned)
│   └── NFTCard — onClick selects as next gas NFT
├── Selected gas NFT confirmation:
│   ├── Preview of the NFT about to be burned
│   ├── "FEED TO THE RADIATOR?" (font-joystix)
│   └── Button variant="destructive" — "BURN IT" → execute burnNFT
└── When all offerings complete: auto-transition or CTA → setView('ignite')
```

2. `FuelGauge` — custom component using RDNA `Progress` component:
- `variant="default"`, shows offering count
- Fills up with each burn
- Each fill triggers a dramatic flash (status glow animation)

3. On each "BURN IT" click:
- Call `TheRadiatorCore.burnNFT(targetNft, configAccountKey, configAccount, entangledPair, escrowAccountB)`
- On success: increment `offeringRealized`, add NFT to burned list, show burn animation
- On failure: toast error
- When `offeringRealized === offeringSize - 1`: show "RADIATOR IS FULLY FUELED" + transition CTA

4. Commit: `feat: feed the radiator — gas burn loop with fuel gauge`

### Task 3.4: Ignite (Scene 4)

**Files:**
- Create: `src/components/scenes/Ignite.tsx`

**Steps:**

1. The final swap scene — maps to Figma screen 6 ("RADIATING" progress):

```
Centered layout (full window content area)
├── Radiation icon (large, animated)
├── "RADIATING" (font-joystix text-3xl uppercase, could animate with pulse)
├── "{percentage}% COMPLETE" (font-joystix text-lg)
├── Progress bar (RDNA Progress component, size="lg")
└── No back button — this is a one-way operation
```

2. On mount, auto-execute the swap:
- Call `TheRadiatorCore.swap(configAccountKey, configAccount, mintA, mintB, entangledPair, tokenAccountA, escrowAccountB, radiatorLut)`
- Progress simulation: 0% → "Burning original..." → 33% → "Minting tombstone..." → 66% → "Transferring your radNFT..." → 100%
- On success: dramatic pause at 100%, then transition to `setView('radiated')`
- On failure: show error state with retry button

3. The progress text is cosmetic — the actual swap is a single transaction. The staged progress creates drama while waiting for confirmation.

4. Commit: `feat: ignite — swap execution with progress ceremony`

### Task 3.5: Radiated — Victory (Scene 5)

**Files:**
- Create: `src/components/scenes/Radiated.tsx`
- Create: `src/components/ui/LineageTree.tsx`

**Steps:**

1. Victory reveal — maps to Figma screen 7:

```
Centered layout
├── "RADIATED {NFT_NAME}" (font-joystix text-2xl uppercase)
├── Decorative divider
├── Large 1/1 art reveal (the new radNFT image)
│   If reveal was hidden: animate the image appearing (scaleIn + fadeIn)
│   If reveal was upfront: show it proudly, no surprise
├── Decorative connection line (vertical pipe → radiation icon → bracket)
├── LineageTree: thumbnails of the burned NFTs (the sacrifices)
│   └── Row of small NFTCards with names, shown as "consumed"
├── Action buttons:
│   ├── Button variant="primary" — "VIEW IN WALLET" (external link to explorer)
│   ├── Button variant="outline" — "SHARE" (copy link or social share)
│   └── Button variant="ghost" — "RADIATE AGAIN" → resetBurn() + setView('choose-fate')
```

2. `LineageTree` — shows the parent-child relationship:
- The radNFT at top (large)
- Connection line with radiation icon
- Burned NFTs in a row below (small thumbnails)
- Styled to look like the Figma screen 7 tree diagram

3. Commit: `feat: radiated — victory reveal with lineage tree`

---

## Phase 4: Admin Wizard

Accessed via "Radiate a Collection" CTA in the window title bar.

### Task 4.1: Admin Wizard Container

**Files:**
- Create: `src/components/scenes/AdminWizard.tsx`
- Create: `src/components/ui/WizardStep.tsx`

**Steps:**

1. Build the wizard container that reads `adminStep` from Zustand and renders the current step:

```
├── Step indicator bar (top)
│   ├── Steps: Collection → Art → Rules → Deploy → Done
│   └── Current step highlighted, completed steps have check icon
├── Content area — renders current admin step component
└── Navigation: Back / Next buttons (controlled by each step)
```

2. `WizardStep` — wrapper providing consistent layout for each step:
- Heading (font-joystix text-xl uppercase)
- Description (font-mondwest text-sub)
- Content slot (children)
- Footer with navigation buttons

3. Use RDNA `Tabs` component in `pill` variant for the step indicator, or build a custom stepper with `Badge` components.

4. Commit: `feat: admin wizard container with step navigation`

### Task 4.2: Step 1 — Select Collection

**Files:**
- Create: `src/components/admin/SelectCollection.tsx`

**Steps:**

1. Collection selection step:
```
├── Heading: "SELECT COLLECTION" / "What collection are you irradiating?"
├── Input (RDNA Input component): "Collection address"
│   └── On paste/enter: validate as PublicKey, fetch collection info via DAS
├── Collection preview card (when valid):
│   ├── Collection image
│   ├── Collection name
│   ├── NFT count
│   └── Floor price (if available)
├── Loading state while fetching
├── Error state if invalid address or fetch fails
└── "NEXT" button → setAdminStep('upload-art')
```

2. Use existing `getCollectionAssets` utility to validate the collection exists and count NFTs.

3. Store collection pubkey and metadata in a local state or a new admin slice.

4. Commit: `feat: admin step 1 — select collection`

### Task 4.3: Step 2 — Upload Art

**Files:**
- Create: `src/components/admin/UploadArt.tsx`

**Steps:**

1. Art upload step — this is the most complex admin step:
```
├── Heading: "UPLOAD IRRADIATED ART" / "These are the 1/1 mutations your holders will receive"
├── Toggle: "Reveal art to holders before they commit?" (RDNA Switch component)
├── Upload area:
│   ├── Drag-and-drop zone OR file picker
│   ├── Accepts multiple images (bulk upload)
│   └── Shows upload progress
├── Uploaded art grid:
│   └── Each item: thumbnail, name input, metadata fields
│       ├── Auto-assigned index
│       └── Editable name + optional description
├── Mapping preview: "These will be mapped to {N} NFTs in the collection"
└── "NEXT" → setAdminStep('set-rules')
```

2. For the prototype: **mock the storage**. Files are stored as local blob URLs. Build the upload UI to be swappable — the Arweave integration comes later. Create a `src/utils/storage.ts` with:
```typescript
export async function uploadArt(file: File): Promise<string> {
  // Mock: return blob URL
  return URL.createObjectURL(file);
}
// TODO: Replace with Arweave/Irys upload
```

3. Commit: `feat: admin step 2 — upload art with mock storage`

### Task 4.4: Step 3 — Set Rules

**Files:**
- Create: `src/components/admin/SetRules.tsx`

**Steps:**

1. Configuration step:
```
├── Heading: "SET RADIATION RULES"
├── Offering size: Input type="number" with Label
│   └── "How many NFTs must be sacrificed? (including the primary)"
│   └── Min 1, max reasonable limit
├── Burn toggle: Switch — "Allow gas burns" (maps to canBurn)
├── Symbol: Input — "NFT symbol (max 10 chars)"
├── Fees section (advanced, collapsible):
│   ├── Swap fee (SOL)
│   └── Royalty split
└── "NEXT" → setAdminStep('review-deploy')
```

2. Use RDNA components: `Input`, `Label`, `Switch`, `Accordion` (for advanced settings).

3. Commit: `feat: admin step 3 — set radiation rules`

### Task 4.5: Step 4 — Review & Deploy

**Files:**
- Create: `src/components/admin/ReviewDeploy.tsx`

**Steps:**

1. Summary + confirmation:
```
├── Heading: "REVIEW YOUR RADIATOR"
├── Summary cards:
│   ├── Collection: name, address, NFT count
│   ├── Art: thumbnail grid of uploaded 1/1s, reveal mode
│   ├── Rules: offering size, symbol, fees
├── Warning: "Deploying creates an on-chain config. This costs SOL."
├── Two buttons:
│   ├── Button variant="ghost" — "BACK" → previous step
│   └── Button variant="primary" size="lg" — "DEPLOY RADIATOR"
```

2. On deploy:
- Build NftDistributorElement array from uploaded art
- Call `TheRadiatorCore.createConfig(elements, walletPubkey, offeringSize, canBurn, treasuryMint, collection)`
- Show loading state
- On success: store returned tx + config address, `setAdminStep('success')`
- On failure: toast error

3. Commit: `feat: admin step 4 — review and deploy`

### Task 4.6: Step 5 — Success

**Files:**
- Create: `src/components/admin/DeploySuccess.tsx`

**Steps:**

1. Success screen:
```
├── Radiation icon (large, celebratory)
├── "RADIATOR DEPLOYED" (font-joystix text-2xl uppercase)
├── Config address (truncated, with copy button)
├── Transaction link (external link to Solana explorer)
├── Shareable link (the URL that holders will use)
│   └── Copy button: copies URL with config ID
├── CTA: Button variant="primary" — "VIEW YOUR RADIATOR" → load config, setView('landing')
```

2. Commit: `feat: admin step 5 — deploy success`

---

## Phase 5: Client Adapter, Integration & Polish

### Task 5.1: Client Adapter (`radiator-client.ts`) ✅

**Files:**
- Create: `src/lib/radiator-client.ts` — unified adapter with mock/live routing
- Modify: `src/constants.ts` — add `USE_MOCK_CHAIN` flag

**Steps:**

1. Add to `src/constants.ts`:
```typescript
export const USE_MOCK_CHAIN = true;
```

2. Create `src/lib/radiator-client.ts` with this structure:
```typescript
import { USE_MOCK_CHAIN } from '@/constants';
import { TheRadiatorCore } from '@radiants-dao/core';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';

// ---- Shared interface (callers use only this) ----

export interface RadiatorClient {
  createConfig(params: CreateConfigParams): Promise<CreateConfigResult>;
  createClaim(params: CreateClaimParams): Promise<CreateClaimResult>;
  burnGasNFT(params: BurnParams): Promise<string>;
  swap(params: SwapParams): Promise<string>;
  getEntangledPair(configKey: PublicKey, index: number): Promise<[any, PublicKey]>;
}

// ---- Live implementation (SDK calls) ----

function createLiveClient(connection: Connection, wallet: any): RadiatorClient {
  const core = new TheRadiatorCore(connection, wallet);
  return {
    async createConfig(params) {
      const elements = params.artItems.map(item => ({
        address: item.address, name: item.name, uri: item.uri,
      }));
      return core.createConfig(
        elements, params.updateAuthority, params.offeringSize,
        params.canBurn, params.treasuryMint, params.collection
      );
    },
    // createClaim, burnGasNFT, swap — live implementations ready but not routed yet
    async createClaim(params) { throw new Error('createClaim not live — SDK blocker: hardcoded collection metadata'); },
    async burnGasNFT(params) { throw new Error('burnGasNFT not live — SDK blocker: hardcoded collection metadata'); },
    async swap(params) { throw new Error('swap not live — SDK blocker: RADIATOR_LUT is PublicKey.default'); },
    async getEntangledPair(configKey, index) { return core.getEntangledPair(configKey, index); },
  };
}

// ---- Mock implementation (simulated delays + fake data) ----

function createMockClient(): RadiatorClient {
  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
  return {
    async createConfig(params) {
      await delay(2000);
      return { tx: 'mock_tx_' + Date.now(), tree: null, root: [] };
    },
    async createClaim(params) {
      await delay(1500);
      const fakePair = Keypair.generate().publicKey;
      const fakeMint = Keypair.generate().publicKey;
      return [fakePair, fakeMint, fakeMint, fakeMint];
    },
    async burnGasNFT(params) { await delay(1000); return 'mock_burn_' + Date.now(); },
    async swap(params) { await delay(2000); return 'mock_swap_' + Date.now(); },
    async getEntangledPair(configKey, index) {
      return [null, Keypair.generate().publicKey];
    },
  };
}

// ---- Factory: reads USE_MOCK_CHAIN, routes per method ----

export function createRadiatorClient(connection: Connection, wallet: any): RadiatorClient {
  if (USE_MOCK_CHAIN) return createMockClient();

  // Hybrid mode: live createConfig, mock everything else
  const live = createLiveClient(connection, wallet);
  const mock = createMockClient();
  return {
    createConfig: live.createConfig,   // LIVE — one real devnet path
    createClaim: mock.createClaim,     // MOCKED — SDK blocker
    burnGasNFT: mock.burnGasNFT,       // MOCKED — SDK blocker
    swap: mock.swap,                   // MOCKED — SDK blocker
    getEntangledPair: mock.getEntangledPair,
  };
}
```

3. Create type interfaces for `CreateConfigParams`, `CreateClaimParams`, `BurnParams`, `SwapParams`, `CreateConfigResult`, `CreateClaimResult`.

4. Commit: `feat: radiator-client adapter with mock/live split (createConfig live)`

### Task 5.2: DAS Integration ✅

**Files:**
- Modify: `src/utils/index.ts` — refine `getCollectionAssets`

**Steps:**

1. Update the existing DAS utility:
- Add proper TypeScript types for DAS response
- Add `getAssetsByOwner` for fetching holder's NFTs
- Add error handling and loading states
- Support pagination if collection is large

2. Add a note/TODO about needing a DAS-compatible RPC endpoint (Helius, Triton) — the default devnet endpoint won't support `searchAssets`.

3. Commit: `feat: refine DAS integration with types and error handling`

### Task 5.3: Mock Data for Development ✅

**Files:**
- Create: `src/data/mockRadiators.ts`
- Create: `src/data/mockNFTs.ts`

**Steps:**

1. Create mock radiator configs for development without on-chain calls:
```typescript
export const mockRadiators = [
  {
    name: 'Ded Monke',
    collection: 'DedMo...nke1',
    image: '/mock/ded-monke-collection.png',
    offeringSize: 3,
    totalBurnt: 3000,
    totalValue: 435.25,
    revealUpfront: true,
  },
  // ... 3-5 more
];
```

2. Create mock NFT data for burn flow testing:
```typescript
export const mockNFTs = [
  { mint: '...', name: 'Ded Monkes #420', image: '/mock/dm-420.png', uri: '...', value: 16.80 },
  // ... 6-8 mock NFTs
];
```

3. Add placeholder images to `public/mock/` directory.

4. Wire mock data into components with a `USE_MOCK_DATA` flag in `src/constants.ts`.

5. Commit: `feat: mock data for development`

### Task 5.4: Scene Transitions ✅

**Files:**
- Create: `src/components/ui/SceneTransition.tsx`

**Steps:**

1. Build a transition wrapper for scene changes:
```tsx
export function SceneTransition({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-fadeIn" style={{ animationDuration: 'var(--duration-base)' }}>
      {children}
    </div>
  );
}
```

2. Wrap each scene in the `RadiatorApp` switch with `SceneTransition`.

3. For the "Seal Claim" → "Feed Radiator" and "Ignite" → "Radiated" transitions, use `animate-scaleIn` for extra drama.

4. All animations use RDNA duration tokens. Max 300ms. Ease-out only.

5. Commit: `feat: scene transitions with RDNA animation tokens`

### Task 5.5: Resume Flow Detection ✅

**Files:**
- Create: `src/hooks/useResumeDetection.ts`

**Steps:**

1. On wallet connect, check if the holder has an existing `EntangledPair` for the current radiator config:
- Call `getEntangledPair(configKey, index)` for each eligible NFT
- If found with `swapHappened === false`:
  - Check `offeringRealized` against `offeringSize - 1`
  - If incomplete: drop user into `feed-radiator` scene at the right fuel level
  - If complete: drop user into `ignite` scene

2. This prevents users from getting stuck if they started the ceremony but didn't finish.

3. Commit: `feat: resume detection for partial burn flows`

### Task 5.6: Error Handling & Toast Feedback ✅

**Files:**
- Create: `src/hooks/useRadiatorToast.ts`

**Steps:**

1. Create a hook wrapping RDNA's `useToast()` with radiator-specific messages:
```typescript
export function useRadiatorToast() {
  const { toast } = useToast();

  return {
    txSuccess: (sig: string) => toast({ variant: 'success', title: 'TRANSACTION CONFIRMED', description: `Signature: ${sig.slice(0, 8)}...` }),
    txError: (err: Error) => toast({ variant: 'error', title: 'TRANSACTION FAILED', description: err.message }),
    walletRequired: () => toast({ variant: 'warning', title: 'WALLET REQUIRED', description: 'Connect your wallet to continue' }),
    burnComplete: (name: string) => toast({ variant: 'success', title: `${name} IRRADIATED`, description: 'Sacrifice accepted' }),
  };
}
```

2. Wire into all transaction calls across scenes.

3. Commit: `feat: radiator toast feedback for all tx outcomes`

---

## Phase 6: Visual Polish

### Task 6.1: Review Against Figma Mockups ✅

Take screenshots of each scene and compare against the Figma reference screens. Adjust spacing, typography hierarchy, and layout to match the intended structure (not the old visual style — we're using RDNA tokens now).

Figma screen mapping:
| Scene | Figma desktop node |
|-------|-------------------|
| Landing | `4246:22027` |
| Choose Fate (empty) | `4246:23899` |
| Choose Fate (populated) | `4246:24077` |
| Feed Radiator (selected) | `4246:24234` |
| Ignite | `4246:23761` |
| Radiated | `4246:24391` |

### Task 6.2: Sun/Moon Mode Verification ✅

Go through every scene in both Sun Mode and Moon Mode. Per DESIGN.md:
- Sun Mode: sharp shadows, solid borders, snap hover feedback, cream backgrounds
- Moon Mode: ambient glows, translucent borders, eased hover, ink backgrounds

Fix any tokens that don't switch correctly. Check `dark.css` parity for any custom tokens.

### Task 6.3: Container Query Responsiveness ✅

Resize the AppWindow (or simulate smaller sizes) and verify all layouts respond correctly using container queries (`@sm:`, `@md:`, `@lg:`). No viewport breakpoints should be used inside the window.

---

## File Structure Summary

After all phases, the `src/` directory should look like:

```
src/
├── app/
│   ├── globals.css              (RDNA imports only)
│   ├── layout.tsx               (providers + children)
│   ├── page.tsx                 (renders Desktop > AppWindow > RadiatorApp)
│   └── providers.tsx            (Solana + RDNA providers)
├── components/
│   ├── shell/
│   │   ├── Desktop.tsx          (background + watermark + children)
│   │   ├── WebGLSun.tsx         (ported from RadOS)
│   │   ├── Watermark.tsx        (centered branding text)
│   │   ├── AppWindow.tsx        (window frame + content area)
│   │   ├── WindowTitleBar.tsx   (title bar chrome + admin CTA)
│   │   └── Taskbar.tsx          (bottom bar + dark mode toggle)
│   ├── scenes/
│   │   ├── Explainer.tsx        (onboarding slides)
│   │   ├── Landing.tsx          (radiator grid)
│   │   ├── ChooseFate.tsx       (NFT selection)
│   │   ├── SealClaim.tsx        (claim confirmation + tx)
│   │   ├── FeedRadiator.tsx     (gas burn loop)
│   │   ├── Ignite.tsx           (swap execution + progress)
│   │   ├── Radiated.tsx         (victory reveal)
│   │   └── AdminWizard.tsx      (wizard container)
│   ├── admin/
│   │   ├── SelectCollection.tsx
│   │   ├── UploadArt.tsx
│   │   ├── SetRules.tsx
│   │   ├── ReviewDeploy.tsx
│   │   └── DeploySuccess.tsx
│   ├── ui/
│   │   ├── NFTCard.tsx
│   │   ├── StatBadge.tsx
│   │   ├── FuelGauge.tsx
│   │   ├── LineageTree.tsx
│   │   ├── ConnectWallet.tsx
│   │   ├── WizardStep.tsx
│   │   └── SceneTransition.tsx
│   └── RadiatorApp.tsx          (main view router)
├── store/
│   ├── index.ts                 (combined store)
│   ├── viewSlice.ts
│   ├── radiatorSlice.ts
│   └── burnSlice.ts
├── services/
│   └── radiator.ts              (SDK wrapper)
├── hooks/
│   ├── useResumeDetection.ts
│   └── useRadiatorToast.ts
├── utils/
│   ├── index.ts                 (DAS utilities)
│   └── storage.ts               (mock art storage)
├── data/
│   ├── mockRadiators.ts
│   └── mockNFTs.ts
├── constants.ts
└── types/
    └── index.ts
```

---

## Execution Order

Phases are sequential. Within each phase, tasks are sequential except where noted.

**Estimated task count:** ~25 tasks across 6 phases.

**Critical path:** Phase 0 (setup) → Phase 1 (shell) → Phase 2 (explainer + landing) → Phase 3 (burn ceremony) → Phase 4 (admin wizard) → Phase 5 (integration) → Phase 6 (polish)

Phase 5 tasks (SDK service, DAS, mock data, transitions, resume detection, toasts) can be partially parallelized — mock data (5.3) can be done alongside SDK work (5.1).
