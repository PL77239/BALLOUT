# Stamina and streetwear pass

## Action economy

Special actions require their full cost before changing the action, combo, protection or velocity. A rejected trick cannot create a phantom combo or ankle-break attempt. A fresh trick costs 17; continuing a combo costs 23, 29, 35 and so on. After the combo window expires, the next trick costs 17 again. The old arbitrary clamp to five stamina after the third trick is removed.

Steal costs 4, block/jump 6, shove uses the tuning cost (13), and dunk uses its tuning cost (8). Sprint drains continuously. Regen pauses for 0.55s after spending and at least 0.4s after a rejected action. Repeated special-action inputs and holding sprint while moving prevent recovery; resting or ordinary walking restores it. After complete exhaustion, sprint/special actions unlock at 18 stamina. Walking and ordinary shots remain available, with the existing low-stamina movement/timing penalties.

The host enforces these same methods for local players, remote players and AI. Network build version is `ballout-private-7` so old rules cannot silently mix with new ones.

## Catalogue

`src/streetwear.ts` adds 203 stable item IDs under `sw.*`, without renaming existing items or changing currency/inventory saves:

| Slot | New items | Contents |
|---|---:|---|
| Tops | 42 | Awful Lot of Cough Syrup, Supreme, NBA, NFL, Palm Angels, Oakley, Amiri, Chrome Hearts hoodies/tees; team hoodies |
| Headwear | 35 | Lakers, Bulls, Knicks, Nets, Celtics, Warriors, Raiders, Steelers, Cowboys, Eagles caps/backcaps/beanies; collab/tech variants and three skimasks |
| Shoes | 33 | Air Jordan 1–12 in two palettes each, plus three palettes each for Dunk, AF1 and Supra |
| Bottoms | 45 | Khaki/cargo, woodland/desert/urban camo, stitched, distressed and streetwear variants; baggy/wide/stacked fits and eight camo palettes |
| Chains | 20 | Franco/Figaro, Cuban, rope, cross, iced, medallion, dog tag, star and tennis variants in silver/gold |
| Wrist | 8 | Square, chronograph, iced and digital watches in steel/gold |
| Face | 20 | Beard/mustache variants, wrap/aviator/rectangular glasses, shades, lit blunt and beard/blunt combination |

Designs are simplified original pixel interpretations: tiny motifs replace fine branding at game scale. The twelve Jordan variants have distinct panel patterns; they are not exact product renders. Face accessories share the existing FACE slot; the beard/blunt combination is a combined preset, not a new independent slot. The blunt is a prop with an ember and smoke, without adding mouth/lip graphics.

Chains render before the near arm, anchored to the front chest with a dark contrast backing. They remain hidden when the player turns fully away. Watch faces and skimasks have dedicated drawing code. Item previews clear optional shoe, watch, chain and badge fields when changing items.

Review: `docs/streetwear-outfits.png`, `docs/streetwear-shoes.png`.

Checks: `check-stamina.cjs`, `check-streetwear.cjs` (all 203 items, unique IDs, twelve distinct shoe patterns, preview reset), existing gameplay/progression/wardrobe/fall/face tests, build and Pages assets. The two-browser test pairs a fully accessorised host with a default-outfit guest and checks the transferred shoe/watch fields; it uses a substitute transport and does not validate Internet WebRTC connectivity.
