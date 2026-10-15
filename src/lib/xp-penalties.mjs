// Limited, transparent consequences for failed coding challenges.
// Only distinct, actually-executed failing submissions can cost XP.
// The cap prevents losing all earned XP while learning through mistakes.
export const XP_PENALTY = 5;
export const MAX_PENALTIES_PER_CHALLENGE = 2;
const KEY = "xp-penalties";

export function mistakeKey(challengeId, source) {
  let hash = 2166136261;
  for (let i = 0; i < source.length; i++) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${challengeId}:${(hash >>> 0).toString(16)}`;
}
export function xpLost(steps) {
  const entries = steps?.[KEY];
  return Array.isArray(entries) ? new Set(entries).size * XP_PENALTY : 0;
}
export function applyChallengePenalty(progress, challengeId, source, currentXp) {
  const existing = progress.steps?.[KEY] || [];
  const used = existing.filter((item) => item.startsWith(challengeId + ":")).length;
  const identifier = mistakeKey(challengeId, source);
  if (
    challengeId === "practice-remix" ||
    (progress.steps?.["code-challenges"] || []).includes(challengeId) ||
    used >= MAX_PENALTIES_PER_CHALLENGE ||
    existing.includes(identifier) ||
    currentXp < XP_PENALTY
  ) return { progress, lost: 0 };
  return {
    lost: XP_PENALTY,
    progress: {
      ...progress,
      steps: { ...progress.steps, [KEY]: [...existing, identifier] },
    },
  };
}
