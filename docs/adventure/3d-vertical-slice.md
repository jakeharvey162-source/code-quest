# Lagos Rookie Street — first walkable 3D slice

This is an **experimental opt-in 3D scene**, not a finished game or photorealistic city. It is built on the real compiler-verified mission implementation in PR #45.

## Player interaction

- Choose **Explore in 3D (beta)** from the Lagos Adventure route; the original 2D scene is the default and always available.
- Click/tap the game, use **WASD** or **arrow keys** to move along the street; drag the scene horizontally to rotate the camera. On a phone use the visible direction buttons.
- Walk toward the glowing coding terminal, then press **E** or **Interact with coding station**. The mission's actual C# code editor receives focus. No fake simulated coding panel is created.
- The streetlamps light up after the **streetlights** mission is truly awarded by existing compiler-driven tests. The market sign lights up after **digital-shop**, and the network marker after **network**. Walking or clicking never awards XP.
- The existing local CC0 Tor robot GLB is loaded into the 3D scene. If the model cannot download, the scene keeps an obvious temporary marker.

## Scope and accessibility

Built with Three.js procedural geometry for a fast playable prototype: buildings, pavement, lamps, workstation, and avatar are intentionally simplified placeholders. No external 3D asset provider or paid generation was used. No asset license is invented.

The scene is lazy-loaded only when selected. Resolution is capped to DPR 1.5, the renderer stops drawing when the tab is hidden, and reduced motion disables walk animation. If WebGL cannot initialize or loses its context, CodeQuest returns to the 2D mission view. The 2D story and editor remain accessible without 3D controls; mission logic is shared.

Collision boundaries prevent leaving the street and entering building massing. This slice does **not** include interiors, a complete 3D character-customization system, physics, sophisticated NPC dialogs, or final 3D models. Do not advertise those as shipped.

## Tests

- `npm run check` for TypeScript, unit checks, and production bundle.
- `npm run test:browser -- tests/lagos-3d.spec.mjs` verifies the reversible 2D/3D mode or graceful WebGL fallback, with ordinary Chromium.
- `CODEQUEST_WEBGL_TEST=1 npm run test:browser -- tests/tor-model.spec.mjs tests/lagos-3d.spec.mjs` verifies real WebGL, walking to the console, focusing the C# code editor, and return to 2D.
- Existing real-C# mission and persistence tests remain required. Windows native export remains a separate CI gate.

For the next slice, add authored GLB buildings and characters with verified provenance and optimization budgets, improve physical collision and camera occlusion, add meaningful NPC dialogue tied to actual coding tasks, and profile performance on a low-spec device before expanding the world.
