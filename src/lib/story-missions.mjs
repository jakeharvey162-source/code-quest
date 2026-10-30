/**
 * Story Mode is a view of existing, verifiable lesson progress.
 * No extra XP, fake wins, unlock locks, user data or migrations are created.
 */
export const rookieMissions = Object.freeze([
  Object.freeze({
    id: "rookie-power",
    lessonId: "variables",
    title: "Power the street",
    objective: "Help Rookie Street calculate a fair market bill.",
    landmark: "Market lights",
    story: "Build a working total calculator using real C# tests.",
  }),
  Object.freeze({
    id: "rookie-names",
    lessonId: "strings",
    title: "Open the name studio",
    objective: "Create the welcome message for a new local shop.",
    landmark: "Welcome sign",
    story: "Make a reliable greeting with strings and real C# tests.",
  }),
  Object.freeze({
    id: "rookie-crossing",
    lessonId: "conditions",
    title: "Fix the crossing",
    objective: "Use decisions to help a crossing respond to different inputs.",
    landmark: "Crossing signal",
    story: "Write the condition logic and verify it with C# tests.",
  }),
]);

export function rookieStoryState(progress) {
  const completed = new Set(progress?.completed ?? []);
  const steps = progress?.steps ?? {};
  const missions = rookieMissions.map((mission) => ({
    ...mission,
    status: completed.has(mission.lessonId)
      ? "complete"
      : (Array.isArray(steps[mission.lessonId]) && steps[mission.lessonId].length)
        ? "in-progress"
        : "ready",
  }));
  const finished = missions.filter((mission) => mission.status === "complete").length;
  return {
    missions,
    finished,
    total: missions.length,
    next: missions.find((mission) => mission.status !== "complete") ?? missions[0],
    districtState: finished === missions.length ? "restored" : finished > 0 ? "rebuilding" : "waiting",
  };
}
