# T0 Sweep Tracker

Status file for the orchestrated T0 execution loop.
Each item is worked one at a time: identify → fix → review → commit.

## Queue

Items ordered by risk (build-breaking first, then dead code, then behavior fixes).

- [x] 1. Remove `getAppMockStates` import from `Desktop.tsx` (⚠ potential build break) ✅ `44db50d3`
- [x] 2. Delete Trash app (catalog, TrashApp.tsx, trash/registry.tsx) ✅ `8195bed2`
- [x] 3. Delete Web3ActionBar (core index, meta, schemas, registry) ✅ `7956456c`
- [x] 4. Delete Web3Shell.tsx + remove from index.ts ✅ `797f4e91`
- [x] 5. Delete walletSlice.ts + useWalletStore hook + Desktop.tsx destructure ✅ `7d8bfff8`
- [x] 6. Delete AppWindowContent.tsx + remove from index.ts ✅ `e127e8e2`
- [x] 7. Remove UtilityBar export from Taskbar.tsx and index.ts ✅ `8254ae93`
- [x] 8. Delete lib/constants.tsx ✅ `05284973`
- [x] 9. Delete mockData/radiants.ts + mockData/commissions.ts ✅ `4923e3b4`
- [x] 10. Delete nft-metadata/, nfts.json, download-nft-data.js ✅ `4a3d7bcd`
- [x] 11. Delete useModalBehavior.ts + remove from hooks/index.ts ✅ `7a233dc1`
- [x] 12. Delete test/render.tsx ✅ `8c478e57`
- [x] 13. Delete ops/hex-to-oklch.mjs + scripts/find-non-oklch.sh ✅ `b5662113`
- [x] 14. Delete trash/registry.tsx ✅ (already deleted in item 2 `8195bed2`)
- [x] 15. Delete lib/colors.ts ✅ `cefc7ecb`
- [x] 16. Remove StartButton export from Taskbar.tsx ✅ `b3b055f2`
- [x] 17. Remove hasAutoSized dead state from AppWindow.tsx ✅ `44c8855f`
- [x] 18. Remove console.log('Next') stub from RadiantsStudioApp.tsx ✅ `6d5c9463`
- [x] 19. Remove console.log/console.error from RadRadioApp.tsx ✅ `b2143ed7`
- [x] 20. Fix store/index.ts:32 migrate type error ✅ `d45997e3`
- [x] 21. Fix dual localStorage for radioFavorites ✅ `c0f6bdc9`
- [x] 22. Migrate Desktop.tsx + StartMenu.tsx to useIsMobile hook ✅ `e3a6d9ff`
- [x] 23. Add data-start-button attribute to Taskbar Start button ✅ `3770421c`
- [x] 24. Fix StartMenu noopener,noreferrer ✅ `d0481094`

## Completed

(items move here after commit)
