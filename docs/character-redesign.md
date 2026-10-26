# Character redesign

This visual-only iteration is isolated on `codex/character-redesign`, based on the merged court/gameplay/SFX improvements. Movement rules, shot timing, prices of existing items and saved item IDs are unchanged.

![Outfit examples](character-redesign.png)

![Same colors, different cuts](garment-cuts.png)

![Action poses](character-poses.png)

## Adding a recognizable item

`src/wardrobe.ts` owns the eight garment silhouettes in art pixels: hem length, waist/chest/shoulder widths, sleeves, cuffs and neckline. The renderer adds tank piping, jersey mesh-style trim, dropped oversize sleeves, a hoodie pocket/drawstrings, open checked flannel and padded jacket panels. Pants have separate fits and cargo pockets; footwear has different soles, toe panels, laces and boot tread.

`Loadout.topGraphic` is optional: `none`, `number`, `box`, `diagonal` or `stripe`. `jerseyNumber` accepts 0–99. Set these in the catalog item's `patch`, alongside `topColor` and `topTrim`. Build loadouts through `buildLoadout` so item-specific details reset when changing tops. Old equipment saves remain valid; no migration is required.

Three purchasable examples are included: COURT LOGO TEE, VARSITY 23 and DIAGONAL OVERSIZE. Existing items keep their IDs. The showcase uses existing accessories to demonstrate complete outfits; it does not add free inventory or unlock shop items.

## Validation and previews

- `npm run build`
- `node scripts/check-gameplay.cjs`
- `SPRITE_QA=1 node scripts/check-wardrobe.cjs`
- `python scripts/render-wardrobe.py` (Pillow; regenerates these three sheets)

The wardrobe check compares silhouettes in the same colors, renders 288 poses across actions and both facings, checks texture borders, and exercises top purchases and print reset. Sheets are actual CPU-rendered game sprites, enlarged without smoothing. Full browser playtesting remains necessary to assess motion and performance in a match.
