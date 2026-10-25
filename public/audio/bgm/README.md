# BGM

Background music: menu, locker, per-court match loops, win / lose stingers.

- Put files directly in this folder. Vite serves them as `/audio/bgm/<name>`.
- Prefer `.ogg` (with an `.mp3` fallback for Safari). Keep loops seamless and trimmed to the bar.
- Naming: `<scene>_<name>.ogg`, lowercase, e.g. `menu_main.ogg`, `court_harlem.ogg`, `stinger_win.ogg`.
- Normalise to about -16 LUFS so music sits under the SFX.
