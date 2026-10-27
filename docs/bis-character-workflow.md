# BALLOUT bis: character art workflow

The character is a layered, articulated pixel puppet. Garment silhouettes and
sleeves remain attached to the same rig, preserving facing, collision and all
existing equipment. The bis profile uses a larger head, broader shirt and
strong silhouette, closer to the reference at the existing camera scale.

## Garment textures

`src/garment-textures.json` contains 7x7 transparent pixel masks. `.` is clear,
`1` takes the item's trim colour and `2` is a brighter highlight. Each texture
is projected in the garment's own local coordinates and follows the body or leg.
Prefix an ID with `tile:` to repeat the 7x7 motif across the top or upper-leg fabric. Items can opt in with `topTexture: 'crest'` or `bottomTexture: 'stitch'` in
their patch in `src/loadout.ts`. Existing items and saves need no texture.
Switching a shop preview clears the old texture, preventing prints from leaking.

To draw a new motif in any pixel editor, export a **7x7 transparent PNG**.
Opaque coloured/dark pixels use the item's trim; opaque near-white pixels are
highlights. Run `python scripts/import-garment-texture.py motif.png motif_id`
(requires Python and Pillow), then reference that ID in an item patch and rebuild.
A single image is a motif or a repeatable fabric tile, not a complete interchangeable animated shirt: the
rig supplies the body silhouette, sleeve coverage and per-pose projection.

## Animation variants

Close-range shots display a layup; holding up selects a second layup. Dunks use
neutral, up or down for two-hand, reverse and one-hand poses; a two-move combo
still unlocks the windmill. These are visual variants of existing actions with
the same scoring, timings and hit detection. Three-move strings get their own
labels and follow-through poses. A perfect release only gets the green burst
and short celebration when the shot actually scores.

Alley-oops and 3v3 need a teammate, passing and synchronized team logic, which
this one-on-one build does not have. They are not represented as functioning
moves in this branch.

## Prior art (not imported)

- [Universal LPC Spritesheet Character Generator](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator): modular layered characters and sprite sheets. Individual art has different licences and credits; inspect them before importing any assets. Its fixed view and motions would need custom basketball frames.
- [PixelWright](https://github.com/R3mmurd/PixelWright): pixel editor with layers, sprite sheets and bone posing, a useful possible asset-authoring workflow.

No graphics or source from those projects are included in this branch. The
existing court is still a 1v1 side view and uses original procedural game art.
