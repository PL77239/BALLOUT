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

- Prefer `.ogg` (with an `.mp3` fallback for Safari). Keep loops seamless and trimmed to the bar.
- Name files in play order inside each folder: `01_name.ogg`, `02_name.ogg`.
- Normalise to about -16 LUFS so music sits under the SFX.
- Music is not played by the game yet; these folders are where the files go.
