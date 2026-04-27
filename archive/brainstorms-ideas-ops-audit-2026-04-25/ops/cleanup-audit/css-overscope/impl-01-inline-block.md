# impl-01: inline-block/block collision cleanup

Dead-class cleanup. Two spans in typography-playground listed both `inline-block` and `block`. The task brief guessed `block` won; in this repo's Tailwind v4 build the opposite is true — `.inline-block` is emitted after `.block` in the generated stylesheet (verified in `.next/static/chunks/290aa50b71909b47.css`: `.block{` at pos 45524, `.inline-block{` at pos 45654), so `inline-block` wins the cascade regardless of the order the classes appear in `className`. That means the CURRENT shipping visual is `inline-block` and the `block` class was the dead one at both sites.

## Files changed

- `apps/rad-os/components/apps/typography-playground/UsageGuide.tsx:53`
- `apps/rad-os/components/apps/typography-playground/TypeManual.tsx:254`

## UsageGuide.tsx (DO / DON'T label inside `flex items-center gap-2` row)

- Before: `pixel-rounded-sm inline-block shrink-0 block font-joystix ...`
- After:  `pixel-rounded-sm inline-block shrink-0 font-joystix ...`
- Kept `inline-block` (the one actually rendering). Flex children ignore display mode for layout, so no visual change.

## TypeManual.tsx ("Clamp" badge inline inside a paragraph)

- Before: `pixel-rounded-sm inline-block mr-1 align-middle block font-heading ...`
- After:  `pixel-rounded-sm inline-block mr-1 align-middle font-heading ...`
- Kept `inline-block`. Element uses `align-middle` + `mr-1` and sits inline next to raw text; also matches the shipping visual.

No other files touched. No lint or commit run.
