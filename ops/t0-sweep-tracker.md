# T0 Sweep Tracker

Status file for the orchestrated T0 execution loop.
Each item is worked one at a time: identify → fix → review → commit.

## Queue

Items ordered by risk (build-breaking first, then dead code, then behavior fixes).

- [x] 1. Remove `getAppMockStates` import from `Desktop.tsx` (⚠ potential build break) ✅ `44db50d3`
- [ ] 2. Delete Trash app (catalog, TrashApp.tsx, trash/registry.tsx)
- [ ] 3. Delete Web3ActionBar (core index, meta, schemas, registry)
- [ ] 4. Delete Web3Shell.tsx + remove from index.ts
- [ ] 5. Delete walletSlice.ts + useWalletStore hook + Desktop.tsx destructure
- [ ] 6. Delete AppWindowContent.tsx + remove from index.ts
- [ ] 7. Remove UtilityBar export from Taskbar.tsx and index.ts
- [ ] 8. Delete lib/constants.tsx
- [ ] 9. Delete mockData/radiants.ts + mockData/commissions.ts
- [ ] 10. Delete nft-metadata/, nfts.json, download-nft-data.js
- [ ] 11. Delete useModalBehavior.ts + remove from hooks/index.ts
- [ ] 12. Delete test/render.tsx
- [ ] 13. Delete ops/hex-to-oklch.mjs + scripts/find-non-oklch.sh
- [ ] 14. Delete trash/registry.tsx
- [ ] 15. Delete lib/colors.ts
- [ ] 16. Remove StartButton export from Taskbar.tsx
- [ ] 17. Remove hasAutoSized dead state from AppWindow.tsx
- [ ] 18. Remove console.log('Next') stub from RadiantsStudioApp.tsx
- [ ] 19. Remove console.log/console.error from RadRadioApp.tsx
- [ ] 20. Fix store/index.ts:32 migrate type error
- [ ] 21. Fix dual localStorage for radioFavorites
- [ ] 22. Migrate Desktop.tsx + StartMenu.tsx to useIsMobile hook
- [ ] 23. Add data-start-button attribute to Taskbar Start button
- [ ] 24. Fix StartMenu noopener,noreferrer

## Completed

(items move here after commit)
