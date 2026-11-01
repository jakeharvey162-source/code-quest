import test from "node:test";
import assert from "node:assert/strict";
import { LAGOS_DISTRICT_ASSET, LAGOS_AVATAR_KEY, lagosAvatarChoices,
  normalizeLagosAvatar, lagosAvatarAsset } from "../src/lib/lagos-game-assets.mjs";

test("asset catalog references only versioned local GLBs, never giant remote originals", () => {
  assert.equal(LAGOS_DISTRICT_ASSET, "/models/codequest/districts/rookie-street-kit.glb");
  assert.equal(LAGOS_AVATAR_KEY, "lagos-avatar-choice");
  assert.equal(lagosAvatarChoices.length, 5);
  assert.equal(new Set(lagosAvatarChoices.map(v => v.id)).size, 5);
  for (const choice of lagosAvatarChoices) {
    assert.match(choice.model, /^\/models\/codequest\/avatars\/[a-z0-9-]+\.glb$/);
    assert.equal(choice.rigged, false);
  }
});
test("unknown or damaged avatar choice cannot inject a remote URL", () => {
  assert.equal(normalizeLagosAvatar("psx-4"), "psx-4");
  for (const invalid of [undefined, null, "", "/unsafe", "javascript:evil", {}, "other"]) {
    assert.equal(normalizeLagosAvatar(invalid), "psx-1");
    assert.equal(lagosAvatarAsset(invalid).id, "psx-1");
  }
});
