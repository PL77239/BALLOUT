# Reset, ambient and dunk polish

MYPLAYER's last selectable row, **RESET ATTRIBUTES // REFUND POINTS**, returns all spent attribute points and sets the six attributes to 60. It preserves XP, level, rank/RP, performance milestones, equipped badges, clothes and cash. Badge tiers immediately reflect the reset attributes. Repeating a reset cannot duplicate points. Navigation works with the existing keyboard and pad menu controls.

## Dunk controls

Existing single directions in the air still select two hand, reverse, windmill and one hand. Two extra sequences work after takeoff and before the final 0.03 seconds before impact:

| Airborne sequence | Finish |
|---|---|
| Up → down | Double clutch |
| Back → up → forward | 360 slam |

Back/forward are relative to the player's facing; up/down are court depth. Each direction change must be at least 0.045 simulation seconds apart. A completed combo locks the finish. Neutral input does not erase it; holding a diagonal never completes a rotation. This changes animation only, without a second stamina cost, timing reroll or guaranteed make. Keyboard WASD/arrows and the left stick feed the same system. Pause includes a reminder.

Each of six dunk styles has its own rim impact: power shockwaves, a purple reverse pulse, windmill swirl, pale one-hand sparks, paired clutch rings and a three-ring 360 burst. Impacts occur only after successful, unblocked dunk contact. Host forwards the chosen effect to the guest; all peers need `ballout-private-8`.

Floating texts reserve their actual rendered dimensions and their full upward travel corridor. They stay inside the viewport in screen space; later messages take another free lane or wait for space. Guest messages preserve host text colour and size. The short queue is capped to avoid unbounded spam.

## City life

Standing spectators have wider random horizontal/depth offsets and different facing angles. They change between relaxed poses, conversation/drink/phone gestures, folded arms and short pacing, with independent timers. Bench sitters remain attached to their seats. Gestures yield to score reactions. These are cosmetic, independent of the deterministic gameplay simulation.

Skaters coast with both feet planted on the deck, a low balanced stance and steady arms. The deck now has upturned tips, visible wheels and corrected alignment with the feet. Cycling keeps its own pedal animation.

Pigalle laundry is now confined to x=12–78 on the left facade instead of crossing the sloped edge into open space. Added recessed windows, ledges, planters, downpipes, an entrance and a street plaque preserve its existing colour scheme.

## Validation and previews

Logic checks cover respec refunds, repeat safety, progress preservation, save reload, both-facing dunk sequences, deadzone, lock and unchanged costs, six distinct particle effects and expiry, and planted skateboard feet. Chromium checks the actual reset menu and reload, keyboard sequences, separate notification corridors/queue, Pigalle and the visible Venice skater. Two-browser tests use substitute transport to validate the shared 360 rim effect; they do not certify real Internet WebRTC.

- [MYPLAYER reset](myplayer-reset.png)
- [Dunk texts and impact](dunk-impact.png)
- [Pigalle ambient](pigalle-ambient.png)
- [Skater coasting](skate-coast.png)
