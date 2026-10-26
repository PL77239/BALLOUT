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

## Play in the browser (GitHub Pages)

No rebuild from scratch: this is a normal Vite app. `npm run build` emits static HTML, JS and assets in `dist/`, which GitHub Pages can host as-is.

After the workflow in `.github/workflows/pages.yml` runs on `main`, the game is at:

**https://pl77239.github.io/BALLOUT/**

One-time repo setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**. The workflow builds Vite with `VITE_BASE=/BALLOUT/`, verifies the compiled entry point, and deploys only `dist/`. It runs on pushes to `main` and `cursor/pixel-art-overhaul-24cd`; pull requests build and validate without deploying. Do not select the source-code branch as a static folder: browsers cannot execute `/src/main.ts` or resolve the unbundled Phaser import. If the `github-pages` environment limits deployment branches, allow the branch you actually deploy.

A successful legacy “Build with Jekyll” run does not prove the Vite game was built. The intended run has **Build for the repository subdirectory**, **Check the published entry point and assets**, and **Deploy the compiled game** steps. When viewing the page's HTML, the module must point to `/BALLOUT/assets/*.js`, not `/src/main.ts`. Audio requires one click/keypress because of browser autoplay rules.

Local preview of the Pages build:

```bash
VITE_BASE=/BALLOUT/ npm run build && npm run preview
```

(`VITE_BASE` must match the repository name for project pages.)

## Run

```bash
npm install
npm run dev        # http://localhost:47731
npm run build      # typecheck + production build (local root at /)
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
- **Music**: each court plays the tracks in its `public/audio/bgm/courts/<court>` folder in a shuffled order, levelled to the same loudness by `npm run audio` and played as if from a boombox on the fence (band-limited, behind the players, panning with the camera). `M` mutes, `[` / `]` change the volume
- `public/audio/bgm` (one playlist folder per court under `courts/`, plus `menu/` and `stingers/`) and `public/audio/sfx` are where music and sound effects go (served as `/audio/bgm/...` and `/audio/sfx/...`)

## Dev scripts

They use the system Chrome through `playwright-core`. Start `npm run dev` first.

- `scripts/sim.mjs <court> <target> <level>` headless AI-vs-AI match with event counts
- `scripts/flow.mjs` clicks through menu, match, pause and back
- `scripts/shot.mjs '<query>' out.png waitMs [key:ms ...]` screenshots (`CLIP`, `DSF`, `EVAL`, `POST` env)
- `scripts/sheet.mjs <court> <scene,...>` animation strips of player one
- `scripts/determinism.mjs [court] [seed]` plays one seeded CPU match at 30, 60, 144 fps and with jittery frames, and checks that the results are identical
- `scripts/perf.mjs <court>` per-frame CPU cost of the simulation and rendering

Debug URLs: `/?auto=chicago&mode=sim&seed=1234` (CPU vs CPU, optional seed), `/?auto=harlem&mode=1p`, `/?lab=1&pose=run` (sprite lab; `top=tank,tee,...` previews garment kinds), `/?lab=1&court=fairmount` (court viewer), `/?lab=1&fit=16` (sprite lab showing six fits starting at that index of `FITS`).

### Court polish and gameplay balance

- Background car traffic removed; court scenery, fog and rail traffic remain.
- Player silhouettes use clearer shoulders/neck, wider torsos, separated legs and corrected clothing layers. Jerseys are sleeveless.
- Dunks require a takeoff within 190 world units of the basket, a central lane position and 10 stamina. There is no velocity threshold. An active defender in the takeoff lane must be passed or moved out of the path; a grounded/staggered defender is beaten. DUNK READY appears before takeoff when eligible. Press L/V or Triangle to start; the timing meter appears during the dunk.
- Ankle breakers are probabilistic (7–48% per eligible attempt), based on defensive commitment, movement, fatigue and skill. Attempts have a 0.85-second cooldown, and fallen defenders retain immunity. Quick sprint direction changes can also trigger an attempt.
- All three AI levels are slightly stronger offensively. Defensive containment has short, difficulty-dependent lapses and applies less movement slowdown.
- Recorded CC0 court Foley replaces oscillator effects: three bounce variations, two rim impacts, two net sounds and two shoe chirps. Audio starts after a keyboard or pointer gesture. Sources and edit points are in public/audio/sfx/CREDITS.md; no NBA Street audio is sampled.

Run `node scripts/check-gameplay.cjs` for headless dunk, ankle-breaker and AI containment regression checks. `npm run build` also checks TypeScript before bundling.


### Rival ladder, rebounds and movement

Each of the 11 courts has six named rivals. Beat the currently unlocked rival to unlock the next; previously beaten rivals remain replayable. Progress is saved per court without resetting money or clothing in old saves. Rookie / Hooper / Legend controls global AI difficulty, and each successive rival raises stats and decision quality within it. Local PvP uses the same player stats for both players.

For a missed shot, move under the ball, **jump with Space (pad: X)**, then **press J (pad: Square) in the air** to open a short catch window. Position and timing decide the rebound; there is no guaranteed catch. Ground balls still use proximity pickup. Defensive rebounds still require clearing the arc. The controls strip switches to rebound instructions while the ball is in flight or loose.

Movement keeps the existing top speeds, with higher acceleration/braking, quicker reversals, a 90 ms action buffer and a slightly faster simulation pace. The AI now receives single-tap jump inputs correctly and chooses a timed contest once per shot rather than repeatedly rolling for an early jump.

Chiraq and Warsaw now have independent music folders: `public/audio/bgm/courts/chiraq/` and `public/audio/bgm/courts/warsaw/`. Add MP3/OGG/M4A/WAV files there. Pages builds scan folders automatically (`--scan-only`, no FFmpeg needed). Run `npm run audio` locally with FFmpeg for per-track loudness measurement; newly scanned tracks otherwise use unity gain.

Checks: `node scripts/check-progression-rebounds.cjs`, `node scripts/check-gameplay.cjs`, `node scripts/check-wardrobe.cjs`, `node scripts/check-sfx.mjs`, and `npm run build`.

### Neighbourhood cameos
Each court has occasional background cameos (BMX, courier, skater, dancer or park dog walker), with locally themed outfits. The first starts after 18–38 seconds; subsequent appearances wait 35–80 seconds after the previous exit. They remain behind the court and have no collision, gameplay effects or extra audio.

### Playing with a friend
`2 PLAYERS` is local versus: keyboard + one controller, or two controllers. It does not connect separate browser sessions. For a quick remote playtest, a Windows host can run the game and share it through Parsec, with the guest using a controller. GitHub Pages serves the client only; native browser-to-browser multiplayer would require additional networking and session handling. The current match supports two players, so a third friend would take turns or spectate.
