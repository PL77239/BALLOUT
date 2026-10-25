# BGM

Background music, grouped by where it plays. Vite serves everything here as `/audio/bgm/<path>`.

```
bgm/
  menu/          menu, locker and shop
  stingers/      win / lose / point stingers, shared by every court
  courts/
    brooklyn/    THE CAGE        Bed-Stuy, Brooklyn
    queens/      THE BRIDGE      Queensbridge, Queens
    harlem/      THE PARK        Harlem (Rucker Park)
    philly/      BROAD & ERIE    North Philly
    fairmount/   THE WOODS       Fairmount Park, Philly
    detroit/     THE PLANT       Detroit
    chicago/     SOUTH SIDE      South Side, Chicago
    atl/         UNDER THE PASS  Atlanta
    la/          SOUTH CENTRAL   South Central, Los Angeles
```

The folder names match the court ids in `src/courts.ts`.

- Any `.mp3` / `.ogg` / `.m4a` / `.wav` works. File names are free-form.
- Each court plays its own folder in a random order, no repeats until every track has played. `menu/` plays on the menu screens (silent if empty).
- After adding, removing or replacing tracks run `npm run audio`. It measures every track's loudness (needs `ffmpeg` on the PATH) and writes `manifest.json`, which the game reads for the track list and a per-track gain that brings every track to -16 LUFS. The audio files themselves are never modified. Commit the manifest with the tracks.
- The game plays the music as if it came from a boombox on the fence: quiet, band-limited, a little saturated, behind the players, and it pans and dulls as the camera moves away from the boombox.
- In game: `M` mute, `[` and `]` (or `-` and `=`) volume. The setting is remembered.
