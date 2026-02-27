# Radiator Frontend Brainstorm

**Date:** 2026-02-27
**Status:** Decided

## What We're Building

A full frontend for The Radiator — a Solana NFT burning tool that lets holders burn N old NFTs from a collection to receive a unique 1/1 "radNFT." Two user roles: **admins** who create radiator configs (select collection, upload 1/1 art, set rules) and **holders** who go through a ceremonial multi-step burn flow to claim their radNFT.

Built with the **@rdna/radiants** design system (retro pixel-art aesthetic, Tailwind v4, Joystix/Mondwest/PixelCode fonts, cream/ink palette). Prototype runs standalone as a Next.js app; eventually integrates as a RadOS window app with hash-based deep linking.

## Why This Approach

**Linear Wizard + Full Burn Theater.** The admin gets a focused step-by-step wizard that abstracts away complexity (merkle trees, PDAs). The holder gets a theatrical, ceremonial burn experience — each phase of the on-chain flow (claim, burn gas, swap) becomes a distinct "scene" with dramatic transitions. This maximizes the emotional weight of burning NFTs and revealing the 1/1 art, which is core to the product's identity.

The mockups confirmed the content model (primary NFT selection, gas NFT grid, value stats, progress bar, lineage tree on victory) but we're restructuring the flat split-screen layout into a multi-scene theater with progressive disclosure.

## Key Decisions

- **Two roles, both in scope:** Admin creates radiator configs. Holders burn NFTs. Both flows built for the prototype.
- **Full theater burn UX:** Each burn phase is its own screen/scene with transitions — not a single split-screen. Drama reserved for the full experience, not just the processing step.
- **Admin wizard abstracts complexity:** No merkle tree or PDA talk. "Upload art, pick collection, set rules, deploy."
- **Art upload in wizard:** Admin uploads images + metadata during setup. We handle storage.
- **Reveal timing is admin-configurable:** Per-radiator toggle — show the mapped 1/1 upfront OR hide until swap completes.
- **@rdna/radiants design system:** All semantic tokens, RDNA components (Button, Card, Dialog, Tabs, Toast, Progress, Web3ActionBar, etc.), sun/moon modes.
- **RadOS integration later:** Prototype is standalone Next.js. Will port to RadOS AppWindow (lazy-loaded component, hash-based routing) after prototype is solid.

## UX Flows

### Admin Flow — "Create a Radiator"

| Step | Scene | Description |
|------|-------|-------------|
| 0 | **Connect Wallet** | Gate — must connect before proceeding |
| 1 | **Select Collection** | Enter collection address. Preview: name, image, NFT count. |
| 2 | **Upload 1/1 Art** | Bulk upload images + metadata. Map rewards to collection NFTs (or auto-assign). Toggle: reveal upfront or hide until swap. |
| 3 | **Set Rules** | Offering size (how many NFTs to burn), fees, can_burn toggle, symbol. |
| 4 | **Review & Deploy** | Summary. Confirm -> sign tx -> merkle tree generated -> config created on-chain. |
| 5 | **Success** | Shareable radiator link. Copy button. |

### Holder Flow — "The Burn Ceremony" (Full Theater)

| Step | Scene | Description |
|------|-------|-------------|
| 0 | **Landing** | Radiator info: collection name, offering size, stats (total burnt, total value). Connect wallet CTA. |
| 1 | **Choose Your Fate** | Grid of holder's eligible NFTs from this collection. Select the primary NFT to "entangle." If reveal is on, preview the mapped 1/1. |
| 2 | **Seal the Claim** | Confirm entanglement. Sign tx. Reward pNFT minted to escrow. Dramatic transition — fate is sealed. |
| 3 | **Feed the Radiator** | Fuel gauge / offering counter. Select gas NFTs one at a time from remaining eligible NFTs. Each burn is its own dramatic moment. Repeat until `offering_size - 1` reached. |
| 4 | **Ignite** | Final swap. Original NFT burns. Tombstone cNFT (RIP) minted via Murder Tree. "RADIATING" progress screen. |
| 5 | **Radiated** | Full reveal of the new 1/1 radNFT. Lineage tree showing which NFTs were sacrificed. Share button. |

