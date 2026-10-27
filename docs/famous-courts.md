# Famous courts: visual references and integration

Seven new courts and the updated Cage use original procedural pixel drawings studied from the photographs below. Photos are references, not shipped textures. The camera, hoop and playable boundaries retain the game's shared 1v1 projection: these are recognisable adaptations, not surveyed replicas. Surface murals are simplified original motifs rather than copies of portraits or sponsor artwork. Paint schemes change over time; the selected references intentionally identify a particular appearance.

| Game ID / BGM folder | Place and visual study | Photo/reference |
|---|---|---|
| `rucker` | Greg Marius Court, Holcombe Rucker Park: tan/black renovation-era surface, elevated walkway, trees, bleachers, apartment blocks | [NBPA renovation gallery](https://www.nbpa.com/rucker), [court photo](https://thesiac.com/images/2023/6/27/24848.jpeg?preset=large.storyimage) |
| `brooklyn` (existing ID retained) | The Cage, West Fourth Street Courts, Manhattan: tall enclosure, blue/orange surface, Greenwich Village facades and trees | [court photos](https://www.courtsoftheworld.com/united-states/new-york-city-ny/the-cage/), [photo](https://imagescdn.homes.com/i2/S5zfdrLx-2DHORiZ8wpZ3LI6ZkZG1pkJ9Zn_g5q6DEQ/116/west-4th-street-courts-new-york-ny.jpg?p=1) |
| `venice` | Venice Beach: Pacific horizon, sand, palms, boardwalk, adjacent hoop; sunset palette | [court photos](https://www.courtsoftheworld.com/united-states/los-angeles-ca/venice-beach/), [photo study](https://coinventmediastorage.blob.core.windows.net/media-storage-container/gphoto_ChIJ-YGylLm6woARWAySgUQblFg_0.jpg) |
| `pigalle` | Duperre, Paris: enclosed gable walls, steps, blue numbered wall, pink/yellow/blue geometric floor | [Ville de Paris](https://www.paris.fr/pages/un-terrain-de-basket-style-et-atypique-a-pigalle-18886), [photo study](https://www.hotelcoronaparis.com/cache/img/06fc70613422bb55ac01c698914ae6e7ebe8dfe0-06fc70-crop-1080-crop.jpg) |
| `dyckman` | Monsignor Kett Playground, Nagle Ave / W 204th, not the similarly named W 207th court: green playing surface, trees, bleachers, scoreboard and adjoining brick facade | [tournament location](https://www.dyckmanbasketball.net/history), [2022 tournament photo](https://www.nicekicks.com/files/2022/07/nike-ny-vs-ny-basketball-tournament-2.jpg) |
| `tenement` | Fort Bonifacio Tenement, Taguig: courtyard enclosed by stacked open galleries, laundry, central tree and colourful painted surface | [court photos](https://www.courtsoftheworld.com/philippines/taguig/the-tenement/), [photo study](https://coinventmediastorage.blob.core.windows.net/media-storage-container/gphoto_ChIJ4zu2pNDPlzMRKf9-wtyt9E0_0.jpg) |
| `mosswood` | Mosswood Park, Oakland / Webster St: blue/yellow refurbished surface, mature canopy and low park building; 2025 renovation palette | [Warriors renovation gallery](https://www.nba.com/warriors/news/golden-state-community-foundation-kaiser-permanente-unveil-refurbished-courts-202508), [photo](https://cdn.nba.com/teams/uploads/sites/1610612744/2025/08/video-thumbnail-1756613253383.png) |
| `kalemegdan` | Belgrade fortress, red Crvena Zvezda court: high sloped masonry, stone terraces, low pavilion and trees | [court study](https://www.courtsoftheworld.com/blog/must-hoop-kalemegdan-in-belgrade-serbia/), [photo](https://www.courtsoftheworld.com/blog/content/uploads/2020/07/Kalemegan-Basketball-Red-Photo.png) |

Drop audio in `public/audio/bgm/courts/<id>/`. MP3/OGG/M4A/WAV files are indexed automatically on dev/build. New folders intentionally have no tracks yet. The Cage keeps `brooklyn` to preserve saves and existing audio. New courts reuse existing wardrobe pools; the location label comes from the court itself.

All 19 courts have six progressively stronger rivals, region-appropriate ambient events, online selection and independent progression. Both peers must use the updated `ballout-private-4` build.

## Character pass

Sleeved outerwear now uses a single elbow-to-shoulder-to-cuff mask instead of separately outlined capsules. The collar remains anchored; hem lag and small folds respond to acceleration, vertical motion and the gait, with reduced flexibility for puffers. The neck is shorter and eye/hair detail uses the same projection as the head during rotation. Feet/hands follow targets faster with more damping. Free jumps tuck the legs and land with a brief knee compression. Hit detection, input buffers, action durations, shot windows and scoring remain unchanged.

This remains procedural pixel art. The controlled review GIF is rendered through the real pose and cloth pipeline, not a handmade animation sheet. It shows run, spin, dunk and ankle break in four different garments. Brawlhalla-level animation polish is an art direction target, not a measured parity claim.

## Review and checks

- `node scripts/check-famous.cjs`: eight distinct paintings, populated scenes, BGM folders.
- `node scripts/check-progression-rebounds.cjs`: progression on all 19 courts, held dunks and reversal/braking.
- `node scripts/check-bis.cjs`: garment mirroring, outfit projection, finish poses, green celebration.
- `SPRITE_QA=1 node scripts/check-wardrobe.cjs`: eight cuts across 288 poses.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE=... node scripts/check-famous-browser.cjs`: all eight scenes, six rivals, soundtrack manifests, no browser exceptions. Then `python scripts/render-famous-preview.py` creates the contact sheet.
- `node scripts/capture-character-study.cjs && python scripts/render-character-study.py`: controlled character study.
- Gameplay, falls, turn rendering, ambient events, network protocol and Pages asset checks are run alongside the above. Actual WebRTC across different networks remains unverified.
