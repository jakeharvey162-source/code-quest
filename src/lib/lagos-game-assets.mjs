// Asset catalog is intentionally independent of React and Three.js.
// Supplied GLBs are installed separately after provenance/license review.
export const LAGOS_DISTRICT_ASSET = "/models/codequest/districts/rookie-street-kit.glb";
export const LAGOS_AVATAR_KEY = "lagos-avatar-choice";

/**
 * Provisional character slots. Names are CodeQuest labels, not model IP claims.
 * None of these third-party models should be released until licensing is verified.
 * Future uploads can be added here without changing the game loop.
 */
export const lagosAvatarChoices = Object.freeze([
  { id: "psx-1", label: "Explorer 01", model: "/models/codequest/avatars/psx-choice-1.glb", rigged: false },
  { id: "psx-2", label: "Explorer 02", model: "/models/codequest/avatars/psx-choice-2.glb", rigged: false },
  { id: "psx-3", label: "Explorer 03", model: "/models/codequest/avatars/psx-choice-3.glb", rigged: false },
  { id: "psx-4", label: "Explorer 04", model: "/models/codequest/avatars/psx-choice-4.glb", rigged: false },
  { id: "psx-5", label: "Explorer 05", model: "/models/codequest/avatars/psx-choice-5.glb", rigged: false },
]);

export const normalizeLagosAvatar = (value) =>
  lagosAvatarChoices.some(choice => choice.id === value)
    ? value
    : lagosAvatarChoices[0].id;

export const lagosAvatarAsset = (value) =>
  lagosAvatarChoices.find(choice => choice.id === normalizeLagosAvatar(value));
