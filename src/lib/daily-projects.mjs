import { equipmentMission } from "./equipment-practice.mjs";
export function validProjectDay(day) {
  return (
    typeof day === "string" &&
    /^\d{4}-\d\d-\d\d$/.test(day) &&
    !Number.isNaN(Date.parse(day)) &&
    new Date(day + "T00:00:00Z").toISOString().slice(0, 10) === day
  );
}
export function readProjectSpec(raw) {
  try {
    const s = JSON.parse(raw || "null");
    return s &&
      validProjectDay(s.day) &&
      Number.isSafeInteger(s.round) &&
      s.round >= 0 &&
      s.round < 1e9
      ? { day: s.day, round: s.round }
      : null;
  } catch {
    return null;
  }
}
export function generatedProject(day, round = 0) {
  if (
    !validProjectDay(day) ||
    !Number.isSafeInteger(round) ||
    round < 0 ||
    round >= 1e9
  )
    throw Error("Invalid project date or round.");
  let seed = 2166136261;
  for (const c of day + ":" + round)
    seed = Math.imul(seed ^ c.charCodeAt(0), 16777619) >>> 0;
  const prefix =
    String.fromCharCode(
      65 + (seed % 26),
      65 + ((seed >>> 5) % 26),
      65 + ((seed >>> 10) % 26),
    ) + "-";
  const mission = equipmentMission(seed % 3, {
    seed,
    maxDays: 2 + (seed % 27),
    prefix,
    code: "L" + String((seed % 900) + 100),
    other: "C" + String(((seed >>> 8) % 900) + 100),
  });
  return {
    ...mission,
    id: "generated-project",
    category: "Renewable project repair",
    title: `Campus recovery · ${day} · project ${round + 1}`,
    brief:
      "Repair the supplied code against this project’s brief. Work through class repair, record loading, capture validation and statistics; explain and retest each change. " +
      mission.brief.replace(
        "Original variation.",
        "Generated variation of the equipment-booking format.",
      ),
    spec: { day, round },
    seed,
  };
}
const slotKeys = [
  "repair-code-generated-project",
  "repair-input-generated-project",
  "repair-complete-generated-project",
  "repair-generated-spec",
];
export function openGeneratedProject(drafts, spec) {
  generatedProject(spec.day, spec.round);
  const next = { ...drafts };
  if (next["repair-generated-spec"] === JSON.stringify(spec)) {
    next["repair-selected"] = "generated-project";
    return next;
  }
  if (next["previous-repair-generated-spec"] === JSON.stringify(spec))
    return restoreGeneratedProject(next);
  for (const key of slotKeys) {
    if (typeof next[key] === "string") next["previous-" + key] = next[key];
    else delete next["previous-" + key];
    delete next[key];
  }
  next["repair-generated-spec"] = JSON.stringify(spec);
  next["repair-selected"] = "generated-project";
  return next;
}
export function restoreGeneratedProject(drafts) {
  if (!readProjectSpec(drafts["previous-repair-generated-spec"])) return drafts;
  const next = { ...drafts };
  for (const key of slotKeys) {
    const current = next[key],
      previous = next["previous-" + key];
    if (previous === undefined) delete next[key];
    else next[key] = previous;
    if (current === undefined) delete next["previous-" + key];
    else next["previous-" + key] = current;
  }
  next["repair-selected"] = "generated-project";
  return next;
}
