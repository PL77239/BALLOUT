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

## Clothing seam fixes and streetwear expansion

The hip bridge now covers the gap between the trouser legs, the waistband stays at hip level, and the bare torso no longer extends below it. Fabric joint patches close the outer knee and elbow wedges when limbs bend. Sleeve starts and shoulder widths have been adjusted to remove the projecting shoulder blocks.

16 additional store items include gothic-cross tees/hoodies, star patches, stacked graphics, racing stripes, two numbered basketball jerseys, a cream puffer, flap-stitch/cross-patch/distressed denim, track sweats, varsity shorts, a fitted cap and cream high-tops. The designs use original graphics inspired by basketball and rap streetwear.

`topGraphic` additionally supports `cross`, `stars`, and `stacked`. Optional `bottomDetail` supports `stitched`, `crosses`, `ripped`, and `stripe`. Both remain item-level options, so equipping a plain item clears the details. Distressed denim uses dark backing and light fraying rather than accidental exposed joints.

![Streetwear expansion](streetwear-catalog.png)

Regression checks additionally inspect covered knees, elbows and the hip area for skin leakage. The showcase generator now produces four sheets.

## Warsaw Centrum court

Warsaw is now labeled CENTRUM, including the region's city label. The low street frontage leaves the Palace of Culture's stepped wings, clock and spire visible, with stylized Varso, Warsaw Spire and Zlota 44 silhouettes beside it. Keeps the existing overcast pixel palette, court surface, hoop, spectator positions and tram animation. The tram now runs below the skyline; the parked car is removed.

![Warsaw static scenery](warsaw-centrum.png)

This is the static scenery preview; the in-game crowd, moving tram and animated net are separate layers. `node scripts/render-warsaw.cjs` exports the three actual 427x240 static RGBA layers to `/tmp` for inspection.
