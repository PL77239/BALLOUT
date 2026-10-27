# SFX

Sound effects: dribble, shoe squeak, swish / rim / backboard, steal, shove, dunk, crowd, UI.

- Put files directly in this folder. Vite serves them as `/audio/sfx/<name>`.
- Prefer `.ogg` (with an `.mp3` fallback for Safari). Keep them short and trimmed with no leading silence, so they land on the frame of the event.
- Naming: `<group>_<name>[_<variant>].ogg`, lowercase, e.g. `ball_dribble_01.ogg`, `hoop_swish.ogg`, `move_steal.ogg`, `ui_confirm.ogg`.
- Provide two to four variants for sounds that repeat a lot (dribble, steps) so they do not sound mechanical.