### Browse / Directory

- "RADIATIONS" page: grid of active radiator configs as collection cards with stats
- Each card links to that radiator's holder burn flow
- Global stats: total NFTs burnt, total value burnt across all radiators

## On-Chain Flow Reference

The Solana program (Anchor) exposes 6 instructions. The holder flow maps to 3:

1. **`create_claim`** — registers entanglement between holder's NFT (mint A) and reward (mint B). Verifies merkle proof. Mints reward pNFT to escrow.
2. **`burn_gas_nft`** (x N) — burns selected gas NFTs. Increments `offering_realized`. Holder picks which NFTs to sacrifice.
3. **`swap`** — requires all offerings complete. Burns original NFT, mints RIP tombstone cNFT, transfers reward pNFT from escrow to holder wallet. Collects swap fee.

Key detail: **reward art is predetermined** by the merkle tree. Each eligible NFT maps to a specific 1/1 (name + URI) at config creation time. Not random.

`offering_size` defines total NFTs involved. Gas burns required = `offering_size - 1`. If `offering_size = 1`, it's a direct swap (no gas burns needed).

## Open Questions

- **Art storage:** Where do uploaded images go? Arweave, IPFS/Pinata, Shadow Drive? Need to decide before building the upload wizard.
- **DAS endpoint:** Default devnet RPC doesn't support DAS. Need a DAS-compatible RPC (Helius, Triton, etc.) for `searchAssets` to work.
- **Resume flow:** If a holder has an existing `EntangledPair` (created claim but didn't finish), how do they resume? Need to detect on-chain state and drop them into the right scene.
- **`@radiants-dao/core` SDK surface:** Need to audit what methods are available beyond `createConfig`. The frontend needs wrappers for `create_claim`, `burn_gas_nft`, and `swap`.
- **Collection validation:** How does the admin specify which NFTs in a collection are eligible? All of them, or a subset?

## Figma Reference

**File:** `MICrnPV32mAQA2kxjGsooA` — "Radiants 2026"
**Section:** node `4246:21791` — "Radiator"

Desktop screens (pre-DNA styling, content reference only):

| Screen | Node ID | Content |
|--------|---------|---------|
| 1 — Landing | `4246:21876` | Logo, tagline, entry CTAs |
| 2 — Browse Radiators | `4246:22027` | Collection grid with global stats |
| 3 — Burn (empty) | `4246:23899` | Split layout, placeholder NFT slots |
| 4 — Burn (loaded) | `4246:24077` | Primary selected, gas NFTs shown |
| 5 — Burn (selected) | `4246:24234` | Gas selected, ready to radiate |
| 6 — Radiating | `4246:23761` | Progress bar, processing state |
| 7 — Victory | `4246:24391` | New 1/1 revealed, lineage tree |

Mobile variants also exist (393px wide, same screen numbering).

Note: These are rough pre-DNA mockups. CTA text is draft. Content structure carries forward; visual styling will be rebuilt with @rdna/radiants tokens and components.

## Research Notes

- **@rdna/radiants** package at `/Users/rivermassey/Desktop/dev/DNA/packages/radiants` — full component library (Button, Card, Dialog, Tabs, Toast, Progress, Badge, Web3ActionBar, etc.), semantic color tokens, CVA variants, compound component pattern with lifted state hooks
- **On-chain program** at `radiants-program-library/programs/the-radiator/` — Anchor 0.30.1, 6 instructions, `ConfigAccount` + `EntangledPair` + `TheRadiator` state accounts
- **RadOS** at `/Users/rivermassey/Desktop/dev/DNA/apps/rad-os` — Zustand window manager, hash-based routing (`#appId`), `APP_REGISTRY` pattern, lazy-loaded app components receiving `{ windowId }` prop
- **Monolith hackathon** at `/Users/rivermassey/Desktop/dev/DNA/apps/monolith-hackathon` — query-param deep tab linking, single draggable InfoWindow pattern
- **Current radiator app** is a bare Next.js 14 scaffold — wallet adapter wiring works, DAS utility exists, `TheRadiatorCore.createConfig()` wired once, everything else is placeholder or broken
