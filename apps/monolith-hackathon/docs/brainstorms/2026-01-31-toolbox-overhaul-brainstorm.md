# Toolbox Overhaul Brainstorm

**Date:** 2026-01-31
**Status:** Decided

## What We're Building

A comprehensive overhaul of the hackathon app's Toolbox panel, replacing the current 4-tab placeholder layout with the full Webflow archive content. Three tabs: **Dev Docs** (accordion-style resources), **Assets** ("Coming Soon"), and **AI** (existing content). Plus a new **Legal** tab with full terms/conditions. Add deep-link copy-to-clipboard for every panel+tab combo. Add Discord and Twitter/X pixel icons to top-right corner.

## Why This Approach

The Webflow archive has battle-tested, comprehensive content that's already organized well. Matching its 2-tab Dev Docs + Assets structure (plus AI and Legal) gives us the content depth participants need while keeping our existing CRT aesthetic.

## Key Decisions

- **Tab structure:** Dev Docs | Assets (Coming Soon) | AI | Legal
- **Dev Docs layout:** Accordion/collapsible sections matching Webflow's organization (Solana Mobile Resources, General Solana Resources, Guides/Videos, Tooling/SDKs, Open Source References)
- **Assets tab:** "Coming Soon" placeholder (pitch deck, fonts, logos, colors will come later)
- **Legal tab:** Full terms & conditions text (15 sections) pulled verbatim from Webflow
- **Judges panel:** Add judging criteria (evaluation process + 5 assessment areas)
- **Deep links:** URL params `?panel=toolbox&tab=dev-docs` — each tab has a copy-link button next to the close button
- **Social icons:** Discord (pixel SVG) and Twitter/X (pixel SVG) in top-right corner, linking to discord.gg/radiants and x.com (TBD handle)
- **SVGs provided by user:** Discord (26x24 viewBox) and Twitter (22x18 viewBox), both `fill="currentColor"`

## Content to Import

### Dev Docs Tab — Accordion Sections

1. **Solana Mobile Resources**
   - Helius Discount (50% off Developer plan)
   - Getting Started (docs.solanamobile.com)
   - Device Requirements (no device needed)
   - dApp Store Publishing (Android apps)

2. **General Solana Resources**
   - From the Docs: Intro, Concepts, Environment Setup, Hello World
   - Other Resources: Solana Bytes, Cookbook, Bootcamp
   - Dev Starter Pack: Web3.js, create-solana-dapp, Playground, Stack Exchange, Mobile Expo Template, Solana App Kit

3. **Guides, Videos, Self-Learning**
   - Quick Guides, SolAndy, Bootcamp videos
   - Courses: Soldev.app, Freecodecamp, RiseIn, Ideasoft (beginner+advanced), Rareskills

4. **Tooling, Ecosystem Docs, SDKs**
   - Core Docs, Playground, create-solana-dapp
   - Metaplex (NFTs), Solana Pay, Solana Mobile
   - Gaming: Unity, Turbo, GameShift, Godot, Phaser, Unreal (x2)
   - Game examples, bootcamp videos, randomness service

5. **Open Source References**
   - awesome-solana-oss repo

### Legal Tab — 15 Sections
1. Introduction through 15. Contact Information (full verbatim text)

### Judges Panel — Add Evaluation Criteria
- Demo video completion
- GitHub commits technical depth
- Mobile UX + mobile features usage
- Solana network interaction
- Presentation clarity and vision

## Open Questions

- Twitter/X link URL — which handle? (@RadiantsDAO?)
- Should accordion sections be open by default or all collapsed?
- Should external links open in new tab (likely yes)?

## Research Notes

- Webflow source: `/Users/rivermassey/Desktop/dev/_webflow-archive/Solana Mobile Hackathon 1/index.html`
- Current InfoWindow: `/Users/rivermassey/Desktop/dev/DNA/apps/monolith-hackathon/app/components/InfoWindow.tsx`
- Current OrbitalNav: `/Users/rivermassey/Desktop/dev/DNA/apps/monolith-hackathon/app/components/OrbitalNav.tsx`
- Current page: `/Users/rivermassey/Desktop/dev/DNA/apps/monolith-hackathon/app/page.tsx`
