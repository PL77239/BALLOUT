# BALL OUT

2D side-view hood basketball with arcade, mechanical gameplay. Built with Phaser 3, TypeScript and Vite.

- 1v1 to 7/11/15/21 against a CPU (3 levels) or a second player (2P needs a second gamepad)
- Half-court street rules: arc = 2, inside = 1, dunk = 2, check the ball (clear the arc) after a change of possession, make-it-take-it, no fouls
- Three courts: Bed-Stuy cage (Brooklyn, night), South Side (Chicago, golden hour, L train), the Park (Harlem, dusk, crowd)
- Procedural low-poly puppets with layered apparel (cap/beanie/headband/durag, tank/tee/hoodie, shorts/long shorts/sweats, shoes, socks, chain, wristbands). Four presets; add more in `src/loadout.ts`
- Keyboard and gamepad (DualShock 4 via the standard Gamepad API mapping)

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
- `src/loadout.ts` defines apparel presets; `src/puppet.ts` draws them
- `src/courts.ts` bakes each court backdrop procedurally

## Dev scripts

`scripts/sim.mjs` runs a headless AI-vs-AI match and prints event counts, `scripts/gallery.mjs` renders pose stills, `scripts/shot.mjs` takes screenshots. They use the system Chrome through `playwright-core`. Start `npm run dev` first. Debug URL: `/?auto=1&court=chicago` (CPU vs CPU), `?auto=2` (1P).
