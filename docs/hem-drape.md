# Lower garment drape

The lower half of every top now bends toward the rendered trouser thighs. A weighted projection of the actual near/far knee positions into the torso frame drives the hem; this works in a held crouch as well as during motion. The upper 38% stays anchored. A raised knee pulls its front corner up, crouching adds soft compression above the waistband, and the existing spring adds bounded movement lag. Total lateral drift is capped at 2.4 art pixels. The rear tail retains at least 3.5 local art pixels of overlap over the trouser seat; rear corner lift is blocked so the top cannot slide forward and expose the back of the waistband. Oversized tees and hoodies move more than puffers.

Silhouette, hem seam, pocket, print and shading all use the same inverse deformation. The underlying pelvis remains covered. This is bounded visual deformation, not cloth collision simulation, and does not change movement, hitboxes or timing.

[Before / after animation](hem-drape-comparison.gif): top row reference, bottom row updated; tee, oversized tee, hoodie. Both rows use the same controlled run, jump and ankle-fall rig with actual Puppet springs/rendering, without moving the gameplay body differently. Capture with `node scripts/capture-hem-drape.cjs` and `python scripts/render-hem-drape.py`; `HEM_REFERENCE` can override the reference Git revision.

Checks: eight garment cuts in both facings, upper garment pixels pinned while lower garment follows trouser direction; existing 288 wardrobe poses, no texture-edge clipping, joint coverage, turns, falls, skill poses, in-browser spin capture, TypeScript and Pages build.
