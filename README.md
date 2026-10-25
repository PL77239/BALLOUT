# BALL OUT

2D side-view hood basketball with arcade, mechanical gameplay. Built with Phaser 3, TypeScript and Vite.

- 1v1 to 7/11/15/21 against a CPU (3 levels) or a second player (2P needs a second gamepad)
- Half-court street rules: arc = 2, inside = 1, dunk = 2, check the ball (clear the arc) after a change of possession, make-it-take-it, no fouls
- **Pixel-art presentation**: a 427x240 canvas scaled by whole pixels. All art (courts, characters, ball, HUD font) is rasterised on the CPU with ordered dithering and hue-shifted palettes; there is no vector drawing or system font in the game view
- **Nine courts, seven of them at night** with street-lamp lighting, flickering lamps and animated scenery: Bed-Stuy cage (Brooklyn), Queensbridge, North Philly (rain), Fairmount Park ("The Woods": a lamp-lit court in the forest, fireflies, moths, fog and falling leaves), Detroit plant (snow, fire barrel), Atlanta overpass, South Central LA (helicopter searchlight), South Side Chicago (golden hour, L train) and the Park in Harlem (dusk). Each has a background crowd that reacts to buckets
- **Living characters**: a software skeleton renderer (IK limbs, cel shading, outlines) with spring-damper secondary motion, trailing hair, chain and shirt hem, stride-locked running, lean, breathing, fatigue, dribble and defensive stances, reactive guard, shot gather and release, falls, dunks, spins and celebrations
- **Locker and shop**: earn cash in 1P matches (buckets, style plays, wins), buy cosmetic items per slot or whole regional fits, try them on before buying and swap what you wear in the locker. Progress is saved in `localStorage`
- **Streetwear by region**: oversized white tees, plaid flannels, puffers, stitched jeans, creased khakis and long khaki shorts, jorts, work boots, classic trainers, slides, stripe tube socks, fitted and full caps, bandanas, mustaches and grillz, plus cuban, rope, cross, rosary and iced chains and watches. Items are tagged to the regions where they are part of the look (for example long khakis, rosary and tall stripe socks in LA; puffers, boots and full caps in Detroit; jorts and grillz in Atlanta) and show up in regional fits and in that region's rivals. Names are generic, no brand logos
- **Rivals** get a random look drawn from the region of the court you play on
- Keyboard and gamepad (DualShock 4 via the standard Gamepad API mapping)
- **Match camera**: the match frames a slightly zoomed window of the court (384x216 art pixels) and glides left and right with the play, always in whole art pixels. A controls strip for keyboard and gamepad stays on the bottom edge and switches between offense and defense actions with possession
- **Fixed-step simulation**: gameplay runs at a fixed 240 Hz independent of the display refresh rate, with buffered button presses (120 ms), a seeded RNG and a compact input log (`GameScene.replay()`), so a match is reproducible from its seed and inputs. This is the groundwork for ranked play
- Not implemented yet, on purpose: in-game pickups (items that appear during a match). The data model and scene hooks are kept simple so they can be added later

## Run

```bash
npm install
npm run dev        # http://localhost:47731
npm run build      # typecheck + production build
```

## Controls

| Action | Keyboard | DS4 |
|---|---|---|
| Move (left/right + depth lane) | WASD / arrows | Left stick / D-pad |
| Sprint | Shift | R1 / R2 |
| Shoot (hold, release in the green; tap = pump fake) / jump + block | Space or Z | Cross |
| Crossover / steal swipe | J or X | Square |
| Spin move | K or C | Circle |
| Dunk (in range) or behind-the-back | L or V | Triangle |
| Dirty shove (can strip the ball, ruins a shot) | E or Q | L1 |
| Hand-check (slows the ball handler) | R | L2 |
| Pause | Esc or P | Options |

## Mechanics worth mastering

- **Shot meter**: fixed speed, fixed sweet spot. The green window shrinks with distance, defender pressure, fatigue, fadeaways and shoves, and grows near the rim and while on fire. Release early or late and the ball physically misses short or long, so rim rattles are real.
- **Ankle breakers**: a dribble move bites when the defender is moving the wrong way or has committed to a swipe, shove or jump. Chain different moves within 0.8s to build a combo; at x4 it works on anyone.
- **Heat**: combos, ankle breakers, blocks, steals, makes and dunks fill it. Full heat sets you on fire until the other player scores.
- **Fade**: hold away from the hoop while shooting for a step-back with less contest and a smaller window.

## Tuning and extending

- `src/tuning.ts` holds every gameplay number (speeds, meter, steal odds, AI levels, rules)
- `src/loadout.ts` is the item catalog: every item is a patch over a `Loadout`, grouped by slot (hair, headwear, face, top, bottom, shoes, socks, chain, wrist) plus skin tone. Regions define team colours, preferred garments and nicknames, which drive both the shop fits and the random rival generator
- `src/puppet.ts` draws characters; `src/anim.ts` turns game state into a target pose each frame
- `src/pixel.ts` and `src/font.ts` are the pixel toolkit (framebuffer, dithering, shading, bitmap font)
- `src/courtkit.ts` has the scenery painters and the light model; `src/art_*.ts` compose each court and `src/courts.ts` bakes them into three layers plus live effects. To add a court, add an entry to `ART` in `src/court_art.ts` and to `COURTS` in `src/courts.ts`
- `src/save.ts` persists cash, owned items and equipment
- `src/viewport.ts` and `src/legend.ts` hold the match viewport size, screen-fixed HUD helpers and the controls strip
- `public/audio/bgm` and `public/audio/sfx` are where music and sound effects go (served as `/audio/bgm/...` and `/audio/sfx/...`)

## Dev scripts

They use the system Chrome through `playwright-core`. Start `npm run dev` first.

- `scripts/sim.mjs <court> <target> <level>` headless AI-vs-AI match with event counts
- `scripts/flow.mjs` clicks through menu, match, pause and back
- `scripts/shot.mjs '<query>' out.png waitMs [key:ms ...]` screenshots (`CLIP`, `DSF`, `EVAL`, `POST` env)
- `scripts/sheet.mjs <court> <scene,...>` animation strips of player one
- `scripts/determinism.mjs [court] [seed]` plays one seeded CPU match at 30, 60, 144 fps and with jittery frames, and checks that the results are identical
- `scripts/perf.mjs <court>` per-frame CPU cost of the simulation and rendering

Debug URLs: `/?auto=chicago&mode=sim&seed=1234` (CPU vs CPU, optional seed), `/?auto=harlem&mode=1p`, `/?lab=1&pose=run` (sprite lab; `top=tank,tee,...` previews garment kinds), `/?lab=1&court=fairmount` (court viewer), `/?lab=1&fit=16` (sprite lab showing six fits starting at that index of `FITS`).
