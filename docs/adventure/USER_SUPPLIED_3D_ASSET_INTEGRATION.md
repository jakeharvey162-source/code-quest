# Asset integration handoff — actual user-provided 3D files (2026-11-01)

## What was implemented in CodeQuest source

- `src/lib/lagos-game-assets.mjs` lists local district and avatar GLBs, with safe ID normalization and five extensible avatar slots.
- `src/components/Lagos3DScene.tsx` loads a curated real building kit **and an office desk** with GLTFLoader. When present, its real town meshes replace the temporary geometric building scenery, while the existing playable street, mission interaction, world-state lighting and accessible fallback continue.
- It loads and switches the five separate player meshes, grounds/scales them automatically, uses their authored clips where available and preserves the existing block avatar only if the file is missing. The five supplied PSX choices have **no armature/animations**; do not claim animated skeletons.
- `src/components/LagosAdventure.tsx` includes a character choice UI persisted in existing per-user progress drafts; new selections take effect in the 3D view.
- Added `tests/lagos-game-assets.test.mjs` and character-persistence coverage in `tests/lagos-3d.spec.mjs`.
- No native player-model source assets have been committed to this public repository. The optimized binaries are in the **CodeQuest_Optimized_3D_Asset_Kit.zip** artifact delivered to the owner, separate from code pending provenance review.

## What the curated asset package contains

| Destination relative to repository root | Source | Purpose | Size |
| --- | --- | --- | ---: |
| `public/models/codequest/districts/rookie-street-kit.glb` | low-poly-small-town.zip | Real textured shop/building/utility meshes curated and arranged around a walkable corridor | ~1.80 MB |
| `public/models/codequest/avatars/psx-choice-{1..5}.glb` | psx_characters_pack.glb | Five genuine visually distinct unrigged 3D character choices | ~0.64 MB |
| `public/models/codequest/props/coding-desk.glb` | low_poly_office_props_pack_-_game_ready.glb | Real office table replacing the original box-built desk | ~0.58 MB |
| `manifest.json` | local optimization | SHA-256 validation, asset provenance and source-byte manifest | metadata |

Total curated GLB payload: ~2.89 MiB, down from three significantly larger source files. The city textures are downsampled to max 1024 px; avatars to max 256 px. Optimization used the source geometries, not generated building-box approximations.

**Install after rights review:** unpack the ZIP into the checkout root with the `public/models/codequest/...` hierarchy intact, verify the SHA-256 manifest, then run `npm ci && npm run check` and the WebGL Playwright tests. Do not upload the archives themselves into a production runtime; only the curated per-role GLBs should be included.

## Provenance/permissions: a mandatory release gate

The supplied uploads contained no explicit license files or reliable owner proofs. We cannot assume that redistribution or commercial use is authorized simply because a GLB was uploaded here. Do not publish these extracted models on Vercel or commit them to public GitHub until the copyright holder's permission and distribution conditions for the exact files are confirmed. Some of the larger uploaded character files appear to reference known entertainment franchise characters and must not be added to a public character catalog absent rights.

The game loader and UI are reviewable regardless. A missing or unapproved pack must not be misrepresented as polished game content.

## Remaining supplied assets and recommended treatment

| Upload | Assessed content | Recommended action |
| --- | --- | --- |
| `cartoon-new-york-city-kitbash-kit-promo.zip` | ~143 MB GLB, 2.06M triangles, 70 embedded textures | Do **not** ship whole. Extract individual modular facade/vehicle props after license review and decimation |
| `street.glb` | ~15 MB, 241K triangles, scene bounds ~7.4 km | Don't layer the entire mismatched scene over the Rookie Street street; crop/rebase only compatible street assets |
| `low_poly_office_props_pack_-_game_ready.glb` | ~39 MB, 385K triangles | Curated and optimized actual desk now in the starter pack; additional monitors/props are optional only after performance review |
| `night_dance_club_lowpoly.glb` | ~3.3 MB, 22K triangles | Candidate side quest venue; don't load in the first mission automatically |
| `aetherion-nemesis-the-violet-seraphpurified.zip` | ~38 MB, 926K triangles, no rig | Future fantasy boss only if retopologized/rigged and legally cleared |
| `protector-nemesis-the-fallen-seraph.zip` | ~34 MB, 856K triangles, no rig | Similar; defer |
| `undead-wizard-the-hollow-magus.zip` | ~78 MB, 2.41M triangles, no rig | Heavy non-game-ready sculpt; only consider as a source for retopology |
| `wraith-apex-legends-t-pose-3d-model.zip` | recognizable third-party franchise character, 993K triangles | Exclude from any public commercial character list without authorization |
| `umamusume_mejiro_bright_race.glb` | recognizable third-party franchise character, 29K triangles, skinned but no clips | Exclude from any public commercial character list without authorization |

## Next assets the owner sends Astra

For each new asset record `source_filename, source_url, author, license, allowed_redistribution, mesh count, triangle count, texture count, file size, animations, skeleton, content_hash, intended_role`. Never place all models in the initial scene. Assign a **specific** role (district, character choice, NPC, coding station, shop prop, Tor cosmetic, quest object or boss), normalize scale/orientation, and load it only for that role. Keep characters under a separate, data-driven catalog so user choice persists with their learning progress.

For polished production, replace unrigged PSX choices with appropriately licensed animated GLBs, use at most one reasonably sized authored district per chapter, validate actual FPS/download/memory on mobile, and verify the 2D fallback and full C# mission progression before release. Do not equate a Vercel READY build with working gameplay.

## Merge discipline

PR #44 was reported passing CI; PR #45 and PR #46 have overlapping implementation and must be reconciled into one reviewed, exact-commit integration branch. Run all tests including the software-WebGL navigation test, the oversized-code editor regression, account separation, Tor, cloud/community checks, and Windows project export. Do not merge failing or unreviewed feature branches.
