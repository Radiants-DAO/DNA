# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"The Radiator" — a Solana NFT burning tool built with Next.js 14 (App Router). Users connect a Solana wallet, select NFTs from a collection, and create a "radiator" configuration that manages burning. The core burning logic lives in the `@radiants-dao/core` package (`TheRadiatorCore`).

## Commands

- `npm run dev` — start dev server (localhost:3000)
- `npm run build` — production build
- `npm run lint` — ESLint (extends `next/core-web-vitals`)

No test framework is configured.

## Architecture

**Stack:** Next.js 14.2, React 18, TypeScript, Solana Web3.js, CSS Modules

**Path alias:** `@/*` maps to `./src/*`

**Key files:**
- `src/app/providers.tsx` — client-side provider tree: Solana `ConnectionProvider` → `WalletProvider` (Phantom, Solflare) → `WalletModalProvider` + react-hot-toast `Toaster`. RPC endpoint from `NEXT_PUBLIC_RPC_ENDPOINT` env var, defaults to devnet.
- `src/app/setup/page.tsx` — setup page that creates a radiator config via `TheRadiatorCore.createConfig()`. Fetches collection assets using DAS API, then maps them to elements for the on-chain config.
- `src/components/RadiatorBurner.tsx` — burner component that lists valid NFTs from a collection for burning.
- `src/utils/index.ts` — `getCollectionAssets()` calls the Solana DAS `searchAssets` RPC method to fetch NFTs by collection grouping.
- `src/constants.ts` — `defaultRpcEndpoint` (devnet).

**Data flow:** Wallet connection (via Solana wallet adapter) → fetch collection NFTs (DAS API) → create/interact with radiator config (via `@radiants-dao/core`).

**Styling:** CSS Modules (`page.module.css`) + global CSS (`globals.css`). Uses Inter font via `next/font`.

## Environment Variables

- `NEXT_PUBLIC_RPC_ENDPOINT` — Solana RPC URL. Omit to default to devnet. The network (devnet/mainnet) is auto-detected from the URL.
